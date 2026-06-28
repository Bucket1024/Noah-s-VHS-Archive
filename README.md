# VHS Archive 7.4 — Photo Storage Upgrade

7.4 moves photos out of localStorage and into IndexedDB.

## Why this matters

localStorage is too small for a real photo archive. Storing base64 photos directly inside the tape data can crash the app after only a few tapes.

## New in 7.4

- New photos are stored in IndexedDB
- Tape records store lightweight photo IDs instead of full image data
- This should support far more tape photos than localStorage
- Keeps photo compression for stability
- Keeps the zoom viewer
- Backup export now includes IndexedDB photos where possible

## Important

Existing photos already saved inside localStorage will still work, but they still take up localStorage space.
For best long-term stability:
1. Export a backup.
2. Consider removing/re-adding old high-memory photos over time after installing 7.4.

## Suggested commit message

Release 7.4 - Photo Storage Upgrade
