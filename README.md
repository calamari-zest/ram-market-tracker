# RAM Market Price Tracker

A React-based web application that tracks RAM prices with real-time updates, historical data, and future predictions. Features an Apple Stocks-inspired interface with multi-line charts for DDR4, DDR5, and average prices.

## Features

- **Real-time Price Tracking**: Live updates with future price predictions
- **Multi-Type Comparison**: Separate lines for DDR4, DDR5, and average prices
- **Historical Data**: Daily price data from January 2024 to present
- **Time Range Filters**: View data by 1D, 5D, 1M, 6M, YTD, 1Y, or ALL
- **Apple Stocks Design**: Dark theme with clean, modern interface
- **Responsive**: Works on desktop, tablet, and mobile devices

## For End Users

### Web Version (Recommended)
Simply open the web app in your browser - no installation required:
- **Live URL:** https://calamari-zest.github.io/ram-market-tracker/
- Works on any device with a web browser (Android, iOS, desktop)
- Can be added to home screen for app-like experience
- No APK or installation needed
- Zero setup required

### Android APK
If you need a native Android app, you can build the APK manually or use a cloud build service.

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
Requires Java JDK 11+ and Android SDK:
```bash
npm install
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```

The APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

### Cloud Build (Recommended for APK)
**Using Bitrise (Recommended):**
1. Go to https://bitrise.io and sign up for free
2. Click "Add new app" and select GitHub
3. Connect your GitHub account and select this repository
4. Bitrise will automatically detect the `bitrise.yml` file
5. Click "Start a build" to generate the APK
6. Download the APK from the build artifacts

**Using GitHub Actions (Manual):**
1. Go to the Actions tab in GitHub
2. Select "Build Android APK" workflow
3. Click "Run workflow" to manually trigger a build
4. Download the APK from artifacts once complete

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
