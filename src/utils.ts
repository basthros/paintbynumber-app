/**
 * utils.ts - Utility functions and API calls (v2.0)
 * 
 * Updated to work with the new v2.0 API
 */

import axios, { AxiosError } from 'axios';
import { PaletteColor, GenerationResult, AnalysisResult, CompressionOptions } from './types';

// API base URL - loaded from environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Compress an image file to reduce upload size
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.85
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        
        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Could not compress image'));
              return;
            }
            
            // Create new file with compressed data
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^.]+$/, '.jpg'),
              { type: 'image/jpeg' }
            );
            
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Could not load image'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Extract a color from a specific point in an image
 * Used for camera color scanning
 */
export async function extractColorFromImage(
  file: File,
  x?: number,
  y?: number,
  sampleSize: number = 10
): Promise<[number, number, number]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        
        // Default to center if no coordinates provided
        const centerX = x ?? Math.floor(img.width / 2);
        const centerY = y ?? Math.floor(img.height / 2);
        
        // Sample a small area around the point
        const halfSample = Math.floor(sampleSize / 2);
        const startX = Math.max(0, centerX - halfSample);
        const startY = Math.max(0, centerY - halfSample);
        const endX = Math.min(img.width, centerX + halfSample);
        const endY = Math.min(img.height, centerY + halfSample);
        
        const imageData = ctx.getImageData(
          startX, 
          startY, 
          endX - startX, 
          endY - startY
        );
        
        // Average the colors
        let r = 0, g = 0, b = 0, count = 0;
        
        for (let i = 0; i < imageData.data.length; i += 4) {
          r += imageData.data[i];
          g += imageData.data[i + 1];
          b += imageData.data[i + 2];
          count++;
        }
        
        resolve([
          Math.round(r / count),
          Math.round(g / count),
          Math.round(b / count)
        ]);
      };
      
      img.onerror = () => reject(new Error('Could not load image'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Convert palette to API format
 */
function formatPaletteForAPI(palette: PaletteColor[]): string {
  const formatted = palette.map(color => ({
    id: color.id,
    rgb: color.rgb,
    note: color.note || ''
  }));
  return JSON.stringify(formatted);
}

/**
 * Generate paint-by-number from an image
 * 
 * @param file - Image file to process
 * @param palette - Array of palette colors
 * @param complexity - Complexity level 1-100 (higher = more detail)
 * @returns Generation result with preview, template, etc.
 */
export async function generatePaintByNumber(
  file: File,
  palette: PaletteColor[],
  complexity: number = 50
): Promise<GenerationResult> {
  // Validate inputs
  if (!file) {
    throw new Error('No image file provided');
  }
  
  if (palette.length < 2) {
    throw new Error('Palette must have at least 2 colors');
  }
  
  if (complexity < 1 || complexity > 100) {
    throw new Error('Complexity must be between 1 and 100');
  }

  // Create form data
  const formData = new FormData();
  formData.append('file', file);
  formData.append('palette', formatPaletteForAPI(palette));
  formData.append('threshold', complexity.toString());

  try {
    const response = await axios.post<GenerationResult>(
      `${API_URL}/generate`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minute timeout for processing
      }
    );

    // Map response to our interface (handle potential naming differences)
    const data = response.data;
    return {
      success: data.success,
      preview: data.preview,
      template: data.template,
      templateSvg: (data as any).template_svg || (data as any).templateSvg,
      colorKey: (data as any).color_key || (data as any).colorKey,
      dimensions: data.dimensions,
      regionCount: (data as any).region_count || (data as any).regionCount || 0,
      colorsUsed: (data as any).colors_used || (data as any).colorsUsed || 0,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ detail: string }>;
      
      if (axiosError.response) {
        // Server responded with error
        const status = axiosError.response.status;
        const detail = axiosError.response.data?.detail || 'Unknown error';
        
        switch (status) {
          case 400:
            throw new Error(`Invalid request: ${detail}`);
          case 413:
            throw new Error('Image file is too large. Maximum size is 10MB.');
          case 415:
            throw new Error('Unsupported file type. Use PNG, JPEG, or WEBP.');
          case 500:
            throw new Error(`Server error: ${detail}`);
          default:
            throw new Error(`Request failed (${status}): ${detail}`);
        }
      } else if (axiosError.request) {
        // Network error
        throw new Error('Could not connect to server. Please check your internet connection.');
      }
    }
    
    throw error;
  }
}

/**
 * Analyze an image against a palette without generating full output
 * Useful for quick feedback on palette coverage
 */
export async function analyzeImage(
  file: File,
  palette: PaletteColor[]
): Promise<AnalysisResult> {
  if (!file) {
    throw new Error('No image file provided');
  }
  
  if (palette.length < 2) {
    throw new Error('Palette must have at least 2 colors');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('palette', formatPaletteForAPI(palette));

  try {
    const response = await axios.post(
      `${API_URL}/analyze`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout
      }
    );

    // Map snake_case to camelCase
    const data = response.data;
    return {
      success: data.success,
      imageDimensions: data.image_dimensions,
      paletteCoverage: data.palette_coverage,
      qualityMetrics: {
        averageColorDistance: data.quality_metrics?.average_color_distance,
        maxColorDistance: data.quality_metrics?.max_color_distance,
        paletteFitScore: data.quality_metrics?.palette_fit_score,
      },
      recommendations: data.recommendations || [],
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const detail = (error.response?.data as any)?.detail || 'Analysis failed';
      throw new Error(detail);
    }
    throw error;
  }
}

/**
 * Download SVG template directly from API
 */
export async function downloadSVGTemplate(
  file: File,
  palette: PaletteColor[],
  complexity: number = 50,
  showNumbers: boolean = true,
  fillRegions: boolean = false
): Promise<Blob> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('palette', formatPaletteForAPI(palette));
  formData.append('threshold', complexity.toString());
  formData.append('show_numbers', showNumbers.toString());
  formData.append('fill_regions', fillRegions.toString());

  try {
    const response = await axios.post(
      `${API_URL}/generate/svg`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        responseType: 'blob',
        timeout: 120000,
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error('SVG generation failed');
    }
    throw error;
  }
}

/**
 * Check API health status
 */
export async function checkAPIHealth(): Promise<{
  status: string;
  version: string;
  features: Record<string, boolean>;
}> {
  try {
    const response = await axios.get(`${API_URL}/`, { timeout: 5000 });
    return response.data;
  } catch (error) {
    throw new Error('API is not available');
  }
}

/**
 * Convert RGB to hex color string
 */
export function rgbToHex(rgb: [number, number, number]): string {
  return '#' + rgb.map(c => c.toString(16).padStart(2, '0')).join('');
}

/**
 * Convert hex color string to RGB
 */
export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error('Invalid hex color');
  }
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ];
}

/**
 * Calculate relative luminance of a color
 * Used for determining text color (black/white) on backgrounds
 */
export function getLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map(c => {
    const normalized = c / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Determine if text should be black or white based on background color
 */
export function getContrastTextColor(rgb: [number, number, number]): 'black' | 'white' {
  return getLuminance(rgb) > 0.179 ? 'black' : 'white';
}

/**
 * Generate a unique ID for a new palette color
 */
export function generateColorId(existingIds: string[]): string {
  // Try numeric IDs first
  for (let i = 1; i <= 99; i++) {
    const id = i.toString();
    if (!existingIds.includes(id)) {
      return id;
    }
  }
  
  // Fall back to letter-based IDs
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (const letter of letters) {
    if (!existingIds.includes(letter)) {
      return letter;
    }
  }
  
  // Last resort: random string
  return Math.random().toString(36).substring(2, 5).toUpperCase();
}
