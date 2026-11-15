# SoundScape

SoundScape is a browser-based music discovery and preview app built with HTML, CSS, and JavaScript. Vite serves the app; Supabase is optional and is used for email/password authentication and favorites when configured.

## Run locally

Install the existing npm dependencies, then run `npm run dev`. Configure the following values in a local `.env` file to enable Supabase features:

- `VITE_SUPABASE_URL`: Supabase project URL.
- `VITE_SUPABASE_ANON_KEY`: Supabase publishable/anon key. This key is designed for browser use; enable Row Level Security and appropriate policies for user-owned data.

Without these values, local favorites and recent history continue to work in browser storage, but account sign-in and cloud sync are unavailable.

## Music and lyrics

- Track search and 30-second audio previews come from the public iTunes Search API. Preview availability and duration are controlled by that provider.
- Synchronized or plain lyrics are requested from LRCLIB when a track is opened in the expanded player. Results depend on LRCLIB availability and catalog matches. Karaoke highlighting is line-synchronized where timestamps exist; word-level karaoke timing is not provided by the current API integration.
- Recommendations use recent tracks and favorites stored in this browser to choose an artist query, then filter already-heard tracks from iTunes results. With no listening history, the app shows mood-based discovery. This is a lightweight heuristic, not an AI model.

## Integrations not enabled

Playlist import from Spotify or YouTube is not implemented. Spotify's embed metadata does not provide a complete track list, and YouTube playlist data requires an authorized YouTube Data API integration. Add the supported provider credentials and an import service before presenting a preview or saving imported tracks; this app does not scrape playlist pages or download protected audio.

Artist biographies, full albums, user profile pages, playlist cloud sync, and playback beyond the provider's preview clips also require catalog or backend APIs that are not configured in this repository. The Google button is intentionally visual only and does not start OAuth.
