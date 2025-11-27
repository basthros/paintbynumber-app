import { useState } from 'react';
import type { PaletteColor, GenerateResponse } from './types';
import { PaintLab } from './components/PaintLab';
import { Workbench } from './components/Workbench';

function App() {
  const [palette, setPalette] = useState<PaletteColor[]>([]);
  const [activeTab, setActiveTab] = useState<'lab' | 'workbench'>('lab');
  const [targetImage, setTargetImage] = useState<File | null>(null);
  const [targetImagePreview, setTargetImagePreview] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);

  const handleReset = () => {
    setTargetImage(null);
    setTargetImagePreview(null);
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            🎨 Paint by Number Studio
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Create custom paint-by-number templates from your photos
          </p>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="flex gap-2 bg-white rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('lab')}
            className={`flex-1 px-6 py-3 rounded-md font-medium transition-all ${
              activeTab === 'lab'
                ? 'bg-primary text-white shadow-md'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <span>🧪</span>
              <span>Paint Lab</span>
              {palette.length > 0 && (
                <span className="bg-white text-primary text-xs px-2 py-0.5 rounded-full font-bold">
                  {palette.length}
                </span>
              )}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('workbench')}
            className={`flex-1 px-6 py-3 rounded-md font-medium transition-all ${
              activeTab === 'workbench'
                ? 'bg-primary text-white shadow-md'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <span>🔨</span>
              <span>Workbench</span>
            </span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 pb-12">
        {activeTab === 'lab' ? (
          <div className="space-y-6">
            <PaintLab palette={palette} onPaletteChange={setPalette} />
            
            {palette.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 text-sm">
                  ✅ Great! You have <strong>{palette.length} color{palette.length !== 1 ? 's' : ''}</strong> in your palette.
                  Switch to the <strong>Workbench</strong> tab to generate your paint-by-number!
                </p>
              </div>
            )}
          </div>
        ) : (
          <Workbench
            palette={palette}
            targetImage={targetImage}
            setTargetImage={setTargetImage}
            targetImagePreview={targetImagePreview}
            setTargetImagePreview={setTargetImagePreview}
            result={result}
            setResult={setResult}
            onReset={handleReset}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-gray-600">
          <p className="mb-2">
            Built with FastAPI, React, and Capacitor
          </p>
          <p className="text-xs text-gray-500">
            Uses LAB color space and KD-tree for perceptually accurate color matching
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
