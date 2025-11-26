import { useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import type { PaletteColor } from '../types';
import { extractColorFromImage, rgbToHex } from '../utils';

interface PaintLabProps {
  palette: PaletteColor[];
  onPaletteChange: (palette: PaletteColor[]) => void;
}

export const PaintLab: React.FC<PaintLabProps> = ({ palette, onPaletteChange }) => {
  const [scanning, setScanning] = useState(false);

  const scanColor = async () => {
    try {
      setScanning(true);

      // Take photo using Capacitor Camera API
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

      // Convert to File object for processing
      const response = await fetch(photo.webPath);
      const blob = await response.blob();
      const file = new File([blob], 'color-sample.jpg', { type: 'image/jpeg' });

      // Extract color from center of image
      const rgb = await extractColorFromImage(file);

      // Add to palette with auto-generated ID
      const newColor: PaletteColor = {
        id: (palette.length + 1).toString(),
        rgb,
        note: '',
      };

      onPaletteChange([...palette, newColor]);
    } catch (error) {
      console.error('Error scanning color:', error);
      alert('Failed to scan color. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  const addManualColor = () => {
    const newColor: PaletteColor = {
      id: (palette.length + 1).toString(),
      rgb: [128, 128, 128], // Default gray
      note: '',
    };
    onPaletteChange([...palette, newColor]);
  };

  const removeColor = (id: string) => {
    onPaletteChange(palette.filter((c) => c.id !== id));
  };

  const updateColorNote = (id: string, note: string) => {
    onPaletteChange(
      palette.map((c) => (c.id === id ? { ...c, note } : c))
    );
  };

  const updateColorRgb = (id: string, hex: string) => {
    // Convert hex to RGB
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    onPaletteChange(
      palette.map((c) => (c.id === id ? { ...c, rgb: [r, g, b] as [number, number, number] } : c))
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Paint Lab</h2>
        <span className="text-sm text-gray-600">{palette.length} colors</span>
      </div>

      <p className="text-gray-600 mb-6">
        Scan paint colors or add them manually to create your custom palette.
      </p>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={scanColor}
          disabled={scanning}
          className="flex-1 bg-primary text-white px-4 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {scanning ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Scanning...
            </span>
          ) : (
            '📸 Scan Color'
          )}
        </button>

        <button
          onClick={addManualColor}
          className="flex-1 bg-gray-200 text-gray-800 px-4 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
        >
          ➕ Add Manual
        </button>
      </div>

      {/* Palette Colors */}
      {palette.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">No colors yet</p>
          <p className="text-sm">Scan or add colors to build your palette</p>
        </div>
      ) : (
        <div className="space-y-3">
          {palette.map((color) => (
            <div
              key={color.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              {/* Color ID */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center font-bold text-sm">
                {color.id}
              </div>

              {/* Color Swatch */}
              <div
                className="flex-shrink-0 w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm cursor-pointer relative"
                style={{ backgroundColor: rgbToHex(color.rgb) }}
              >
                <input
                  type="color"
                  value={rgbToHex(color.rgb)}
                  onChange={(e) => updateColorRgb(color.id, e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>

              {/* Color Info */}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-mono text-gray-500 mb-1">
                  RGB({color.rgb.join(', ')})
                </div>
                <input
                  type="text"
                  value={color.note}
                  onChange={(e) => updateColorNote(color.id, e.target.value)}
                  placeholder="Paint recipe note..."
                  className="w-full text-sm border-b border-gray-300 focus:border-primary outline-none bg-transparent py-1"
                />
              </div>

              {/* Remove Button */}
              <button
                onClick={() => removeColor(color.id)}
                className="flex-shrink-0 text-red-500 hover:text-red-700 p-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {palette.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Click the color swatch to manually adjust colors, or add notes
            about your paint recipes (e.g., "50% Red + 50% White").
          </p>
        </div>
      )}
    </div>
  );
};
