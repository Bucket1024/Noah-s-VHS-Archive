# Noah's VHS Archive 6.3

Install-ready React/PWA foundation for Noah's VHS Archive.

## What changed in 6.3

- Proper service worker registration
- GitHub Pages-safe relative manifest and icon paths
- PNG icons added for Android installability
- Install App prompt support
- Offline app shell caching
- Standalone/fullscreen launch support after installation
- 132-tape starter collection
- Shelf-style home screen
- Browse/search/filter
- Tape detail page with photo carousel
- Camera/gallery upload
- Favorites and watched tracking
- Edit tape fields
- Collection timeline
- Backup export

## Upload to GitHub

Upload everything inside this folder to your repository and commit.

GitHub Pages source should be:

Settings → Pages → Source: GitHub Actions

## After deployment

Open your GitHub Pages link in Chrome on Android.

Preferred:
- Tap the in-app **Install App** button if it appears.

Or:
- Chrome menu → **Install app** / **Add to Home screen**

Launching from the installed home-screen icon should remove the browser address bar.

## Local development

```bash
npm install
npm run dev
```

## Important

Photos and edits are saved to the browser/device using localStorage.
Use the Backup button before clearing browser data or switching phones.
