import axios from 'axios';
import type { PaletteColor, GenerateResponse } from './types';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Extract color from a specific point in an image
 */
export const extractColorFromImage = (
  imageFile: File,
  x?: number,
  y?: number
): Promise<[number, number, number]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Use center point if not specified
        const sampleX = x ?? Math.floor(img.width / 2);
        const sampleY = y ?? Math.floor(img.height / 2);

        // Sample a 10x10 area and average the colors for better stability
        const sampleSize = 10;
        const halfSize = Math.floor(sampleSize / 2);

        let totalR = 0, totalG = 0, totalB = 0, count = 0;

        for (let dy = -halfSize; dy <= halfSize; dy++) {
          for (let dx = -halfSize; dx <= halfSize; dx++) {
            const imageData = ctx.getImageData(
              Math.max(0, Math.min(sampleX + dx, img.width - 1)),
              Math.max(0, Math.min(sampleY + dy, img.height - 1)),
              1,
              1
            );
            totalR += imageData.data[0];
            totalG += imageData.data[1];
            totalB += imageData.data[2];
            count++;
          }
        }

        const avgR = Math.round(totalR / count);
        const avgG = Math.round(totalG / count);
        const avgB = Math.round(totalB / count);

        resolve([avgR, avgG, avgB]);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(imageFile);
  });
};

/**
 * Compress image file before upload
 */
export const compressImage = async (
  file: File,
  maxDimension: number = 1200,
  quality: number = 0.8
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Calculate new dimensions
        let { width, height } = img;

        if (width > height && width > maxDimension) {
          height = (height / width) * maxDimension;
          width = maxDimension;
        } else if (height > maxDimension) {
          width = (width / height) * maxDimension;
          height = maxDimension;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Compression failed'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Convert RGB array to hex color string
 */
export const rgbToHex = (rgb: [number, number, number]): string => {
  const [r, g, b] = rgb;
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

/**
 * Generate paint-by-number from image
 */
export const generatePaintByNumber = async (
  imageFile: File,
  palette: PaletteColor[],
  threshold: number,
  onProgress?: (progress: number) => void
): Promise<GenerateResponse> => {
  try {
    // Compress image before upload
    onProgress?.(10);
    const compressedImage = await compressImage(imageFile);
    
    onProgress?.(20);

    // Prepare form data
    const formData = new FormData();
    formData.append('file', compressedImage, imageFile.name);
    formData.append('palette', JSON.stringify(palette));
    formData.append('threshold', threshold.toString());

    onProgress?.(30);

    // Make API request
    const response = await axios.post<GenerateResponse>(
      `${API_BASE_URL}/generate`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const uploadProgress = 30 + (progressEvent.loaded / progressEvent.total) * 40;
            onProgress?.(uploadProgress);
          }
        },
      }
    );

    onProgress?.(100);

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.detail || 'Failed to generate paint-by-number'
      );
    }
    throw error;
  }
};

/**
 * Download image from base64 data URL
 */
export const downloadImage = (dataUrl: string, filename: string) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
