# VHS Archive Changelog

## v8.8 — My Hardware
- Added a collapsed My Hardware section inside Settings.
- Add TVs, VCRs, DVD players, DVD/VCR combos, LaserDisc players, rewinders, remotes, converters, and other equipment.
- Added brand, model, year, condition, connections/features, notes, and optional photos.
- Hardware items can be expanded and edited inline.
- Added confirmed Remove Hardware and Remove Photo actions.
- Added an optional “Currently in use” marker.
- JSON backup now includes hardware, wishlist, watched status, photos, music setting, and SFX setting.
- Import restores the hardware list and supported settings.

## v8.7.7 — Theme Music Recovery
- Reloads the theme audio file when Chrome reports a loading or source error.
- Uses a cache-busted, GitHub Pages-safe music URL.
- Explicitly resets muted state, volume, looping, and playback state.
- Retries playback after the audio becomes ready.
- Shows a message when music cannot start instead of silently remaining enabled.
- Movie Night SFX is unchanged.

## v8.7.9 — Swipe-Back Ghost Frame Suppression
- Keeps left-edge swipe enabled.
- Adds a back-navigation hide state to suppress the tape overlay during swipe-back.
- Hides/cancels the tape overlay as soon as the left-edge swipe starts.

## v8.7.8 — Strong Swipe-Back Overlay Guard
- Tape-open overlay now only renders while Browse is active.
- Cancels pending tape-open timers during back/swipe navigation.
- Prevents the final expanded semi-transparent tape frame from appearing during swipe-back.

## v8.7.6 — One-Motion Tape Transition
- Rebuilt the tape-open transition as a two-state CSS transition.
- Tape now expands and fades at the same time in one continuous motion.
- Removed midpoint keyframes from the active tape-open animation.

## v8.7.5 — Repository Cleanup + Home Stats Fix
- Removed old separate `CHANGELOG_*.txt` files.
- Kept one combined `CHANGELOG.md` going forward.
- Removed old upload/reupload instruction helper files.
- Fixed the Home stats JSX issue from the previous 8.7.4 attempt.
- Home now only shows two compact clickable stats: Inventory and Wishlist.

## v8.7.4 — Home Screen Cleanup
- Home stats reduced to Inventory and Wishlist.
- Inventory opens Browse.
- Wishlist opens Wishlist.

## v8.7.3 — Inline Wishlist Edit
- Wishlist editing opens inline inside the selected wishlist card.
- Added Remove Tape button at the bottom of tape details.
- Remove Tape asks for confirmation before deleting.

## v8.7.2 — Editable Wishlist
- Wishlist cards became editable.
- Added Save Changes, Remove, and Found It actions.
- Added green “ADDED TO COLLECTION” stamp animation.

## v8.7.1 — Collapsed Wishlist Form
- Wishlist add form is collapsed by default.
- Added expandable Add Wanted Tape section.

## v8.7 — Wishlist / Wanted Tapes
- Added Wishlist tab.
- Added Wanted Tape form.
- Added priority, edition, packaging, genre, and notes.
- Added Found It button to move wishlist tapes into the main collection.
- Bottom navigation became Home, Browse, Add, Wishlist, Settings.

## v8.6.8 — Simultaneous Dissolve
- Tape opening animation fades while expanding.
- Preserved Movie Night and audio features.

## v8.6.6 — MP3 Reveal SFX
- Replaced synthesized reveal dings with MP3 reveal sound.
- Added/kept SFX controls.

## v8.6 — Movie Night
- Added Movie Night reel randomizer.
- Added centered winner landing behavior.
- Added spin and reveal sound effects.

## v8.5 — Tape Open Transition Polish
- Refined Browse tape opening animation.

## v8.4 — Navigation and UI Refinements
- Continued polishing Browse and tape detail interactions.

## Earlier 8.x Releases
- Added music controls, settings updates, backup improvements, photo support, and GitHub Pages deployment refinements.
