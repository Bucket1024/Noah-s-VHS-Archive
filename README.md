# Noah's VHS Archive 6.2

Clean React/PWA foundation for Noah's VHS Archive.

## Included

- React + Vite app
- GitHub Actions deployment workflow
- GitHub Pages path fix
- React startup fix
- 132-tape starter collection
- Shelf-style home screen
- Browse/search/filter
- Tape detail page with photo carousel
- Camera/gallery upload
- Favorites and watched tracking
- Edit tape fields
- Collection timeline
- Backup export

## GitHub Pages

This package includes:

`.github/workflows/deploy.yml`

Set your repository Pages source to **GitHub Actions**, then commit these files.
GitHub will build and deploy automatically.

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Important

Photos and edits are saved to the browser/device using localStorage.
Use the Backup button before clearing browser data or switching phones.
