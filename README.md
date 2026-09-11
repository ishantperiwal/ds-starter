# Design System Studio

An updatable studio that plugs into an existing app. Its UI, inspector and shared
workflows live in this Git repository. Each app’s design-system content lives in a
separate folder and is never synchronized over by studio updates.

No screen copying, inbox or prescribed app structure.

## Plug into an existing app

Requires Node.js 22+ and Git. No npm install/build step.

From your existing app folder:

```sh
git clone https://github.com/ishantperiwal/ds-starter.git ds-studio
node ds-studio/studio.js init --app .
node ds-studio/studio.js start --config app-design-system/studio.config.json
```

Open **http://localhost:8020/**. Add `--port 8030` if another studio is running.
The private GitHub repository requires authentication.

```text
existing-app/
  whatever-folders-you-already-have/
  index.html
  ds-studio/                   Independent upstream Git checkout: software
  app-design-system/           App-owned content: created once
    studio.config.json         Relative paths and compatibility contract
    run-ds.md                  Entry point: follow this DS and start its studio
    AGENTS.md                  Small loader for current shared instructions
    BRIEF.md                   App-specific constraints
    registry.json              This app’s catalog
    tokens.css, components.css Shared imports for this app
    tokens/, components/       App implementations
    icons/, patterns/, themes/
    specimens/, decisions/
    .moodboard-data/            Private local references; ignored by Git
```

Keep ds-studio/ ignored by the app repo (or manage it as a deliberate submodule).
Commit app-design-system/ in the app repo. The initializer does not edit your
existing app instructions, .gitignore, screens or existing design-system files.

Already have a studio checkout adjacent to the app? Reuse it:

```sh
node ../ds-studio/studio.js init --app .
node ../ds-studio/studio.js start --config app-design-system/studio.config.json
```

A different content location is supported with `init --app ./my-app --content ./my-app-ds`.
Paths are resolved from the command’s working directory. Studio and content must
be non-overlapping folders; both can live inside the app, but neither can contain
the other. Initialization never overwrites an existing destination. Repeating
it for the same attachment is a no-op.

## Tell your agent what to build

Reference the generated `app-design-system/run-ds.md` with your task. “Run DS”
means follow that attachment’s components, tokens and instructions for the task
and related follow-ups. A standalone reference asks the agent to start/reuse the
studio and return its URL. This is an agent instruction, not a new CLI command.

New initializations create this app-owned file. Existing attachments are left
unchanged, including on repeated initialization; they can keep using AGENTS.md
or add an equivalent entry point explicitly.

Point to the actual screens, for example:

> Follow app-design-system/run-ds.md. Build/expand this app’s DS from
> pages/opportunities/record.html and settings/editor.html. Work with the screens
> in place, put shared app content in the configured DS folder, and register real
> previews. Keep the studio checkout unchanged.

The generated AGENTS.md loads the shared workflow from the current studio checkout.
It does not freeze a copy of those instructions. App-specific constraints stay in
BRIEF.md, decisions/ and the app’s own instructions.

This is an agent-assisted extraction workflow, not an automatic screenshot-to-DS
engine. Screens provide evidence; behavior, states and accessibility need validation.

## What updates, what stays yours

| Studio software: upstream-owned | App content: app-owned |
| --- | --- |
| Sidebar and catalog presentation | Which components appear and their definitions |
| Inspector, previews, anatomy UI | Tokens, icons, patterns, themes and specimens |
| Shared agent workflow and schemas | App instructions, decisions and registry |
| Mock sandbox and tooling tests | Existing app screens and reference board data |

The workbench chrome is isolated from app styles. Real specimens load their own
app styles inside separate frames.

The shared presentation follows the Titan workbench: compact dark sidebar,
centered workspace, ledger overview, grouped visual foundations, spatial
component exploration and structured pattern contracts. Studio-only colors, type,
spacing and layout are owned by framework/workbench/presentation.css and studio.css.
App themes affect preview frames, never the sidebar or catalog layout.

Counts come from the selected app registry and token sources. The overview shows
catalog totals and registered screen previews; it does not present adoption tracking. Foundations show source declarations and scopes;
their samples resolve only simple unconditional root aliases, not the full cascade.

## Update like software

Stop the running studio. From the app folder:

```sh
node ds-studio/studio.js update --config app-design-system/studio.config.json --check
node ds-studio/studio.js update --config app-design-system/studio.config.json
node ds-studio/studio.js check --config app-design-system/studio.config.json
node ds-studio/studio.js start --config app-design-system/studio.config.json
```

The updater fetches the configured Git upstream and fast-forwards the **studio
checkout only**, including its UI and shared instructions. It refuses local edits,
divergent history and incompatible content contracts before checkout. Check mode
fetches Git metadata but does not install files. No background/automatic pulls.

Direct `git pull --ff-only` in the studio checkout also updates its software, but
skips the pre-install contract check. Startup still refuses incompatible content.
Use the checked updater for app installations. See [UPDATES.md](UPDATES.md).

## Existing screens and preview URLs

The server reads files from their actual locations:

- `/design-system/*` → the attached app’s content folder.
- `/app/*` → existing static HTML/CSS/JS/assets under appRoot, without copying.
- `/framework/*` → current studio software.
- Root-relative static assets such as `/assets/app.css` also resolve under appRoot,
  unless they collide with reserved studio routes.
- `/moodboard/` → this app’s board; data is in its content folder.

In registry.json, use `specimens/note.html` for an app-owned component specimen,
or `../app/pages/record.html` for an existing screen. These are URLs relative to
/design-system/, not paths relative to the registry on disk. The validator and
server resolve them using the same mounts.

Shared imports in app screens:

```html
<link rel="stylesheet" href="/design-system/tokens.css">
<link rel="stylesheet" href="/design-system/components.css">
<script defer src="/framework/spacing-inspector.js"></script>
```

Append `?ds=true` to inspect; H pauses selection. −/+ previews spacing, Shared/Local
controls scope, Ctrl/Cmd targets nested objects, and Copy changes prompt hands
reviewed changes to your agent. Equal pixels do not establish shared ownership.

The studio is a localhost static development server, not your app backend. Root
navigation, SPA routing and APIs may require your existing server. To integrate
there, mount the content at /design-system/ and tools at /framework/ on that same
origin. Do not expose your whole filesystem or proxy arbitrary backend writes.
Private/hidden files, node_modules, app JSON/data and symlink escapes are not served
through the /app mount. Only trusted local screens should be loaded.

## Develop the studio itself

```sh
node studio.js start
node studio.js check
npm test
node framework/release.js --check
```

Without an app configuration, the populated fictional sandbox opens: components,
compositions, icons, five chart renderers, patterns, themes, anatomy and inspector
fixtures. No app content is created. project/ remains an empty legacy test fixture
for v0.1 compatibility; it is not the new initialization workflow.

See [VERIFICATION.md](VERIFICATION.md) for tested behavior and browser QA limits,
[PROVENANCE.md](PROVENANCE.md) for reference and license boundaries, and
[framework/CONTRACTS.md](framework/CONTRACTS.md) for the catalog/integration contract.

### Layouts versus components

The shared extraction workflow separates parent-owned layout recipes from reusable
components. Horizontal rows, vertical lists, grids and footer action arrangements
use app spacing tokens and configurable defaults; arrangement alone is not a reason
to register a component. The intended presentation is Layouts & patterns → Layouts. See
[the mandatory workflow](framework/AGENT-WORKFLOW.md#mandatory-separate-layout-recipes-from-components)
for ownership, classification and current presentation guidance.
