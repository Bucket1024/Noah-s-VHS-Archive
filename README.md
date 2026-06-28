# VHS Archive 7.4.1 — Emergency Photo Stability Rollback

7.4.1 rolls back the crashed IndexedDB photo-storage experiment and restores the known-working photo system.

## Fixed

- Restores app launch after the 7.4 startup crash
- Keeps the zoom viewer
- Uses smaller photo compression to reduce memory/storage pressure
- Built from the stable 7.3.1 foundation

## Important

This is a stability rollback, not the final large-library photo solution.

The proper long-term fix is still to move photos out of localStorage, but that needs a more careful rebuild and migration process.

## Suggested commit message

Release 7.4.1 - Emergency Photo Stability Rollback
