# Direction room

A persistent reference canvas, integrated into the studio's one localhost server.
From the starter root run `node server.js`, then open
http://localhost:8020/moodboard/ or the workbench's Moodboard tab. No second server
or dependency installation is needed. Do not expose this development server publicly.

## Working with references

- Select a bucket and paste an image with Cmd/Ctrl+V, drop an image file, or use
  Add images. Add/rename buckets, drag their headers, and resize their handles.
- Drag the background or scroll to pan; use zoom and Fit all. Focus the canvas
  and use arrow keys for keyboard panning. Resize handles also accept arrow keys.
- Click a reference to edit its title, direction note, source and bucket. Save
  reference commits those edits. Image labels and stable IDs support copied context.
- Copy image, Copy direction text and Copy reference serve different purposes.
  Export board image creates a PNG sheet; Download preserves the stored PNG.
- Dragged images snap to nearby edges and centers; Alt/Option disables snapping.
  Undo is available for recent operations while the server remains running.

## Persistence and ownership

All profiles in one studio session share `.moodboard-data/board.json` and PNG originals
in `.moodboard-data/images/`, inside the attached app’s content folder (or the studio
root when running the standalone sandbox). They are gitignored, project-local
data; framework releases do not include or replace them. Separate starter instances
have separate storage, even if hosted by the same Node process. Back up this folder
to retain the board across machines.

References removed from the board keep their original PNG files for recovery.
Undo history is in memory and expires when the server stops. Simultaneous edits to
the same field are last-write-wins; forms retain their current values until saved
or closed. Other tabs poll for changes.

The client converts uploads to PNG; server payloads are bounded to 3 MB and each
stored PNG to 2 MB. Animated images become a still frame. Clipboard operations
depend on browser permission and localhost/secure-context support.

Resolve a copied reference using its stable image ID in board.json, then read
`images/<id>.png`. Repeated labels do not imply the same reference. No existing
user images, credentials or CRM data are bundled in this starter.

The canvas uses sandbox reference controls for its own UI. Its freeform geometry
does not establish tokens or layout rules for the project design system.
