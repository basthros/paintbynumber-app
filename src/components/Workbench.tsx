import { useState, useRef } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import type { PaletteColor, GenerateResponse, ViewMode } from '../types';
import { generatePaintByNumber, downloadImage } from '../utils';

interface WorkbenchProps {
  palette: PaletteColor[];
}

export const Workbench: React.FC<WorkbenchProps> = ({ palette }) => {
  const [targetImage, setTargetImage] = useState<File | null>(null);
  const [targetImagePreview, setTargetImagePreview] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(50);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setTargetImage(file);
      setTargetImagePreview(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const capturePhoto = async () => {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 90,
        allowEditing: false,
        correctOrientation: true,
      });

      if (!photo.webPath) {
        throw new Error('No image captured');
      }

      // Convert to File object
      const response = await fetch(photo.webPath);
      const blob = await response.blob();
      const file = new File([blob], 'captured-photo.jpg', { type: 'image/jpeg' });

      setTargetImage(file);
      setTargetImagePreview(photo.webPath);
      setResult(null);
      setError(null);
    } catch (error) {
      console.error('Error capturing photo:', error);
      alert('Failed to capture photo. Please try again.');
    }
  };

  const generate = async () => {
    if (!targetImage) {
      alert('Please select or capture an image first');
      return;
    }

    if (palette.length === 0) {
      alert('Please add at least one color to your palette');
      return;
    }

    try {
      setProcessing(true);
      setProgress(0);
      setError(null);

      const response = await generatePaintByNumber(
        targetImage,
        palette,
        threshold,
        setProgress
      );

      setResult(response);
    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;

    const imageToDownload = viewMode === 'preview' ? result.preview : result.template;
    const filename = viewMode === 'preview' 
      ? 'paint-by-number-preview.jpg' 
      : 'paint-by-number-template.jpg';

    downloadImage(imageToDownload, filename);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Workbench</h2>

      {/* Image Upload Section */}
      {!targetImage ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <div className="space-y-4">
            <div className="text-gray-400">
              <svg
                className="mx-auto h-16 w-16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-700 mb-2">
                Upload or capture your image
              </p>
              <p className="text-sm text-gray-500">
                PNG, JPEG, or WEBP up to 10MB
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={capturePhoto}
                className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                📸 Take Photo
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                📁 Choose File
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Image Preview */}
          <div className="relative rounded-lg overflow-hidden border border-gray-200">
            <img
              src={targetImagePreview!}
              alt="Target"
              className="w-full h-auto"
            />
            <button
              onClick={() => {
                setTargetImage(null);
                setTargetImagePreview(null);
                setResult(null);
              }}
              className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {/* Threshold Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700">
                Complexity Level
              </label>
              <span className="text-sm text-gray-600">{threshold}</span>
            </div>
            <input
              type="range"
              min="10"
              max="150"
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Simple</span>
              <span>Detailed</span>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={generate}
            disabled={processing || palette.length === 0}
            className="w-full bg-green-500 text-white px-6 py-4 rounded-lg font-bold text-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? `Generating... ${Math.round(progress)}%` : '✨ Generate Paint-by-Number'}
          </button>

          {palette.length === 0 && (
            <p className="text-sm text-amber-600 text-center">
              ⚠️ Add colors to your palette first
            </p>
          )}

          {/* Progress Bar */}
          {processing && (
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-green-500 h-2 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">Results</h3>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Download
                </button>
              </div>

              {/* View Toggle */}
              <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('preview')}
                  className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                    viewMode === 'preview'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  🎨 Preview
                </button>
                <button
                  onClick={() => setViewMode('template')}
                  className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                    viewMode === 'template'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  📄 Template
                </button>
              </div>

              {/* Result Image */}
              <div className="rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={viewMode === 'preview' ? result.preview : result.template}
                  alt={viewMode === 'preview' ? 'Preview' : 'Template'}
                  className="w-full h-auto"
                />
              </div>

              {/* Dimensions Info */}
              <div className="text-sm text-gray-600 text-center">
                {result.dimensions.width} × {result.dimensions.height} pixels
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
