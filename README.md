# TransferIt

**Transfer public YouTube / YouTube Music playlists to Spotify using just a playlist URL.**

TransferIt is a developer-friendly, self-hosted tool that migrates your music playlists from YouTube Music to Spotify. No sign-up required—just paste your playlist URL and go.

![Transfer Flow](https://img.shields.io/badge/YouTube-Spotify-green?style=for-the-badge&logo=spotify)

## Why Self-Hosted?

Due to **Spotify's OAuth restrictions for individual developers**, this project must be self-hosted. Spotify requires apps in "Development Mode" to explicitly whitelist each user's email address before they can authenticate—making it impractical to run as a public service.

**This means:**
- You must create your own Spotify Developer App
- You must provide your own API keys
- Only you (and users you whitelist) can use your instance

This is a Spotify platform limitation, not a design choice. Self-hosting ensures you have full control over your data and credentials.

## Features

- 🔗 **URL-based transfer** — Just paste a public YouTube/YouTube Music playlist URL
- 🎯 **Accurate matching** — Smart artist + title matching algorithm with fuzzy search
- 📊 **Progress UI** — Real-time progress tracking (Fetching → Matching → Adding)
- ⚡ **Safe skipping** — Skips incorrect matches to avoid polluting your playlist
- 🔒 **Privacy-first** — No user data stored, no databases, no tracking
- 🎨 **Modern UI** — Beautiful Nord-themed interface

## Requirements

- **Node.js 18+** (LTS recommended)
- **Spotify account** (free or premium)
- **Google account** (for YouTube Data API)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/transferit.git
cd transferit
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your API credentials (see steps below).

### 4. Create YouTube Data API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Enable the **YouTube Data API v3**
4. Go to **APIs & Services** → **Credentials**
5. Click **Create Credentials** → **API Key**
6. Copy the API key and paste it into `.env.local`:
   ```
   YOUTUBE_API_KEY=your_youtube_api_key_here
   ```

### 5. Create Spotify Developer App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click **Create App**
3. Fill in the app details:
   - **App name**: TransferIt (or any name you prefer)
   - **App description**: Playlist transfer tool
   - **Redirect URI**: `http://127.0.0.1:3000/api/callback/spotify`
4. Click **Save**
5. Go to your app's **Settings**
6. Copy the **Client ID** and **Client Secret**
7. Paste them into `.env.local`:
   ```
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/api/callback/spotify
   ```

> **Important:** The redirect URI must match exactly, including the port number and path.

### 6. Run the Development Server

```bash
npm run dev
```

### 7. Open the App

Navigate to [http://127.0.0.1:3000](http://127.0.0.1:3000) in your browser.

## Usage

1. Click **Connect Spotify & Transfer** to authenticate with your Spotify account
2. Paste a public YouTube/YouTube Music playlist URL
3. Click **Analyze Playlist** to fetch the tracks
4. Click **Start Transfer** to begin the migration
5. View your new playlist in Spotify!

## Limitations

- **Public playlists only** — Private YouTube playlists cannot be accessed without additional OAuth setup
- **Self-hosted requirement** — Each user must provide their own API keys due to Spotify restrictions
- **Matching accuracy** — Some tracks may not be found on Spotify (regional availability, different versions, etc.)
- **Rate limits** — Both YouTube and Spotify APIs have rate limits; very large playlists may take time

## Disclaimer

This project is **non-commercial** and intended for **educational and personal use only**.

- TransferIt is not affiliated with, endorsed by, or connected to YouTube, YouTube Music, Google, or Spotify.
- YouTube Music and Spotify are trademarks of their respective owners.
- Use this tool responsibly and in accordance with both platforms' Terms of Service.
- The authors are not responsible for any misuse of this software.

## License

This project is licensed under the [MIT License](LICENSE).

---

**Made with ❤️ for music lovers who want to keep their playlists everywhere.**
