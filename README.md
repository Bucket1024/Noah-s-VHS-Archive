# VHS Archive 8.8.1 — Stable Theme Music

Version 8.8.1 simplifies the theme music system after the recovery code caused repeated stopping.

## Changes

- One persistent theme-music audio element
- No repeated `.load()` calls
- No source replacement or recovery loop
- Music toggle directly starts or pauses playback
- Backgrounding pauses music
- Returning attempts one resume
- If Chrome blocks playback, the app waits for the next user interaction
- Movie Night SFX remains unchanged
- My Hardware remains unchanged

## Suggested commit message

Release 8.8.1 - Stable Theme Music
