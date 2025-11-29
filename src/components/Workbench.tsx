/**
 * Workbench.tsx - Image-to-Template Conversion Component (v2.0)
 * 
 * New features:
 * - SVG download support for high-quality printing
 * - Color key display
 * - Region count and color statistics
 * - Overlay view mode
 * - Improved progress feedback
 * - Better error handling
 */

import React, { useState, useRef, useCallback } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { PaletteColor, GenerationResult } from '../types';
import { generatePaintByNumber, compressImage } from '../utils';

interface WorkbenchProps {
  palette: PaletteColor[];
}

type ViewMode = 'preview' | 'template' | 'overlay';

export const Workbench: React.FC<WorkbenchProps> = ({ palette }) => {
  // State
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [complexity, setComplexity] = useState(50);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [overlayOpacity, setOverlayOpacity] = useState(0.5);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection from input
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPEG, or WEBP)');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image is too large. Maximum size is 10MB.');
      return;
    }

    try {
      // Compress image before storing
      const compressed = await compressImage(file);
      setImage(compressed);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(compressed);
      setImagePreview(previewUrl);
      
      // Clear previous results
      setResult(null);
    } catch (err) {
      setError('Failed to process image. Please try another file.');
      console.error('Image processing error:', err);
    }
  }, []);

  // Handle camera capture (for mobile)
  const handleCameraCapture = useCallback(async () => {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      });

      if (photo.base64String) {
        // Convert base64 to File
        const response = await fetch(`data:image/jpeg;base64,${photo.base64String}`);
        const blob = await response.blob();
        const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
        
        const compressed = await compressImage(file);
        setImage(compressed);
        setImagePreview(`data:image/jpeg;base64,${photo.base64String}`);
        setResult(null);
        setError(null);
      }
    } catch (err) {
      // User cancelled or camera not available - not an error
      console.log('Camera cancelled or unavailable');
    }
  }, []);

  // Handle gallery selection (for mobile)
  const handleGallerySelect = useCallback(async () => {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
      });

      if (photo.base64String) {
        const response = await fetch(`data:image/${photo.format};base64,${photo.base64String}`);
        const blob = await response.blob();
        const file = new File([blob], `gallery-photo.${photo.format}`, { 
          type: `image/${photo.format}` 
        });
        
        const compressed = await compressImage(file);
        setImage(compressed);
        setImagePreview(`data:image/${photo.format};base64,${photo.base64String}`);
        setResult(null);
        setError(null);
      }
    } catch (err) {
      console.log('Gallery selection cancelled');
    }
  }, []);

  // Generate paint-by-number
  const handleGenerate = useCallback(async () => {
    if (!image) {
      setError('Please select an image first');
      return;
    }

    if (palette.length < 2) {
      setError('Please add at least 2 colors to your palette');
      return;
    }

    setLoading(true);
    setError(null);
    setProgress('Uploading image...');

    try {
      setProgress('Processing image...');
      const generationResult = await generatePaintByNumber(image, palette, complexity);
      
      setProgress('Complete!');
      setResult(generationResult);
      setViewMode('preview');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      setError(message);
      console.error('Generation error:', err);
    } finally {
      setLoading(false);
      setProgress('');
    }
  }, [image, palette, complexity]);

  // Download functions
  const downloadImage = useCallback((dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const handleDownloadPreview = useCallback(() => {
    if (result?.preview) {
      downloadImage(result.preview, 'paint-by-number-preview.png');
    }
  }, [result, downloadImage]);

  const handleDownloadTemplate = useCallback(() => {
    if (result?.template) {
      downloadImage(result.template, 'paint-by-number-template.png');
    }
  }, [result, downloadImage]);

  const handleDownloadSVG = useCallback(() => {
    if (result?.templateSvg) {
      downloadImage(result.templateSvg, 'paint-by-number-template.svg');
    }
  }, [result, downloadImage]);

  const handleDownloadColorKey = useCallback(() => {
    if (result?.colorKey) {
      downloadImage(result.colorKey, 'paint-by-number-color-key.svg');
    }
  }, [result, downloadImage]);

  // Clear everything
  const handleClear = useCallback(() => {
    setImage(null);
    setImagePreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Get complexity label
  const getComplexityLabel = (value: number): string => {
    if (value <= 25) return 'Simple (Easy to Paint)';
    if (value <= 50) return 'Moderate';
    if (value <= 75) return 'Detailed';
    return 'Very Detailed (Challenging)';
  };

  return (
    <div className="workbench p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-800">Create Template</h2>
        <p className="text-sm text-gray-600">
          Upload an image and generate a paint-by-number template
        </p>
      </div>

      {/* Image Upload Section */}
      <div className="upload-section bg-gray-50 rounded-lg p-4">
        {!imagePreview ? (
          <div className="space-y-4">
            {/* File Input */}
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileSelect}
                className="hidden"
                id="image-upload"
              />
              <label 
                htmlFor="image-upload"
                className="cursor-pointer text-center"
              >
                <div className="text-4xl mb-2">📷</div>
                <p className="text-gray-600 font-medium">Click to upload image</p>
                <p className="text-sm text-gray-400">PNG, JPEG, or WEBP (max 10MB)</p>
              </label>
            </div>

            {/* Mobile Camera Options */}
            <div className="flex gap-2">
              <button
                onClick={handleCameraCapture}
                className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <span>📸</span> Camera
              </button>
              <button
                onClick={handleGallerySelect}
                className="flex-1 py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
              >
                <span>🖼️</span> Gallery
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Image Preview */}
            <div className="relative">
              <img 
                src={imagePreview} 
                alt="Selected" 
                className="w-full max-h-64 object-contain rounded-lg"
              />
              <button
                onClick={handleClear}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
                title="Remove image"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Complexity Slider */}
      {imagePreview && (
        <div className="complexity-section bg-gray-50 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Detail Level: {complexity}
          </label>
          <input
            type="range"
            min={1}
            max={100}
            value={complexity}
            onChange={(e) => setComplexity(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Simple</span>
            <span>Detailed</span>
          </div>
          <p className="text-sm text-gray-600 mt-2 text-center">
            {getComplexityLabel(complexity)}
          </p>
        </div>
      )}

      {/* Palette Info */}
      {imagePreview && (
        <div className="palette-info bg-blue-50 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Palette:</span> {palette.length} colors selected
            {palette.length < 2 && (
              <span className="text-red-600 ml-2">
                (Need at least 2 colors)
              </span>
            )}
          </p>
        </div>
      )}

      {/* Generate Button */}
      {imagePreview && (
        <button
          onClick={handleGenerate}
          disabled={loading || palette.length < 2}
          className={`w-full py-3 px-6 rounded-lg font-medium text-white transition-colors ${
            loading || palette.length < 2
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span>
              {progress || 'Processing...'}
            </span>
          ) : (
            'Generate Template'
          )}
        </button>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="results-section space-y-4">
          {/* Stats Bar */}
          <div className="stats-bar bg-green-50 rounded-lg p-3 flex justify-around text-center">
            <div>
              <p className="text-2xl font-bold text-green-700">{result.regionCount}</p>
              <p className="text-xs text-green-600">Regions</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{result.colorsUsed}</p>
              <p className="text-xs text-green-600">Colors Used</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">
                {result.dimensions.width}×{result.dimensions.height}
              </p>
              <p className="text-xs text-green-600">Pixels</p>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="view-toggle flex rounded-lg overflow-hidden border border-gray-300">
            <button
              onClick={() => setViewMode('preview')}
              className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
                viewMode === 'preview'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Preview
            </button>
            <button
              onClick={() => setViewMode('template')}
              className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
                viewMode === 'template'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Template
            </button>
            <button
              onClick={() => setViewMode('overlay')}
              className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
                viewMode === 'overlay'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Overlay
            </button>
          </div>

          {/* Result Image Display */}
          <div className="result-display bg-gray-100 rounded-lg p-2 min-h-64">
            {viewMode === 'preview' && result.preview && (
              <img 
                src={result.preview} 
                alt="Preview" 
                className="w-full h-auto rounded"
              />
            )}
            
            {viewMode === 'template' && result.template && (
              <img 
                src={result.template} 
                alt="Template" 
                className="w-full h-auto rounded bg-white"
              />
            )}
            
            {viewMode === 'overlay' && (
              <div className="relative">
                <img 
                  src={result.template} 
                  alt="Template" 
                  className="w-full h-auto rounded bg-white"
                />
                <img 
                  src={result.preview} 
                  alt="Preview overlay" 
                  className="absolute top-0 left-0 w-full h-auto rounded"
                  style={{ opacity: overlayOpacity }}
                />
                {/* Overlay Opacity Slider */}
                <div className="absolute bottom-2 left-2 right-2 bg-white bg-opacity-90 rounded p-2">
                  <label className="text-xs text-gray-600">
                    Color Opacity: {Math.round(overlayOpacity * 100)}%
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={overlayOpacity * 100}
                    onChange={(e) => setOverlayOpacity(Number(e.target.value) / 100)}
                    className="w-full h-1"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Color Key */}
          {result.colorKey && (
            <div className="color-key-section">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Color Key</h3>
              <div className="bg-white rounded-lg border overflow-hidden">
                <img 
                  src={result.colorKey} 
                  alt="Color Key" 
                  className="w-full h-auto"
                />
              </div>
            </div>
          )}

          {/* Download Buttons */}
          <div className="download-section space-y-2">
            <h3 className="text-sm font-medium text-gray-700">Download</h3>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownloadPreview}
                className="py-2 px-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
              >
                📥 Preview (PNG)
              </button>
              
              <button
                onClick={handleDownloadTemplate}
                className="py-2 px-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
              >
                📥 Template (PNG)
              </button>
            </div>

            {/* SVG Download - Best for printing */}
            {result.templateSvg && (
              <button
                onClick={handleDownloadSVG}
                className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                📄 Download SVG (Best for Printing)
              </button>
            )}

            {/* Color Key Download */}
            {result.colorKey && (
              <button
                onClick={handleDownloadColorKey}
                className="w-full py-2 px-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
              >
                🎨 Download Color Key
              </button>
            )}
          </div>

          {/* Print Tips */}
          <div className="print-tips bg-yellow-50 rounded-lg p-4 text-sm">
            <h4 className="font-medium text-yellow-800 mb-2">🖨️ Printing Tips</h4>
            <ul className="text-yellow-700 space-y-1 list-disc list-inside">
              <li>Use <strong>SVG format</strong> for the sharpest print quality</li>
              <li>Print at 100% scale for best results</li>
              <li>Use white paper for accurate colors</li>
              <li>Print the color key separately as a reference</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workbench;
