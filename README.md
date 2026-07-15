# RAM Market Price Tracker

A React-based web application that tracks RAM prices with real-time updates, historical data, and future predictions. Features an Apple Stocks-inspired interface with multi-line charts for DDR4, DDR5, and average prices.

## Features

- **Real-time Price Tracking**: Live updates with future price predictions
- **Multi-Type Comparison**: Separate lines for DDR4, DDR5, and average prices
- **Historical Data**: Daily price data from January 2024 to present
- **Time Range Filters**: View data by 1D, 5D, 1M, 6M, YTD, 1Y, or ALL
- **Apple Stocks Design**: Dark theme with clean, modern interface
- **Responsive**: Works on desktop, tablet, and mobile devices

## For End Users - Getting the Android APK

**No installation required!** Just download and install the APK.

### Option 1: Download from GitHub Actions (Recommended)
1. Go to the GitHub repository's "Actions" tab
2. Select the latest "Build Android APK" workflow run
3. Scroll down to "Artifacts" section
4. Download `ram-market-tracker-apk`
5. Extract and install the APK on your Android device

### Option 2: Direct APK Download
1. Download the latest APK from the Releases section
2. Enable "Install from unknown sources" in Android settings
3. Tap the APK file to install

### Installation Steps
1. Download the APK file
2. On your Android device, go to Settings > Security
3. Enable "Unknown sources" or "Install unknown apps"
4. Open the APK file and tap "Install"
5. Once installed, open the app from your home screen

## For Developers

### Local Development
```bash
npm install
npm run dev
```

### Building for Web
```bash
npm run build
```

### Building Android APK Locally
Requires Java JDK 17+ and Android SDK:
```bash
npm install
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```

### Cloud Build (Recommended)
Push to GitHub and the APK will be automatically built via GitHub Actions.

## Project Structure
- `src/App.jsx` - Main React component
- `src/data/ramPrices.js` - Historical price data
- `src/utils/aggregateRamPrices.js` - Data aggregation logic
- `src/utils/realTimePriceSimulator.js` - Price simulation and API integration
- `android/` - Capacitor Android project

## Technologies
- React 18
- Recharts (charting)
- TailwindCSS (styling)
- Capacitor (mobile app wrapper)
- Vite (build tool)

## Data Sources
- Historical data based on RAMPricesUSA pricing
- Real-time API integration with ram.soonoo.me
- Future price simulation for live updates

## License
MIT
