export interface PaletteColor {
  id: string;
  rgb: [number, number, number];
  note: string;
}

export interface GenerateResponse {
  success: boolean;
  preview: string;  // Base64 data URL
  template: string; // Base64 data URL
  dimensions: {
    width: number;
    height: number;
  };
}

export interface ProcessingState {
  isProcessing: boolean;
  progress: number;
  error: string | null;
}

export type ViewMode = 'preview' | 'template';
