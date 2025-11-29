/**
 * types.ts - TypeScript type definitions (v2.0)
 * 
 * Updated to include new API response fields
 */

/**
 * Represents a color in the user's palette
 */
export interface PaletteColor {
  /** Unique identifier (e.g., "1", "2", "A", etc.) */
  id: string;
  
  /** RGB color values [R, G, B], each 0-255 */
  rgb: [number, number, number];
  
  /** Optional note/name for the color (e.g., "Cadmium Red", "Mix: 2 parts white + 1 part blue") */
  note?: string;
}

/**
 * API response from /generate endpoint
 */
export interface GenerationResult {
  /** Whether generation was successful */
  success: boolean;
  
  /** Base64-encoded preview image (colored) */
  preview: string;
  
  /** Base64-encoded template image (line art with numbers) */
  template: string;
  
  /** Base64-encoded SVG template (optional, best for printing) */
  templateSvg?: string;
  
  /** Base64-encoded color key/legend */
  colorKey?: string;
  
  /** Output dimensions */
  dimensions: {
    width: number;
    height: number;
  };
  
  /** Number of paintable regions generated */
  regionCount: number;
  
  /** Number of palette colors actually used */
  colorsUsed: number;
}

/**
 * API response from /analyze endpoint
 */
export interface AnalysisResult {
  success: boolean;
  
  imageDimensions: {
    width: number;
    height: number;
  };
  
  /** Coverage statistics for each palette color */
  paletteCoverage: {
    [colorId: string]: {
      pixelCount: number;
      percentage: number;
      avgDistance: number;
    };
  };
  
  /** Overall quality metrics */
  qualityMetrics: {
    averageColorDistance: number;
    maxColorDistance: number;
    paletteFitScore: number;
  };
  
  /** Suggestions for improving results */
  recommendations: Recommendation[];
}

/**
 * A recommendation from the analysis
 */
export interface Recommendation {
  type: 'unused_colors' | 'dominant_color' | 'poor_palette_fit' | 'moderate_palette_fit';
  message: string;
  severity: 'info' | 'warning' | 'error';
}

/**
 * Props for the Workbench component
 */
export interface WorkbenchProps {
  palette: PaletteColor[];
}

/**
 * Props for the PaintLab component
 */
export interface PaintLabProps {
  palette: PaletteColor[];
  onPaletteChange: (palette: PaletteColor[]) => void;
}

/**
 * API Error response
 */
export interface APIError {
  detail: string;
}

/**
 * Image compression options
 */
export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}
