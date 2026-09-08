# Titan Design System — read this before writing UI

### Note display

Use `.ds-note` for read-only note content, with optional `.ds-note__meta` (decorative
`.ds-note__icon` and wrapping `.ds-note__meta-text`) followed by `.ds-note__body`.
The `--note-*` tokens own the surface, typography, horizontal/vertical insets and
metadata gaps. A lightly tinted surface, 8px corners and balanced 16px insets frame
the note. Quiet metadata sits 8px above the larger body text; the decorative icon uses
accent ink. Body text preserves newlines and wraps long words. Omit missing metadata
and empty notes entirely. Parents own outer spacing; composers and timelines remain
separate. The record page adopts this component for its latest note.

### Component inspection on CRM pages

In `?ds=true` mode, choose **Components** in the inspector toolbar. Hover identifies
the nearest registered component; click pins its outline and details. The hierarchy
lets you select containing components and compositions. Recognition reads the current
registry's component/composition classes. `.ds-field` is recognized as the documented
Input composition, not a newly registered component. Elements without a matching
component ancestor are labelled page-owned; chart renderer types are not inferred from
their generic `.ds-viz` shell.

The panel shows variant classes, explicit state, resolved visual properties, source
links and a link to the components workbench. **Copy component** copies identity only;
**Copy instance context** includes the route, selector, hierarchy, label, state and
local override candidates so a requested change can be scoped appropriately.

The context also reports typography ownership—resolved font family, size, weight, line
height, letter spacing and color—along with the matching declaration and any `var(--token)`
reference. This distinguishes a page-owned element whose typography is still tokenized
from one using literal values or inherited browser/page defaults.

Override candidates are matching page declarations for properties also set by the DS,
plus inline declarations and inline ancestor token overrides. Resets can appear here;
these are not guaranteed cascade winners. Inherited stylesheet overrides, pseudo-elements
and complex cascade behavior require source review. Do not use the candidate count as
a compliance score. Source links describe shared ownership; page-specific markup stays
in its consumer. The picker inspects existing DOM and makes no data edits.

**H** pauses/resumes the active mode. Pause enables normal page interactions; active
Components mode intercepts pointer selection before controls activate. Close or Escape
unpins the panel, and selecting another component replaces it. The panel stays open
through unrelated page refreshes and tracks the selected bounds as the page scrolls.

The shared design language for Titan's CRM: how controls look, how content is grouped,
and how tasks occupy the screen. It gives designers and coding agents a concrete starting
point for new UI and makes deliberate design changes propagate through shared tokens.

The system began with `App Redesign/index_prodRedesign_interactions.html`. That file is the
historical visual reference; explicitly approved changes recorded in the current registry,
tokens and component styles supersede it. Keep this document synchronized with those contracts.

## Why it exists

Titan is an exploration prototype, so the system should make iteration faster while keeping
screens coherent. It prevents repeated controls, arbitrary spacing and separate chart layouts
from drifting apart. Semantic tokens make general design adjustments reviewable; reusable
compositions give new content an immediate structure; patterns preserve consistent task behavior.

The layers have separate responsibilities:

- **Foundations** define colour, typography, dimensions and shared spacing roles.
- **Compositions** provide working defaults for stacks, wrapping rows, sections and structured cards.
- **Components** own control behavior, appearance and internal anatomy.
- **Patterns** define screen regions, navigation, scrolling, alignment and responsive behavior.
- **The workbench** renders those contracts with in-place Preview / Spacing toggles.

New UI adopts the appropriate layers. Existing UI changes only where it already consumes a
shared token/style or when it explicitly adopts a new composition. The mailbox remains outside
this CRM system. This is plain CSS and optional JavaScript, with no framework or build step.

**Start here:** [`registry.json`](./registry.json) lists every component, its props,
its states and its file, plus compositions and pattern anatomy. [`index.html`](./index.html) is the workbench — open it and
you can see the whole system at once.

> **This directory changes only when someone asks for it, in so many words.** Adding a
> component, a token, a variant or a direction is never a side effect of building a
> feature — it is its own task, started by an explicit request. Building something? You
> are a consumer: compose what is already here, write only page-local layout, and if
> nothing fits, **name the gap in your summary instead of filling it**. The sections
> below marked *owner* describe how the system grows when that request comes; reading
> them is not the request.

## The workbench

`node dev-server.js`, then **http://localhost:8000/design-system/**. Eight views, each on
its own hash so it can be linked and screenshotted:

| `#overview` | The coverage ledger — one row per block in the inventory, bar = duplication absorbed, sorted by it. Click a row for the evidence. |
| `#foundations` | Curated specimens (ramps, type, radius, space, elevation) **plus a complete token index parsed from `primitives.css` and `semantics.css`** — grouped by those files' own section comments, so a token you add shows up without editing the page. |
| `#icons` | The whole set, filterable by name *or* alias; click to copy the call. |
| `#components` | Composition defaults with starter markup, then every control variant and state. In-place spacing overlays inspect both. |
| `#patterns` | In-place region spacing overlays for modal, full-page settings and two-pane workspace contracts. |
| `#visualizations` | Canonical, engine-neutral chart components with their reading priorities and usage contracts. Product renderers reproduce these specimens. |
| `#directions` | Each theme rendered live, side by side. |
| `#moodboard` | Persistent reference canvas; see `../moodboard/README.md`. |

It is rendered **in its own system** — the dark rail is the product's real sidebar colour,
and every value on the page is a token. So the tool restyles when a direction does, and
a broken token shows up here first.

Sources it reads rather than restates, so it can't drift from the truth:

- the ledger, the stat band and the headline all come from `registry.json`
- the icon grid, the weight options and the current weight come from `dsIcon` itself
- the token index is parsed from the token CSS. It exists because the curated specimens
  were a hardcoded list of 18 names, so `--checkbox-size`, `--border-hairline`,
  `--surface-sunken`, `--kanban-*` and **every component token** were invisible on the one
  page whose job is to show them. If you find yourself typing a token name into
  `index.html`, that's the bug repeating.
- **`#directions` fetches each theme file and rewrites its `:root` to a wrapper class**,
  so every direction previews at once without its values being copied into this page.
  The override list under each preview is parsed from that same file.

- **`#patterns` renders from `registry.json`**, including when to use a pattern, its
  required structure, constraints and current examples. A pattern is not a component:
  it coordinates routes, page ownership and component composition, and therefore does
  not introduce a `ds-*` class.
- **`#visualizations` renders from `registry.json`**. Five specimens use the shared chart renderers; two use workbench-owned SVG
  geometry. Their anatomy identifies the renderer and spacing ownership explicitly.
  Together they document chart purpose, reading order, palette and accessibility. Every visualization listed there is a
  canonical design-system component; there is no separate exploration or approval state.

Component, composition, pattern and chart catalogs flow in up to two independent
columns, collapsing to one when each card cannot retain 400px of width. Cards remain
whole when their disclosures expand. Composition examples have a labelled preview
frame, separate from the component being measured; this frame is workbench-only.

The workbench presents specimens first, with short view and section introductions
always visible. Detailed composition usage and pattern/chart guidelines live in closed
native accordions; expand them for the full contract. Starter markup remains in metadata; spacing is inspected directly on each preview.

### Patterns are contracts

Before deciding how a task opens or occupies the workspace, check the registry's
`patterns` array or the `#patterns` workbench view. When a task matches a registered
pattern, follow its structure and requirements. Reusing the right buttons and inputs
inside the wrong screen behavior is not design-system adoption.

The current choice is deliberate:

| Pattern | Use it for | Do not use it for |
|---|---|---|
| **Modal dialog** | A short, bounded task that should retain the current page as context | Multi-section configuration, deep navigation, or anything needing a durable URL |
| **Full-page settings** | Sustained or multi-section configuration with its own cold-loadable route | A quick confirmation or compact edit that should return directly to the current page |
| **Two-pane workspace** | Two related surfaces that must remain visible together, such as an editor and live preview | Unrelated columns, three-pane layouts, or a secondary surface that is only incidental |

Patterns and components are independent layers. The Modal dialog behavior is registered
even though its reusable `ds-*` component shell is still planned; pages must follow the
behavioral contract and compose the closest existing controls without inventing a fake
design-system component. Two-pane workspace is likewise a composition contract rather than
a `ds-*` class: each adopting page owns its pane proportions and shared content maximum
width while preserving full-bleed pane surfaces, one horizontally centred content frame,
the full-height separator, independent scrolling, semantic surfaces and responsive fallback.
It supports fixed and bounded-resizable variations. A resizable split keeps a content-driven
default, clamps both panes to page-owned usable limits, exposes an accessible keyboard-operable
separator, and disappears when the panes stack; dragging never expands the shared frame or
allows either pane to collapse.

### Stat tiles are metric summaries, not charts

Use `.ds-card.ds-stat` for a short label, one primary number and one context line. The component
owns vertical padding, label-to-value spacing, value-to-context spacing, truncation and tabular
number treatment. Product pages supply only content and, when adjacent metrics need distinction,
`--ds-stat-accent`; accent is categorical decoration rather than success or danger status.
Do not rebuild this hierarchy with page-local KPI classes, and do not use a stat tile where a
scale, trend or composition is the question.

### Data visualization is a design-system component

Visualization components generate geometry from data instead of wrapping fixed control markup.
Their shared renderers and visual language are still design-system-owned: use the registry's
`visualizations` contracts and the `#visualizations` workbench view for chart choice,
reading priority, palette, labels and accessible alternatives. Every registered specimen is
ready for product use and may be translated into ECharts or another renderer. Renderer
defaults and showcase examples are never the source of truth; the workbench specimen is.
Product renderers also consume the semantic `--viz-bar-thickness-*` and `--viz-column-width-*`
tokens; mark dimensions must not be recreated with page-local values.
Every renderer supports `size: 'sm' | 'md' | 'lg'` and defaults to `md`. The matching
size tokens change internal mark dimensions and spacing while the complete component remains fluid.
Flexible tracks and grid/table regions consume the host width; text remains at semantic CSS font
sizes, and narrow part-to-whole components stack automatically. Do not use fixed SVG coordinates
for responsive legends or bar labels. The Data Visualization tab exposes all three sizes.
Renderers also accept `fill: true` for dashboard cards that should center the chart in their
remaining flex height without adding a page-specific wrapper.
Axis, label, value, legend and donut typography each have semantic `--viz-*-font-{sm,md,lg}` tokens.
Categorical series order is renderer-owned; omit per-series colours unless the data has a distinct,
documented colour meaning.
Part-to-whole charts must call `dsVisualization.partToWhole()` from
`components/visualization.js`; the workbench and dashboard intentionally share that renderer so
ring width, gaps, corner treatment, gradients, optional center labels, legend columns and row
spacing cannot drift between two copies. Each segment tooltip reports its label, displayed value
and share on hover; the persistent legend remains the accessible equivalent. The center is optional
with `center: false`. All legends use the shared subtle table surface and row separators. External
inline margin creates breathing room around the table while internal padding stays restrained. When a card needs to
conserve height, `legendLayout: 'compact'` keeps each category's label, share and value on one line
without a separate table header. Product copy supplies `centerLabel`; labels such as `SOURCES`
remain domain content rather than component defaults.
Conversion steps likewise support `layout: 'inline'` for a one-row label/track/value treatment with
the percentage beside the ending value. The renderer owns the compact label column, aligned track
endings, a shared `--viz-inline-value-column` for the stable-width left-aligned value column, and
spacing on both sides of the track; it returns
to a stacked track at narrow widths. Set `density: 'comfortable'` for short sequences that need
more vertical breathing room without page-local spacing overrides.
The same rule applies to binned distributions and conversion steps through
`dsVisualization.binnedDistribution()` and `dsVisualization.conversionSteps()`: labels and values
are chart geometry too, so product pages must not rebuild their placement in HTML.
Ranked bars and stacked composition likewise use `dsVisualization.rankedBars()` and
`dsVisualization.stackedComposition()`. Dashboard pages supply data, labels, links and accessible
summaries; the shared module owns every plotted coordinate and legend.

Adding a direction is therefore one file in `themes/` plus one entry in the registry's
`themes` array — the workbench picks up both the header control and the side-by-side
column from that entry.

---

## The three rules

**1. Don't hand-roll what exists.** Check `registry.json` first. The live product has
**82 button rules across 14 class names** (`titan-action-btn`, `comp-fmt-btn`,
`action-btn`, `split-btn`, `dir-btn`, `np-btn`, …) — every one of them is someone
solving "I need a button" again from scratch. That is the thing this replaces. If a
component is close but not quite right, use it anyway and adjust *at the call site* with
spacing tokens — don't fork it, and don't add a `ds-` variant of your own. A variant is
the designer's to add; report the need instead.

**2. Components read semantics, never primitives, never literals.** Three tiers:

```
primitives.css   raw values          --gray-700: #333333
      ↓
semantics.css    intent              --text-primary: var(--gray-700)
      ↓
component css    use                 color: var(--text-primary)
```

A hex or a themeable px in any CSS you write is a bug — it means you reached past the
system. The fix is a semantic token, which the designer adds; flag it rather than
inlining the value and moving on.

**3. A design direction is a theme file, not an edit.** See `themes/`. A direction may
only redefine semantic tokens; it may not add component rules or new raw values.
That constraint is what makes exploring cheap: try it, look at the whole product,
`git checkout` if you don't like it.

### Three habits the tokens are there to break

**Separate with space before you separate with a line.** A rule is the strongest divider
available and most boundaries are not that strong. Groups inside a menu, sections inside a
card, rows inside a list: space says "these are different" without drawing anything. Spend
a line only where being missed would be a mistake — a destructive action under harmless
ones. `--menu-group-gap` exists so a menu's groups can breathe *instead of* being ruled off,
and `.ds-menu__sep` is deliberately narrower in purpose than it looks.

**A hover must be felt, not just recoloured.** Swapping ink and edge to accent changes a
control's colour; it doesn't make it feel pressable. An outlined control gets a tint as well
(`.ds-btn--secondary:hover` → `--accent-subtle`) *and* an inset 1px ring that doubles its
edge, because at 1px a hue shift alone is a hairline changing colour. Thicken with a ring,
not `border-width`: a wider border moves the label inside the box, and `1.5px` snaps back to
`1px` at dpr 1 — so it would land on some screens and not others. The same goes
for a heading: `--menu-label-gap` sits below it so the group reads as *this label's* items
rather than the next line down.

**When something reads as cramped, go up the ramp, don't invent a value.** The scale is
`--space-025` → `--space-400` (2, 4, 6, 8, 10, 12, 14, 16, 24, 32) and it is complete; tight
spacing is almost always a step chosen too low, not a missing step. The rule of thumb that
holds across these screens: **24px between regions, 16px between things inside a region,
8–12px only between parts of one control.** A `padding: 13px` is the tell that someone
measured a screenshot instead.

---

## Trying a direction *(owner)*

```html
<link rel="stylesheet" href="/design-system/tokens/primitives.css">
<link rel="stylesheet" href="/design-system/tokens/semantics.css">
<link rel="stylesheet" href="/design-system/themes/soft.css">   <!-- ← swap this line -->
<link rel="stylesheet" href="/design-system/components/button.css">
```

The workbench switches it live, and `#directions` shows every direction at once.
`themes/soft.css` is a worked example — eleven token overrides restyle every button,
input, badge and card in the product, with no component touched. Register it in
`registry.json`'s `themes` array or the workbench won't know it exists.

**Component shape is tokenised on purpose.** `--btn-radius`, `--btn-height`,
`--btn-pad-x`, `--btn-weight`, `--btn-font`, `--btn-border-width` live in
`semantics.css`, so "try a pill button everywhere" is one value, not a refactor.

**Removing hex is not the same as being themeable.** A rule that reads
`var(--border-subtle)` has no literals left but a direction still cannot restyle it,
because a theme remaps *semantics*, and the surface has no component token of its own to
override. The kanban proved this: it went to 0 hex and the board still didn't move under
`soft.css`. It became themeable only once it had `--kanban-card-*` / `--kanban-lane-*`.
So a surface is migrated when it reads **its own component tokens**, not merely when the
hex is gone.

**Derived colour is not a token.** `renderBoard()` computes each stage header from the
pipeline's own colour via `darken()` / `shadeFor()`, and writes it inline — which beats the
stylesheet. Those values are data, like chart marks, and the registry marks them
`excluded`. Don't tokenise a colour the product calculates; the CSS fallbacks underneath
such a rule never render, which is exactly why `.kanban-col-title { color: #0d2b52 }` sat
there unnoticed.

---

## Adding a component *(owner)*

1. Stylesheet in `components/`, classes prefixed `ds-`, variants as
   `.ds-<name>--<variant>`. Semantic tokens only.
2. A JS render module **only if composition earns one** — `titanFormBuilder` needed
   one, a badge does not. Signature returns an HTML string; props map 1:1 onto
   variant class names so the two can't drift.
3. Every state: `default`, `hover`, `active`, `focus-visible`, `disabled`, plus
   `loading` where it applies. The workbench renders all of them, which is how you
   find the ones you skipped.
4. Add it to `registry.json` **in the same change**. A registry that lags is worse
   than none — it makes an agent confident about something untrue.
5. Add a demo to `renderComponents()` in the workbench and screenshot `#components`.
   Skip it and the view says so out loud, by name.

---

## Linking it

Every page needs exactly **two** links, in this order:

```html
<link rel="stylesheet" href="/design-system/tokens.css">
<link rel="stylesheet" href="/design-system/components.css">
```

`components.css` imports every component stylesheet. Add a new component file to it in the
same change that creates it.

Two components also ship behaviour, and a script is not something a stylesheet can `@import`,
so those pages add a `<script>` as well — `icon.js` if the page uses `data-ds-icon`
placeholders, `menu.js` if it uses `.ds-menu` or `.ds-split`. Both bind by delegation on
`document` and are safe to include on a page that has none yet.

This replaced per-page link lists, which had already drifted badly: `crm.html` linked
`button.css`, **nothing linked `primitives.css` at all**, and the record screen was migrated
to `.ds-input` / `.ds-card` / `.ds-badge` while none of those rules could reach it. Thirty-four
call sites counted as adopted and the screen rendered unstyled. `measure-adoption.js` now
refuses to count a `ds-` class on a page that doesn't link the CSS, and reports the inert uses
by name — **a component you cannot see is not adopted.**

## What a migration turns up

Adopting a surface is also how the system finds out what it's missing. The record screen
(`opportunity-view.html`) added four variants and one whole block, all in `registry.json`
under `variantNotes`:

| Added | Because |
|---|---|
| `ds-btn--destructive-quiet` | "Delete record" sits inside a form being edited; a filled red block reads as the page's primary action. There was no outlined destructive variant, which is exactly why the page had forked `.ov-btn-danger`. |
| `ds-input--inline` | 25 values are edited in place. Mapping them onto the boxed `.ds-input` would have drawn 25 borders into a reading layout. |
| `ds-badge--pill` | The default badge is a soft rectangle; three surfaces had independently typed `999px`. |
| `ds-card--section` | A page content panel, not a tile — `--card-section-radius` / `--card-section-pad`. Seven per screen. Forking a second card class for this is what produced `.ov-card`. |
| **Tooltip** (block, planned) | Missed by the original 27-block survey because it has **no class of its own** — it's an `::after` on a `[data-tip]` attribute, so a class-rule census could not see it. |

The board header's split button added two more, and the second was only visible once the
first existed:

| Added | Because |
|---|---|
| `ds-menu` + `dsMenu` | A split button is a button and a menu. Building the caret with a private panel would have made the fourth hand-rolled menu in `crm.html` — the three existing ones each close on a different subset of outside-click / Escape / selection. |
| `ds-split` | Both halves are real `.ds-btn`, so the component owns only the seam. What it could *not* inherit was the pipeline's brand colour: `crm.html` painted `background` onto the one button directly, which left the new caret in stock blue beside a purple button. Setting `--accent-primary` on the wrapper instead carries fill, border, hover and the status dot's ring at once — a scoped token override, which is what the tier is for. |

The rule this suggests: when a surface resists a component, ask whether the component is
missing a variant before writing a local rule. Four of the five above already existed in the
product as a fork.

## Adopting it in the live app

The shipped CRM has its own tokens (`--dir-*` in `crm-directory.css`) and ~1,150
hardcoded hex values. The migration is deliberately incremental:

- `semantics.css` ends with a **bridge block** aliasing `--dir-*` onto the new
  semantics. A page adopts the system by deleting its own `--dir-*` definitions and
  inheriting these. No markup changes, because the markup already says
  `var(--dir-…)`.
- Then replace literals with tokens, file by file, screenshotting each.
- Then, and only then, replace hand-rolled controls with `ds-` components. This is
  the markup-level step and the slow one; it is per-surface and can stop anywhere.

Delete the bridge block once no page defines `--dir-*` locally.

---

## The building blocks

`registry.json` carries an **inventory** of every recurring UI role in this product,
derived by surveying all 756 distinct CSS class-rule roots in the CRM and clustering by
role — not by guessing at a component list. Each block records what duplication it would
absorb, which is also its priority:

| block | status | duplication it absorbs |
|---|---|---|
| Button, Icon, Input, Badge, Card | **built** | 46 / 196 / 46 / 25 / 40 variants |
| **Menu**, **Split button** | **built** | 24 rules across 3 prefixes / page-specific today |
| **List row** | **built** | 84 rules across 6 prefixes — the largest in the codebase. `ds-list-row` with `--interactive` and `--flush`; the record screen's activity and contact lists adopted it. The grid-column form (dashboard, `/crm/activities`) is a Table and stays page-owned |
| **Modal / dialog** | planned | 58 across 14 |
| **Section header / toolbar** | planned | 35 across 17 |
| Avatar, Divider, Checkbox, Empty state, Toast, Meter, Link, Tabs, Table | planned | 11–20 each |
| **Kanban card** | **built** | 17 rules across 2 prefixes. `ds-kanban-card` and its parts; the board adopted it in the same change. `renderCard()` still builds the markup as a string and keeps drag, click and the card menu |
| **Kanban column** | planned, **tokenised** | 7 rules, 0 hex. `--kanban-lane-*` mean a direction restyles the lane; the stage header's ink stays derived from the pipeline colour |
| **Nav item** | **built** | 16 rules across 3 prefixes. `ds-nav-item`; the dark sidebar and both light settings rails adopted it, the sidebar by overriding the `--nav-item-*` colour tokens on its own scope |
| Side panel, Stat tile, Search bar | planned | page-specific today |
| **Chart marks** | **built** | five shared `dsVisualization` renderers used by both the workbench and dashboard |
| Brand marks | **excluded** | external brand art, not a component |

Floating field is a registered composite built on the Input role rather than a new
inventory block: it composes a real `.ds-input`, persistent label and optional counter.
The inventory remains a census of recurring product roles, while the component registry
may contain compositions that make one of those roles usable in a distinct interaction.

Read that inventory before adding anything. Two rules follow from it:

1. **If a block is `planned`, you are the one who builds it** — as a component, not as
   another prefixed copy. `ao-btn-primary`, `np-btn-primary`, `ps-btn-primary`,
   `os-btn-primary`, `opp-btn-primary` and `dir-btn-primary` are all the same button; that
   is what happens when a page invents its own instead.
2. **If a block is `excluded`, don't componentise it.** Chart geometry belongs to the
   dataviz rules; brand marks go through `dsIcon.register()` or stay as assets.

## Scope: the CRM, not the mailbox

**`index.html` is out of scope.** It is the mocked half of the prototype — static demo
threads, its own `.nav-item` rules, 275 hand-rolled call sites — and it is not where the
system is being adopted. Both measurement scripts exclude it, along with `personas/`
(identity and mailbox threads, not CRM UI).

This is not bookkeeping. Left in the scan the mailbox dominated every figure and made CRM
progress unreadable: converting *all nineteen* of crm.html's icons moved the headline from
2% to 4%, because the denominator was mostly mail. Rescoped, the same work reads 7%, and
Icon reads 22% rather than 10%.

The exclusion is a denylist, not an allowlist, so a new CRM page is in scope the moment it
exists.

**One deliberate exception exists.** `index.html` links `tokens.css` and `components.css` for a
single component: the AI summary card in its CRM panel is `.ds-ai-summary`, the same card the
record screen uses, and a `ds-` class on a page that does not link the CSS renders nothing. The
links sit ahead of the page's own `<style>`, and none of its 14 custom properties collide with
the system's — adding them changed the mail view by zero pixels. Everything else in the mailbox
stays hand-rolled, and both measurement scripts still exclude the file, so this card is not
counted as adoption.

One consequence worth knowing: some mailbox CSS has leaked into `crm.html` and still counts
as CRM by file. `.thread-*` has **25 rules and zero markup uses** there, and `.email-tile-*`
has 10 — the same kind of stranded chrome the composer was. Until those are removed they
inflate `List row`, which is why that block carries a note saying so.

## Measuring adoption

**`node design-system/measure-adoption.js`** counts, per built block, how many call sites
in the shipped pages go through the system versus still hand-roll it. `--write` puts the
figures into `registry.json`, which is where the workbench's green bar segment comes from.
Run it before and after a migration pass; the delta is the only honest evidence that
anything moved.

Nothing hand-edits `adopted` / `legacy`. The patterns in that script are coarse on purpose
— the useful property isn't precision, it's that the same rule runs every time, so a
change in the number is real movement rather than a change of definition. `design-system/`
is excluded from the scan: counting the workbench's own `ds-btn` demos as adoption would
flatter every figure.

Two rules this measurement enforces:

1. **`built` is not `adopted`.** A component can exist and be used nowhere. Icon was the
   worked example: a real Phosphor module, 196 variants nominally absorbed, and six actual
   call sites against 185 inline `<svg>` blocks.
2. **Don't migrate dead markup.** Converting an unreachable `<svg>` raises the number
   without moving anything a user can see. The back chevron inside crm.html's dead
   `#opp-detail` panel is left alone for exactly this reason.

## Known gaps

- **21 of the 28 inventory blocks are still `planned`** — see the inventory above. The
  system currently governs tokens everywhere they are linked and includes registered
  primitives and composites such as Floating field; everything else is per-page.
- **Menu is built but not yet adopted.** `pipeline-nav-menu`, `card-action-menu` and
  `account-menu` are still hand-rolled; only the board's split button goes through
  `ds-menu`. Built is not adopted — that is the whole point of the two scripts.
- **No dark mode.** The reference has none. When it arrives it is a theme file, and
  primitives will need dark steps rather than an inverted filter.
- **Contrast is unverified** for the label palette pairs. Anything that becomes text
  on a fill should be checked before it ships — the `dataviz` skill's
  `validate_palette.js` is the tool already used for the dashboard.

## Anatomy and spacing contracts

Every registered component, composition, pattern and visualization has an `anatomy` contract in the registry.
Read it before adjusting spacing: it names the real parts, CSS selectors, owning tokens,
alignment and resizing behavior. It also records what the parent owns. For example,
`ds-card` remains a padded shell; adding `ds-card--structured` opts into shared header/body/footer layout defaults. An icon has dimensions but no internal padding contract.

### General roles → component tokens → applied spacing

Keep the primitive scale unchanged when changing a design relationship. General roles are:

| Role | Default | Intended use |
|---|---|---|
| `--layout-related-gap` | 8px | Related content in components that opt into this role |
| `--layout-item-gap` | 16px | Distinct items or groups within one region |
| `--layout-section-gap` | 24px | Separate regions and section-card insets |
| `--layout-container-inset` | 16px | Standard container content inset |

Component tokens remain the public adjustment points. For example, `--card-pad` reads
`--layout-container-inset`, while `--stat-label-value-gap` reads `--layout-related-gap`.
A general change reaches only tokens connected to that role. A component override changes
that component; a theme override can replace either level. Existing 3px badge/segmented
insets, 11px input inset, 14px button inset and theme-specific values are intentional
compatibility exceptions, not invitations to round every control to the same grid.

Components own internal insets and gaps; parents own space **between** components. Choose
one owner for each relationship to avoid doubled padding. Align content edges, keep related
content closer than separate sections, and use content-driven height except where a control
or chart explicitly defines dimensions. Preserve documented wrapping, truncation and
optional-part behavior.

### Inspecting spacing in place

Each component card has one **Preview / Spacing** toggle for all its specimens. Preview renders the actual
component; Spacing overlays its measured boundaries and token-owned padding, margins
and gaps in the same position. Switching modes does not resize the component.
Measurement labels show applied CSS values. Click or keyboard-activate a highlighted
region to reveal its relationship and owning token. Click outside or press Escape to dismiss. Theme, size and viewport changes
refresh the measurements. These controls do not edit or persist tokens.

Pixel and Structure sheets and the separate specimen selector are removed from the UI.
Anatomy metadata remains in the registry for implementation and automated checks.
Trend line and Activity heatmap retain SVG geometry; their coordinate spacing is not
represented as CSS gap tokens. Usage guidance remains collapsed; starter markup is retained in metadata.

### Asking for a change

- “Give related content more room throughout the system.” Review consumers of the shared
  related-gap role, change that role, and check the affected components and themes.
- “Increase the space above chart axis titles everywhere.” Change `--viz-axis-title-gap`.
  It currently maps to `--space-150` (12px) and applies to the shared binned-distribution
  renderer, including Amount spread. Omitting the title omits its node and gap.
- “Move these dashboard cards farther apart.” Change the parent page layout using the
  spacing scale; changing internal card padding would target a different relationship.

When adding or changing a composition, component, pattern or chart, update its anatomy alongside the CSS. `specimen`
selects complete examples; `parts` describe measurable regions; `spacing` maps a relationship
and token to its CSS selector/property. Size-dependent chart aliases resolve to their selected
size token; `narrowToken` records the existing 380px container-query override. Record layout
ownership honestly, and do not add structural guarantees that the component does not enforce.


## Starting new content with composition defaults

Use the `compositions` registry entries before writing a new layout. The classes are loaded
through the existing `/design-system/components.css` entry point; no additional page links
or scripts are required. These are opt-in and do not rearrange existing plain cards.

| Composition | Start with | Defaults |
|---|---|---|
| Vertical stack | `ds-stack` | 16px between items; `ds-stack--related` uses 8px; `ds-stack--sections` uses 24px |
| Wrapping row | `ds-row` | 8px, centered alignment, wraps; `ds-row--items` uses 16px; `ds-row--end` aligns trailing actions |
| Grouped section | `ds-section` | Optional `ds-section__heading` groups title/description at 8px; heading/body and body items use 16px |
| Structured card | `ds-card ds-card--structured` | Card inset 16px; regions 16px; heading content 8px; body items 24px; footer actions 8px |

Section-card headings use the default 16px region gap. A main record title may
override `--card-region-gap` to `--space-300` (24px) on its containing card,
as `.ov-record-summary` does; this preserves the distinction in heading hierarchy.

`.ds-card__body` sets `--card-content-gap` to `--space-300` at component scope.
Overrides for this relationship must target the body itself; inherited root/theme
values do not override that declaration.

A new card can start here:

```html
<article class="ds-card ds-card--structured">
  <header class="ds-card__header">
    <h3 class="ds-card-title">Record overview</h3>
    <p class="ds-card-sub">A short description.</p>
  </header>
  <div class="ds-card__body">
    <p>Primary information</p>
    <p>Supporting information</p>
  </div>
  <footer class="ds-card__footer">
    <button type="button" class="ds-btn ds-btn--primary">Save</button>
  </footer>
</article>
```

Omit or set `hidden` on optional regions; neither creates a layout item or an extra gap.
Do not leave empty placeholder wrappers. The card owns the inset once; its regions do not
add padding again. Direct prose margins are reset within compositions so `gap` owns spacing.
The structured header replaces the legacy subtitle margin with its own heading gap. Add
`ds-card--section` when the existing larger section-card inset is needed.

General roles supply defaults; composition tokens such as `--stack-gap` and `--card-region-gap`
are the adjustment points; named modifiers select supported alternatives. For a justified
page-specific exception, override the owning composition token in a page-local class using
another existing spacing token, and document why. For example:

```css
.record-summary-card { --card-region-gap: var(--layout-item-gap); }
```

This changes region separation to 16px for that card and its descendants without changing
all section spacing. General design changes belong in root semantic tokens or theme overrides.
Do not override an inherited general role locally and assume already-computed aliases will
re-resolve; override the owning component/composition token at the intended scope.

## Pattern anatomy defaults

All three patterns have in-place spacing overlays and explicit ownership contracts. Their
workbench wireframes illustrate region layout; they are not complete product dialog or
navigation implementations. Shared `--pattern-*` tokens provide defaults for **new adopters**:
16px region insets, 16px items, 24px sections and 8px action gaps. Existing product pages do
not inherit these tokens until their page-owned layouts reference them.

- **Modal dialog:** header, bounded scrollable body and footer share an inset. Adjacent
  padded regions and dividers provide separation; do not add a second stack gap between them.
  The adopting page owns width, viewport height bounds, focus trapping and dismissal.
- **Full-page settings:** full-width task header, optional local navigation and content
  sections. Omitting navigation removes its column. Narrow navigation stacks above content;
  page content flows and scrolls normally. The workbench toggle demonstrates the optional rail.
- **Two-pane workspace:** one shared bounded frame, independently scrollable panes and a
  separator. The specimen starts at 60/40 with a 50–68% resize range and stacks below an 18rem
  specimen width. The adopting page chooses content-driven dimensions, breakpoint and limits;
  the separator disappears when stacked. Sheets refresh after keyboard or pointer resizing.

A pattern owns region arrangement; a region owns its inset; compositions own grouping within
that region; child components retain their own internal spacing. Pattern-specific requirements
and documented variants refine the general defaults instead of silently duplicating them.

Workbench icon-weight and theme preview controls live in the Directions view. Their
selection applies across the workbench; other views omit the global toolbar. Spacing overlays distinguish container and content boundaries on the live specimen.

Workbench specimen groups place variant labels above their wrapping content with the
shared related-content gap (8px). Content uses the shared item gap (16px); variant
groups use the shared section gap (24px). Labels and previews share the same left edge.

Pattern insets have independent axes: `--pattern-content-inset-x` controls left/right
padding and `--pattern-content-inset-y` controls top/bottom padding. Both default to
`--pattern-content-inset` (16px). Change the shared base in the token definitions for
both axes, or adjust an axis token independently. For local overrides, set the axis
tokens on the consuming scope. Spacing tooltips expose the token for the selected side.

Keep spacing controls shared by default. Do not introduce independent axis or side
tokens unless requested or required by an existing intentional exception. The card
inset is one `--card-pad` control: the inspector labels all sides as one inset and
selects matching highlights together. Separate geometry measurements are not separate controls.

### Spacing inspector label rules

Show one numeric label per owning token and resolved value within each specimen group,
not per highlighted edge or repeated gap. Keep every affected region visible and
selectable; selecting a token highlights its uses throughout the component card.
Distinct tokens must remain distinct even when their values match. If the same token
resolves differently across variants or overrides, retain those distinct measurements.
The tooltip provides the relationship, applied value and exact token with Copy variable;
outside click and Escape dismiss it. These presentation rules apply to components,
compositions, patterns and charts through the shared inspector, without changing tokens
or product geometry.

Workbench catalogs lead with the rendered visual, followed by the component/pattern
name, view controls and optional guidance. Foundations spacing examples likewise show
the visual before the role name and metadata. Keep DOM reading order aligned with this
presentation; page navigation headings remain above their content.

The workbench is primarily for designers: do not display View code or Starter markup
accordions. Keep source excerpts and composition markup in implementation metadata.
Identity rows beneath previews use a plain background with a top separator, not a tinted
header fill. Token inspection and copying remain available for design adjustments.

Examples are direct preview launch cards with an expand icon, not nested accordions.
They open the current CRM implementation in a non-interactive modal frame with fixed
fictional data. `sourceExamples` in `anatomy.js` identifies the source HTML and canonical
route; the loader supplies the asset base and injects `example-fixtures.js` before app
scripts. Source failures show a readable message. No live API or stored user records are
required, and example interactions cannot save CRM data. Close, Escape and backdrop click
dismiss the modal. Follow `run crm.md` when starting the local server.

Example previews default to Focused mode: resolve the declared selector, scroll it into
view, dim surrounding content and highlight the measured spacing property. A caption
explains the relationship and copies the owning token. Full screen removes the spotlight.
Targets are resolved from the live DOM as it updates; missing targets show Example
unavailable instead of substituting unrelated content. Maintain exampleFocus alongside
sourceExamples when CRM selectors or spacing ownership change.

### Deterministic CRM example data

All example frames load current CRM HTML/styles/renderers with `example-fixtures.js`
injected before application scripts. The fixture supplies fixed fictional records to
GET /api/data and isolates storage in memory. Other API reads return an unavailable
response; writes, beacons and network connections are blocked. Examples no longer
depend on records in the user's workspace. Update fixture schemas when CRM data
contracts change; do not copy renderer markup or fall back to live data.

Example modal headings name the principle being taught first, explain its relationship
in one sentence, then identify the concrete CRM example. Descriptions must match the
actual highlighted content (for example, stat label/value rather than title/description).


## LLM workflow for new and existing screens

Use this checklist as the implementation contract, not the workbench's visual resemblance.

1. **Choose the screen pattern.** Read the matching `registry.json.patterns` contract,
   including routing, keyboard behavior, optional content and responsive rules. Identify
   the actual registered components and compositions required by the task.
2. **Inspect the consumer.** For existing screens, trace imports, markup, generated markup,
   local CSS and event hooks. A `ds-*` class is not proof of adoption if local rules override
   its appearance. For new content start with Stack, Row, Section or Structured card;
   do not invent slots on the plain card shell.
3. **Reuse the implementation.** Load `tokens.css` and `components.css`; use registered
   classes and supported variants. Preserve IDs, hook classes and behavior during migration.
   Remove redundant local control paint, typography and padding once the shared class owns them.
4. **Choose the owning control.** Internal spacing belongs to the component's public token;
   spacing between components belongs to the parent composition or pattern. Prefer existing
   semantic roles. Do not create a token for each number, side or instance. Split controls
   only when requested or when a documented intentional exception requires it. Equal current
   values alone do not make unrelated roles interchangeable.
5. **Keep genuine page geometry local.** Content widths, editor proportions, sticky offsets
   and specialized widgets without a registered equivalent may remain local. Use semantic
   colors/type/spacing, record the reason, and never invent an unregistered `ds-*` component.
   Repeated reusable gaps are candidates for a separately scoped system addition.
6. **Check behavior as well as appearance.** Review default/soft themes, narrow/wide widths,
   long labels, empty and optional content, disabled/loading states and keyboard access.
   Do not submit or delete user data to test a visual migration; use isolated sample data.
7. **Validate and report honestly.** Check JS syntax, token references and changed registry
   data against its schema. Run `measure-adoption.js` and `measure-inventory.js` without
   `--write`. These are heuristics, not compliance scores. Inspect actual rendered screens
   and workbench examples; state any untested behavior and intentional local exceptions.
8. **Maintain one source of truth.** Update registry anatomy when a shared contract changes,
   source selectors/lesson captions when examples change, and fixture shapes when API contracts
   change. Shared token changes affect only consumers of those tokens, after refresh; they
   do not automatically migrate hardcoded layouts. System edits require explicit task scope.

### Pipeline settings adoption

`pipeline-settings.html` uses shared section cards, buttons, inputs and token-based pattern
spacing. Its navigation rail, stage chevrons, rule/task editor and modal shell remain
page-owned structures: the registry has no matching reusable components for these. Their
visual values use system tokens; widths and specialized editor geometry remain local.
See `audits/pipeline-settings.md` for the audit scope and verification limits.


## Inspect spacing on CRM screens

In Components mode, hold **Ctrl / Cmd** to target the exact element under the
pointer, including unregistered internal elements. Click while held to pin its
instance context; containing components remain available in the hierarchy.
Release the modifier to restore normal component targeting (or the pinned outline).

Spacing details include **− / +** buttons that immediately preview the previous/next
spacing-scale value, with the current pixel value between them. **Shared / Local**
buttons choose scope; Shared is disabled when ownership cannot be resolved. Choose
the shared token owner (including its theme/local declaration), the same literal
CSS rule/property, or an explicit instance override. Blue highlights group by the
owning declaration, never by equal pixel values. Direct `--space-*` consumers edit
their consuming rule; the primitive scale is never edited by this control.
Unresolved or compound ownership permits instance overrides only.

Previews modify browser styles temporarily; they do not save files. **Reset previews**
restores the original declarations, and reloading also discards the previews.
The toolbar lists pending changes. **Copy changes prompt** includes original source
context, chosen scope, owner, requested token and the current-page affected count.
Counts cover matching highlighted elements in the viewport; offscreen elements,
hidden elements and other pages are omitted. Shared source edits can affect all of them.
Paste the prompt into the coding conversation to persist the reviewed changes.

Append `?ds=true` to a CRM tool URL (or `&ds=true` after existing query parameters), before
its hash, for example `/crm/dashboard?ds=true` or `/crm/pipeline/neo/setting?ds=true#details`.
The optional `spacing-inspector.js` runs only for this flag; it is not loaded into mailbox
or workbench sample frames. New CRM pages should include
`<script defer src="/design-system/spacing-inspector.js"></script>` alongside the two CSS
entry points. The inspector makes no data writes and does not alter component layout.

- Amber: the applied spacing declaration references a defined design-system token.
- Soft red: an inspectable literal spacing declaration. This can be intentional page layout.
- Gray dashed: ownership could not be established (including custom aliases, inaccessible
  stylesheets or unsupported cascade constructs). Do not treat gray as a failed adoption.

Click a region to see its property, resolved pixels, owning variable, declaration and source
selector/file. Copy variable copies the exact token; literal values offer Copy declaration.
Matching token/value regions highlight together. Outside click, Escape and Close dismiss the
popup. Filters hide categories; Pause clears overlays so normal page interactions are available.
Reload without `ds=true` to disable inspection entirely. The flag is not persisted in storage.

The inspector reads the current CSSOM, active media/supports rules, inline styles and source
order/specificity. It refreshes for DOM changes, scrolling, resizing and completed animations.
It measures positive padding, unambiguous margins and actual adjacent flex/grid gaps, clipped
to scrolling ancestors. It does not visualize negative/collapsed block margins, distributed
alignment space, pseudo-elements, iframe contents, fragmented inline boxes or rotated/scaled
boxes. Complex selector/cascade cases are conservatively unresolved. This is a design aid,
not exhaustive CSS cascade analysis or an automated compliance test. Token-backed spacing may
still be overridden locally; the tooltip shows the consuming declaration, not a claim that
its value is globally uniform. No primitive normalization or token edits happen automatically.

Form field groups should use `.ds-field`, `.ds-field-label` and `.ds-field-hint` with associated controls. `--field-content-gap` owns label/hint/control spacing; a parent section stack owns gaps between fields. Avoid overlapping local margins: they obscure ownership and can collapse. Pipeline settings Main details adopts this structure, including color and radio groups. Domain-specific label wording remains page content.

Field readability defaults: `--field-content-gap` resolves to 12px (`--space-150`). Shared labels and hints use `--text-md` with 1.5 line height; hints use secondary text contrast. This applies to all consumers of these classes, including workbench examples. Keep field-group separation owned by the parent stack (24px for section stacks).

In `?ds=true` mode, **H** toggles spacing highlights between Pause and Resume. The button displays the shortcut. Typing in inputs, textareas, selects or editable content, composing text, held-key repeats and Ctrl/Meta/Alt shortcuts do not trigger it.

The URL inspector’s **Copy spacing context** action copies the token plus the specific consumer: page/route, DOM selector, classes, short label/section, gap endpoints, property/value, CSS declaration/source, explicit state and viewport/theme. It does not read input values. Use this context to evaluate local, variant or shared scope rather than assuming a token-wide change.
