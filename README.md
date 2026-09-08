# Design System Studio

A standalone starting point for extracting and growing a design system from
HTML/CSS/JS screens, with an independently updatable workbench and inspector.

The **project catalog is empty**. The **inspector sandbox is populated** with
fictional content and optional Titan-derived reference controls. They are separate.

## Start

Use Node.js 22 or later. No dependency installation, build step or CRM server is required.

```sh
node server.js
```

Open **http://localhost:8020/**. A different port is supported:

```sh
node server.js 8030
```

The server binds to localhost. The workbench opens the sandbox by default; choose
**Your project** in the catalog switcher to see the zero-stage catalog.

Useful entry points:

- `/` — the eight-tab workbench.
- `/demo/screens/record.html?ds=true` — fictional record and working mock controls.
- `/demo/screens/ownership.html?ds=true` — controlled inspector cases.
- `/?profile=project#overview` — your project catalog.
- `/moodboard/` — persistent reference canvas, served from the same process.

## What you get

- Registry-driven Overview, Foundations, Icons, Components, Patterns, Data
  visualization, Directions and Moodboard views.
- Token source browsing and filtering; catalogs start from registered real previews.
- Component/composition anatomy overlays in sandbox specimens.
- Spacing inspector with **− / +**, **Shared / Local**, owner-based grouping,
  Reset, pending changes and **Copy changes prompt**.
- Components mode with **Ctrl/Cmd** targeting of nested, unregistered elements.
- Shared icon provider, menu behavior and five chart renderers in the sandbox.
- Working modal, settings and bounded-resizable two-pane pattern examples.
- A moodboard with image references, notes, source context, arrangement, undo and export.
- Catalog/source/token validation and safe local release/update tooling.
- An intact snapshot of the original DS for deeper reference, including its broader
  component catalog, contracts, themes, workbench, fixtures and historical audit tools.

## File ownership

```text
framework/                  Upstream tools; updated as one versioned unit
  workbench/                Generic catalog UI
  spacing-inspector.js      Inspector and temporary live previews
  anatomy.*                 Workbench anatomy overlays
  catalog.schema.json       Portable catalog v1
  examples/                 Fictional sandbox + reference implementations
  moodboard/                Reference canvas and persistence handler
  tests/                    Contract, HTTP and update regression checks
project/                    Your app; never replaced by the updater
  inbox/                    Original supplied screens and assets
  screens/                  Working/migrated screens
  design-system/            Project tokens, components, registry, themes, specimens
  decisions/                Extraction decisions, approved exceptions and audits
reference/                  Original Titan snapshot; read-only historical reference
studio.config.json          Project paths, default catalog and port
framework.lock.json         Installed version and hashes of managed files
.moodboard-data/            Local reference data; created when the board is opened
.framework-backups/         Previous tool versions retained by applied updates
```

The workbench chrome has its own styles. It stays usable while project tokens are
empty or being changed. Preview frames load the actual project styles, so project
themes cannot accidentally restyle the tool UI or each other.

## Start a new app from screens

1. Copy this entire folder into a new repo; keep the ownership layout above.
2. Put source HTML/CSS/JS and assets in `project/inbox/`. Keep originals intact.
3. Fill in `project/BRIEF.md` and include viewport and behavior expectations.
4. Ask your agent: **“Build a design system from these screens. Follow AGENTS.md.”**
5. Review extraction decisions, real examples and migrated screens. Evolve the
   catalog as new screens establish more reusable relationships.

The agent must extract and implement the system. This is not an automatic screenshot
recognition engine. Screens are evidence; absent states, behavior and accessibility
still need to be defined and tested. Do not copy the demo palette or spacing ramp
into the project without a design reason.

To make Your project the default, set `defaultProfile` to `project` in
`studio.config.json`.

## Integrate the inspector

Project screens served under `/screens/` use:

```html
<link rel="stylesheet" href="/design-system/tokens.css">
<link rel="stylesheet" href="/design-system/components.css">
<script defer src="/framework/spacing-inspector.js"></script>
```

Append `?ds=true` to enable it. **H** pauses selection so normal controls work.
For another application server, serve the same files and set the adapter before
loading the inspector:

```html
<script>
window.dsInspectorConfig = {
  registryUrl: '/design-system/registry.json',
  workbenchUrl: '/design-system/#components'
};
</script>
```

Token stylesheet URLs currently need a `/design-system/` path segment for token
recognition. Same-origin CSS is required for reliable source inspection.

## Improve tools and roll out updates

Use this folder as the upstream repo for framework development. Keep project changes
in `project/` in downstream repos. See [UPDATES.md](UPDATES.md) for the exact release,
dry-run, apply and rollback workflow.

Updates are explicit and reviewable, not background pulls. They replace `framework/`
and its lock only. Local edits inside that folder block an update instead of being
silently discarded. Mock-screen improvements ship with the framework.

## Checks

```sh
node framework/validate.js
node --test framework/tests/starter.test.js
node framework/release.js --check
```

See [VERIFICATION.md](VERIFICATION.md) for tested behavior and remaining browser checks.
Node tests do not substitute for visual and interaction QA.

## Limits and provenance

This is a first working extraction, not a promise of complete cascade analysis or
zero maintenance. Complex CSS, pseudo-elements and inaccessible stylesheets are
conservatively unresolved. Live changes affect the current document; applying their
source prompt can affect other screens. There is no native-app inspection adapter.

The development server serves trusted local HTML/JS; it does not isolate malicious
input screens. There is no application database or general write API. Moodboard
content is the only persistent data written through the UI.

See [PROVENANCE.md](PROVENANCE.md) for original sources, reference limitations and
third-party redistribution considerations. No Git repository or remote is created
automatically, and no release has been published.
