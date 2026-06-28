# Noah's VHS Archive 6.0

This is the first cleaner project foundation for Noah's VHS Archive.

## What changed in 6.0

- Built as a proper React + Vite app
- Organized source files instead of one huge HTML file
- GitHub Pages/PWA-ready structure
- 132-tape starter collection imported
- Shelf-style home screen
- Browse/search/filter collection
- Detail pages with photo carousel
- Camera/photo upload buttons
- Favorites and watched tracking
- Edit tape fields
- Collection timeline
- Backup export

## Local preview

Install Node.js, then run:

```bash
npm install
npm run dev
```

## Build for GitHub Pages

```bash
npm run build
```

Then upload the built `dist` folder or configure GitHub Pages/Actions to deploy it.

## Important

Tape edits/photos are saved to the browser/device using localStorage.
Use the Backup button before clearing browser data or switching phones.
