# Telegram Drive — Android

A mobile app that turns your Telegram account into unlimited cloud storage.  
Built with **Ionic React** + **Capacitor** + **GramJS (MTProto)**.

---

## Features

- Phone number authentication with verification code + 2FA support
- Browse files in Saved Messages and private channels (used as folders)
- Grid and list view with search
- Upload any file via the + button
- Preview images, videos, and audio in-app
- Delete files
- Pull-to-refresh
- Dark Telegram-themed UI

---

## Prerequisites

Install all of the following before you start.

### 1. Node.js (v18 or higher)
Download from https://nodejs.org or use a version manager like `nvm`:
```bash
nvm install 20
nvm use 20
```
Verify:
```bash
node --version   # v20.x.x
npm --version    # 10.x.x
```

### 2. Java 21 (JDK)
Gradle requires **Java 21**. Java 25 will not work.

**Ubuntu / Debian:**
```bash
sudo apt install openjdk-21-jdk
```
**Fedora / RHEL:**
```bash
sudo dnf install java-21-openjdk-devel
```
**macOS (Homebrew):**
```bash
brew install openjdk@21
```
Verify:
```bash
java -version   # openjdk version "21.x.x"
```

### 3. Android SDK

**Option A — Install Android Studio (easiest)**  
Download from https://developer.android.com/studio  
During setup choose: Android SDK, Android SDK Platform 34, Android SDK Build-Tools 34.

**Option B — Command line tools only**
```bash
# Create SDK directory
mkdir -p ~/Android/Sdk/cmdline-tools

# Download command line tools (Linux)
curl -o /tmp/cmdline-tools.zip \
  "https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip"

# Extract
unzip /tmp/cmdline-tools.zip -d ~/Android/Sdk/cmdline-tools
mv ~/Android/Sdk/cmdline-tools/cmdline-tools ~/Android/Sdk/cmdline-tools/latest

# Install SDK components
export ANDROID_HOME=~/Android/Sdk
yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager \
  --sdk_root=$ANDROID_HOME \
  "platform-tools" \
  "platforms;android-34" \
  "build-tools;34.0.0" \
  "ndk;27.0.12077973"
```

Set environment variables (add to `~/.bashrc` or `~/.zshrc`):
```bash
export ANDROID_HOME=~/Android/Sdk
export ANDROID_SDK_ROOT=~/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin
```

---

## Setup

### 1. Clone the repo
```bash
git clone git@github.com:HEXO666/Telegram-Drive-Android.git
cd Telegram-Drive-Android
```

### 2. Install dependencies
```bash
npm install
```

### 3. Get your Telegram API credentials
1. Go to https://my.telegram.org/apps
2. Log in with your Telegram phone number
3. Click **"Create application"**
4. Copy your **App api_id** and **App api_hash**

### 4. Add your credentials to `.env`
```bash
cp .env .env.local   # optional — or edit .env directly
```
Edit `.env`:
```env
VITE_TG_API_ID=your_api_id_here
VITE_TG_API_HASH=your_api_hash_here
```

---

## Build the APK

### Step 1 — Build the web assets
```bash
npm run build
```
This compiles the React app into `dist/`.

### Step 2 — Sync to Android
```bash
npx cap sync android
```
This copies `dist/` into the Android project.

### Step 3 — Build the APK

**Set Java 21 as the active JDK:**
```bash
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk   # Linux
# macOS: export JAVA_HOME=$(/usr/libexec/java_home -v 21)
```

**Build debug APK (for testing):**
```bash
cd android
./gradlew assembleDebug
```

The APK will be at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

**Build release APK (for distribution):**
```bash
cd android
./gradlew assembleRelease
```
> Note: Release APKs must be signed. See [Capacitor's signing guide](https://capacitorjs.com/docs/android/deploying-to-google-play) for details.

---

## Install on your Android device

1. Copy `app-debug.apk` to your phone (USB, Google Drive, Telegram Saved Messages, etc.)
2. On Android: **Settings → Apps → Special app access → Install unknown apps**
   - Allow your file manager or browser to install APKs
3. Tap the APK file and install

---

## Development (live reload in browser)

```bash
npm run dev
```
Open http://localhost:5173

> Note: GramJS uses WebSockets. If Telegram blocks connections in your region, use a proxy.

---

## Project structure

```
src/
├── pages/
│   ├── Auth.tsx          # Phone/code/2FA login screens
│   └── Home.tsx          # Main file explorer
├── components/
│   ├── FileCard.tsx       # Grid view file card
│   ├── FileListItem.tsx   # List view file row
│   ├── FolderDrawer.tsx   # Bottom sheet folder navigator
│   └── MediaPreview.tsx   # Image/video/audio preview modal
├── services/
│   └── telegram.ts        # GramJS wrapper (auth, upload, download, delete)
└── theme/
    └── variables.css      # Ionic CSS variables (dark Telegram theme)
android/                   # Capacitor Android project
capacitor.config.ts        # Capacitor config
vite.config.ts             # Vite build config
.env                       # API credentials (fill in before building)
```

---

## Troubleshooting

**`Unsupported class file major version 69`**  
You're using Java 25. Switch to Java 21:
```bash
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk
```

**`VITE_TG_API_ID is 0` or auth fails**  
Make sure `.env` has your real credentials and you ran `npm run build` after editing it.

**`Could not find the android platform`**  
Run `npm install @capacitor/android` then `npx cap add android`.

**GramJS connection errors on first launch**  
The MTProto handshake can take a few seconds on mobile networks. Wait 5–10 seconds and try again.

---

## License

MIT
