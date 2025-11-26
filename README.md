# Paint by Number App (Frontend)

A mobile-first React application for creating custom paint-by-number templates from photos using a user-defined color palette.

## Features

- **📸 Camera Integration**: Scan real-world paint colors using your device camera
- **🎨 Custom Palette Management**: Build your own palette with notes for paint recipes
- **🖼️ Image Processing**: Upload or capture photos to convert into templates
- **⚙️ Complexity Control**: Adjust detail level with an intuitive threshold slider
- **📱 Mobile-First Design**: Built with Capacitor for native mobile features
- **💾 Download Results**: Save both preview and line art templates

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Capacitor 5** for mobile deployment (iOS & Android)
- **Tailwind CSS** for styling
- **Axios** for API communication
- **Ionic PWA Elements** for camera functionality

## Prerequisites

- Node.js 18+ and npm
- For mobile development:
  - **iOS**: Xcode 14+ (macOS only)
  - **Android**: Android Studio with Android SDK 33+

## Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd paintbynumber-app
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment**

```bash
cp .env.example .env
```

Edit `.env` and set your backend API URL:
```
VITE_API_URL=http://localhost:8000
```

## Development

### Web Development Mode

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Mobile Development

### Initial Setup

1. **Build the web app first**

```bash
npm run build
```

2. **Add platforms**

```bash
# Add iOS (macOS only)
npx cap add ios

# Add Android
npx cap add android
```

3. **Sync web assets to native projects**

```bash
npx cap sync
```

### iOS Development

```bash
npm run ios
```

This opens Xcode. You can then:
- Run on a simulator
- Run on a physical device (requires Apple Developer account)
- Configure signing & capabilities

**Note**: Camera access requires adding the following to `Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>We need camera access to scan paint colors and capture photos.</string>
```

### Android Development

```bash
npm run android
```

This opens Android Studio. You can then:
- Run on an emulator
- Run on a physical device (enable USB debugging)
- Build APK or App Bundle

**Note**: Camera access requires adding permissions to `AndroidManifest.xml` (Capacitor adds these automatically).

## Application Structure

```
src/
├── components/
│   ├── PaintLab.tsx       # Color palette management
│   └── Workbench.tsx      # Image upload and generation
├── types.ts               # TypeScript type definitions
├── utils.ts               # API calls and image processing utilities
├── App.tsx                # Main application component
├── main.tsx               # Application entry point
└── index.css              # Global styles with Tailwind
```

## Key Components

### PaintLab

Manages the custom color palette:
- Camera color scanning with center-point sampling
- Manual color addition
- Color picker for adjustments
- Paint recipe notes
- Color removal

### Workbench

Handles image-to-template conversion:
- Image upload or camera capture
- Complexity threshold slider (10-150)
- Real-time progress tracking
- Preview/Template view toggle
- Download functionality

## API Integration

The app communicates with the FastAPI backend:

```typescript
// Generate paint-by-number
POST /generate
- file: Image file (multipart/form-data)
- palette: JSON array of colors
- threshold: Complexity level (10-150)

Response:
{
  "success": true,
  "preview": "data:image/jpeg;base64,...",
  "template": "data:image/jpeg;base64,...",
  "dimensions": { "width": 800, "height": 600 }
}
```

## Configuration

### API URL

Set in `.env`:
```
VITE_API_URL=http://localhost:8000
```

For mobile development, use your computer's local IP:
```
VITE_API_URL=http://192.168.1.100:8000
```

### Capacitor Configuration

Edit `capacitor.config.json` to customize:
- App ID: `appId`
- App Name: `appName`
- Server configuration

For development with live reload on mobile:
```json
{
  "server": {
    "url": "http://192.168.1.100:5173",
    "cleartext": true
  }
}
```

Then run `npx cap sync` and rebuild.

## Image Processing

### Color Extraction

The app samples a 10×10 pixel area and averages RGB values for stable color detection from camera images:

```typescript
extractColorFromImage(file, x?, y?) -> [r, g, b]
```

### Image Compression

Before upload, images are compressed to reduce bandwidth:
- Max dimension: 1200px
- Quality: 80%
- Format: JPEG

## Deployment

### Web Deployment

1. Build the app:
```bash
npm run build
```

2. Deploy the `dist/` folder to any static hosting:
   - Vercel
   - Netlify
   - GitHub Pages
   - AWS S3 + CloudFront

### Mobile App Stores

#### iOS App Store

1. Open in Xcode: `npm run ios`
2. Configure signing with your Apple Developer account
3. Archive the app: Product → Archive
4. Upload to App Store Connect
5. Submit for review

#### Google Play Store

1. Open in Android Studio: `npm run android`
2. Generate signed APK/AAB: Build → Generate Signed Bundle/APK
3. Upload to Google Play Console
4. Complete store listing and submit

## Troubleshooting

### Camera Not Working

**Web**: Ensure you're on HTTPS (camera requires secure context) or localhost.

**iOS**: 
- Add camera usage description to `Info.plist`
- Check app permissions in Settings

**Android**:
- Verify permissions in `AndroidManifest.xml`
- Check app permissions in Settings

### CORS Errors

Ensure the backend has proper CORS configuration for your frontend URL:

```python
# In FastAPI backend
origins = [
    "http://localhost:5173",
    "capacitor://localhost",  # iOS
    "http://localhost",        # Android
]
```

### "Failed to generate" Errors

1. Check backend is running: `curl http://localhost:8000/`
2. Verify API URL in `.env`
3. Ensure palette has at least one color
4. Check image file format (PNG, JPEG, WEBP only)
5. Confirm image size < 10MB

### Build Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Capacitor builds
rm -rf android ios
npm run sync
```

## Performance Optimization

### Image Size

The app automatically compresses images before upload:
- Reduces load on mobile networks
- Faster processing times
- Better user experience

### Palette Size

For best performance:
- 5-15 colors: Fast processing, good results
- 15-30 colors: Moderate processing time
- 30+ colors: Slower but more detailed

## Development Tips

### Hot Reload on Mobile

Use the Vite dev server with local network access:

1. Start dev server:
```bash
npm run dev -- --host
```

2. Note your local IP (e.g., 192.168.1.100:5173)

3. Update `capacitor.config.json`:
```json
{
  "server": {
    "url": "http://192.168.1.100:5173",
    "cleartext": true
  }
}
```

4. Sync and run:
```bash
npx cap sync
npm run ios  # or npm run android
```

Now changes will hot-reload on your mobile device!

### Debugging Mobile

**iOS**: Use Safari Web Inspector (Safari → Develop → Your Device)

**Android**: Use Chrome DevTools (chrome://inspect)

## License

MIT

## Contributing

Pull requests welcome! Please ensure:
- Code follows TypeScript best practices
- Components are properly typed
- Responsive design works on mobile
- Tests pass (if applicable)
