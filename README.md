# VHS Archive 7.5 — Photo Library Upgrade

7.5 is the proper large-library photo storage update.

## What changed

- New photos are stored in IndexedDB instead of localStorage
- Tape records store lightweight photo IDs
- Existing localStorage photos still work
- If IndexedDB is unavailable, the app falls back to the old method
- Photo compression stays enabled for stability
- Zoom viewer is preserved

## Why this matters

localStorage is too small for a real archive with hundreds or thousands of photos. IndexedDB is the browser/PWA storage system designed for larger local data.

## Important

Existing photos already saved in localStorage will still take space there. Over time, retaking/re-adding important photos after 7.5 will move those new photos into IndexedDB.

## Suggested commit message

Release 7.5 - Photo Library Upgrade
