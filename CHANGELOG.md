# Changelog

## Unreleased

- Tokenize the interaction panel's surfaces and buttons (dependency buttons, variant
  chips, state chips, panel/body) so they follow the studio dark scheme instead of
  staying white.

- Tokenize the component detail's floating surfaces (Uses N components popover,
  ⋯ menu, info dialog, dependency-count pill) for the dark scheme.

- Resolve simple `color-mix(in srgb, …)` token values in the studio model so theme
  surfaces can layer computed shades and still be inspected and contrast-checked.

- Keep old `#patterns/app-switcher` links working via a route alias to the generalized
  Anchored popover disclosure pattern.

- Fix search/category sorting moving filterable cards above non-filterable siblings
  (it pushed the Layouts & patterns tab row thousands of pixels down). Sorting now
  reorders only the filterable block, anchored in place.

- Overview: drop the studio version line and the Registered screens heading rule,
  and give every catalog stat its own bordered card in a wrapping grid.

- Hide the rail's Working catalog picker and playground link; the studio stays on
  the configured default profile (use `?profile=demo` to reach the tool sandbox).

- Move catalog counts and the studio version from the persistent rail footer into
  the Overview stats.

- Replace the component-detail more button's `⋯` text glyph with a centered SVG so
  it stays optically centered in its 34px control across studio typefaces.

- Use self-hosted Space Grotesk (OFL, variable 300–700, latin/latin-ext/vietnamese
  subsets) as the studio UI typeface via `--studio-font`; preview frames keep the
  app's own font tokens.

- Inset the spacing inspector's component panel content (heading, registered
  preview, actions) from the panel edges; it previously inherited the tip's
  zero padding and ran edge-to-edge.

- Lift the black chrome one step lighter after review (rail #17181d, sidebar
  #1e1f25, selected category #363843).

- Set the Components view page background to the rail black so the floating
  navigation panels' insets and gaps no longer show the light page behind them.

- Darken the studio rail and Components sidebar surfaces (rail #101114, sidebar
  #16171c, selected category #2c2e36) for a deeper black chrome.

- Dim the canvas backdrop while a component is focused so the white detail cards
  and their controls separate from the page.

- Hide the Fit all control while a component is focused; the focused detail view is
  a scrolling context, not the pan canvas.

- Swap gallery-card surfaces: preview stages use the white studio surface and the
  component naming footer uses the former preview off-white (#f5f5f2). The expanded
  dialog's preview body keeps its off-white canvas.

- Preserve search focus when typing closes a focused component view.

- Document shared specimen gallery presentation and concise configuration captions
  instead of inline implementation commentary.

- Separate configuration preview coverage from API variant classification, including
  content presence, sizes and explicitly requested combinations.

- Define interaction units, registration invariants and a general decision procedure;
  examples illustrate the policy rather than defining component-specific exceptions.

- Require registered owners for independently interactive sections across all
  components, replacing the split-only framing and private-part target allowance.

- Prioritize existing registered components/compositions over new layout assembly;
  layout guidance does not deprecate action groups or app grids.

- Inset pattern contract accordions and clarify that layout guidance is not a
  required application utility API.

- Make layout recipes versus component responsibilities an explicit
  shared extraction rule for attached apps, with app-owned tokenized defaults.

- Remove the variant selection overlay so main previews remain interactive and
  expanded instances can be inspected without resetting their state.

- Clarify mandatory state-value, control-treatment and action ownership; distinguish
  unchanged stateful reuse from variants and independent component responsibilities.

- Remove stacked minimum heights from variant specimen wrappers and let fluid
  specimen hosts use the available preview width, reducing excess empty space.

- Focus the first variant on opening and add variant navigation chips above
  Contract & Anatomy that select and pan to their corresponding preview.

- Restore the selected variant’s live preview above interaction states, including
  components without registered state targets.

- Place component and variant copy controls beside their names and add a subtle
  dot matrix to the variant preview canvas.

- Give single-preview components a named Default tile and variant copy action;
  preserve registered target names and show the same name in interactions.

- Restore the Component preview toggle with in-place inspection highlights while
  keeping the separate inspector sidebar closed and interaction states visible.

- Fit full-width variant tiles inside bounded pan/zoom canvases with Recenter;
  size the right-hand interaction panel from its specimen width.

- Select registered variant targets directly from bordered preview tiles, with
  contextual copy controls and a state-only interaction panel.

- Use a shared top-center toast for copy feedback, including inspector frames,
  without changing button labels or inserting inline layout messages.

- Size canvas cards from registered preview widths and measured specimen heights;
  reflow mixed-size cards without fixed thumbnail crops.

- Make the component canvas full-bleed with floating glass pill navigation, bottom
  zoom controls, animated focus transitions and a right-side interaction panel.

- Add a pannable, zoomable component canvas with search, Fit All, focused dependency
  previews, ancestry navigation and the existing interaction/inspection tools.

- Allow docked elevation role previews to retain placement while linking to a level.

- Remove elevation Details disclosures and duplicate level-backed role samples.

- Add an isometric elevation stack navigator with keyboard-accessible level links
  and reduced-motion scrolling.

- Support ordered elevation levels and level-to-role relationships alongside
  specialized recipes; retain older elevation catalogs.

- Support border-and-shadow elevation previews and full-height docked side panels.

- Generate an app-owned run-ds.md entry point on initialization: follow the attached
  DS for tasks or start/reuse its studio. Preserve existing attachments and customizations.

- Show elevation primitives and semantic roles with selectable relationship links.
  Preserve legacy roles without primitive metadata.

- Simplify elevation samples, move values into Details, and support optional
  right/bottom docking previews without changing shadow tokens.

- Add heading copy references for catalog groups and foundation sections.

- Add editable search tags with persistent catalog saving and success/error feedback.

- Add hidden searchTags and ranked, debounced search for phrases, words and partial words.

- Bound Component inspection to real registered component instances and their
  descendants; exclude specimen captions, mounts and variant-grid wrappers.

- Remove the Overview adoption sheet and unmeasured adoption statistic; retain
  catalog totals and registered screen previews.

- Distinguish inspected components with badges and blue outlines; use quiet
  structural labels and hide wrappers under Show layout layers. Support explicit
  data-inspector-variant labels without changing catalog IDs.

- Label basic inspected elements simply as Text, Row, Container or Icon, without
  implying that a missing catalog registration needs fixing.

- Add Component inspection alongside Preview and Spacing: real-element hover,
  pinned selection, Control-click ancestry cycling, clickable hierarchy and copyable
  references. Registered nodes use catalog identity; other nodes retain structural
  labels and selectors. Inspection captures actions without changing app components.

- Place preview controls below component specimens and above their identity footer;
  remove the redundant Interactions footer label while keeping preview selection.

- Give component preview toolbars a 64px header with more vertical inset and a
  clearer separator. Share header height between frame fitting and click overlays.

- Require interaction ownership audits for component registration; document nested
  dependencies and keep child state previews with their owning component.

- Fit gallery previews to all supplied examples and clean up resize observers
  on navigation. Include the app’s existing secondary-disabled split state.

- Show all supplied action variants/states in compact labelled gallery previews.

- Allow same-origin component detail previews to fit their content and resize
  when the preview width changes, avoiding empty space below short controls.

- Lead Components with categorized preview tiles and reveal states/contracts in
  an accessible floating dialog on selection; support dismissal and deep links.

- Clarify component sheets with distinct name/description headers, specimen areas
  and contract footers; remove implementation class names from visual headers.

- Remove inspector/source/renderer links from visual specimens; retain source
  metadata in the registry for implementation workflows.

- Support bounded optional component preview heights for compact live specimens.

- Scope Draft-label styling to column headings so sample metadata has no unintended left offset.

- Support evidence-backed text-stack, icon-label and action-group spacing specimens;
  remove the unassigned 4px preview text gap and accept explicit text-gap references.

- Replace the basic Colors tab with Color roles when relationship data exists;
  retain compatibility with old Colors links.

- Extend grouped expandable relationships to roundness, using existing aliases
  and actual-radius content previews without redundant tags.

- Remove redundant descriptive tags from expanded spacing previews.

- Keep spacing expansion indicators beside the value on the same row.

- Stop spacing connection arrows at the outer value-group border.

- Fix the spacing preview wrapper so collapsed rows retain their token names and values.

- Render spacing value groups as outline-only fieldsets with inset legends;
  frame expanded examples separately from token rows.

- Group spacing roles by resolved distance, with click-expanded examples and
  related-role expansion from primitives; outside click and Escape collapse them.

- Show readable message headers, mail rows and message text in spacing specimens
  while preserving the measured token-controlled gaps and insets.

- Add spacing relationships with aligned primitive bars and measured gap, horizontal
  inset and vertical inset diagrams backed by existing app tokens.

- Show exact semantic token names directly in grouped color rows.

- Replace the color connection map with grouped primitive/use rows and a fixed
  detail panel; outside click, Escape and the close button dismiss selection.

- Use Text styles in place of the separate Typography tab when recipes exist;
  retain every typography primitive, including unconnected values, in the map.

- Compact color-role cards with capped width, tighter padding and shorter samples.

- Add Color roles with primitive/semantic connections, contextual text samples,
  explicit background tokens and contrast ratios for opaque hex color pairs.

- Distinguish text style names from specimens with compact neutral tags.

- Align semantic names, arrows and resolved values in shared grid columns.

- Show resolved values directly beside semantic token names with arrows and a
  distinct value color; remove the duplicate typography property block.

- Expose complete font fallback stacks, named numeric weights and labelled text
  style properties; distinguish unassigned line heights from explicit values.

- Show explicit semantic token names alongside draft text styles and resolve
  specimen properties through those aliases when provided.

- Add an optional Text styles relationship view with shared primitives, draft
  specimens, hover/focus highlighting and click-to-pin connections.

- Remove Review notes from the overview presentation.

- Place foundation search beside the tabs and search across all foundation categories,
  preserving the query when switching tabs.

- Stack spacing tokens in aligned rows with fixed-height, actual-width bars for
  direct comparison from a shared starting point.

- Replace More values with visible typography categories and multiline line-height
  specimens; support letter spacing, style, decoration and case when present.

- Respect explicit token layers in Foundations; show primitive scales first and
  keep typography weights/leading in More values.

- Remove the global top bar and its preview theme control.

- Remove the app attachment paths and shared workflow footer from the studio UI.

- Remove per-token Details and hover expansion. Keep additional values in a
  separate accordion with a stable, explicit toggle.

- Follow the supplied reference with compact color cells, unboxed type rows and
  simple blue spacing/radius specimens. Keep token names and values visible.

- Keep token names visible, simplify spacing to a compact scale and roundness to
  plain shape/value samples; remove radius status and magnification commentary.

- Present foundations with readable typography specimens, color swatches and
  spacing/radius samples; keep source/scope in closed Details.
- Support optional app-owned foundation labels/examples without changing tokens
  or requiring a catalog migration. Improve type-role and resolved-color grouping.

- Remove repetitive section introductions and instructional copy; retain concise
  labels, actionable errors and expandable review/contract details.

- Let Moodboard fill the available workspace, hiding catalog headers, theme controls,
  and attachment details and removing the canvas frame and outer spacing.
- Preserve sidebar navigation and canvas controls; constrain scrolling to the canvas.

## 0.3.0 — consistent Titan-style workbench presentation

- Restore the compact dark sidebar, centered workspace and ledger-style overview.
- Keep studio visual tokens/layout upstream-owned, independent of app themes.
- Display foundations with visual samples, source/scope labels and filtering.
- Use full-width component specimens with deep links, width controls and readable anatomy.
- Render patterns with live examples, usage, structure and behavior requirements.
- Retain live icon providers, chart previews, direction comparisons and app-owned boards.
- Derive counts from each catalog; show missing adoption metrics as Not measured.
- Add presentation/data-isolation tests; preserve catalog contract v1 and app content.

## 0.2.0 — plug-in studio and app-owned content

- Initialize against existing apps without an inbox, screen copying or relocation.
- Create a separate app DS folder once; repeat initialization preserves its content.
- Resolve configured content and existing screen URLs through shared server/validator mounts.
- Keep app boards, registries, tokens, specimens and local instructions outside the studio checkout.
- Load current shared agent instructions through an app-owned loader instead of frozen copies.
- Add checked Git software updates for the entire studio, including root UI/workflow files.
- Refuse dirty/divergent updates, overlapping folders and incompatible content contracts.
- Preserve v0.1 catalog and legacy startup compatibility; schema contract remains v1.
- Add regression tests for in-place attachment, isolated apps, safe serving and app-preserving updates.

## 0.1.0 — initial extraction

- Standalone localhost server and registry-driven eight-tab workbench.
- Empty project catalog separated from the fictional inspector sandbox.
- Extracted spacing/component inspector, stepper, shared/local scopes and copy prompts.
- Configurable registry/workbench URLs and reusable anatomy overlays.
- Reference controls, icons, chart renderers and screen pattern fixtures.
- Same-process persistent moodboard.
- Contract/source validation, regression tests and hash-checked framework releases.
- Retained original Titan DS snapshot for reference; no CRM database copied.

## Local component gallery refinement

- Catalog-driven category filters with All, integrated with component search.
- Equal-height gallery rows and flexible columns as component families grow.

- Component details now reuse the reference Preview / Spacing measurement toggle
  inside isolated live specimens, replacing width controls for components.

- Preview / Spacing controls are available on gallery cards and outside detail
  frames. Frames fit their content without a height cap or internal page scrollbar.

- Spacing inspector now draws right-margin bands as well as left margins.

- Component details lead with the visual, followed by the heading. Gallery modal
  activation is limited to the bottom name button, without a full-card hit overlay.

- External gallery spacing controls now set inspector state directly instead of
  synthesizing clicks inside inert thumbnails; pre-load selections are retained.

- Gallery footers show larger names and class references, with view toggles on the
  right. Only the dedicated top-right preview expand control opens component details.

- Spacing status sits in a reserved top-right row above the specimen rather than
  floating over component previews.

- Registered screens include an Open full page button that opens the actual preview
  URL in a new tab, preserving the selected preview theme.

- Component gallery cards use bounded catalog widths and wrap without stretching.

- Gallery specimens are vertically centered within their preview stage; action
  specimens center controls beneath their variant labels.

- Optional catalog-driven Interactions sidebar with live and held state previews,
  per-control targets, Escape/outside dismissal and focus return on explicit close.

### Unreleased

- Preserve search focus when typing closes a focused component view.

- Document shared specimen gallery presentation and concise configuration captions
  instead of inline implementation commentary.

- Separate configuration preview coverage from API variant classification, including
  content presence, sizes and explicitly requested combinations.

- Define interaction units, registration invariants and a general decision procedure;
  examples illustrate the policy rather than defining component-specific exceptions.

- Require registered owners for independently interactive sections across all
  components, replacing the split-only framing and private-part target allowance.

- Prioritize existing registered components/compositions over new layout assembly;
  layout guidance does not deprecate action groups or app grids.

- Inset pattern contract accordions and clarify that layout guidance is not a
  required application utility API.

- Make layout recipes versus component responsibilities an explicit
  shared extraction rule for attached apps, with app-owned tokenized defaults.

- Remove the variant selection overlay so main previews remain interactive and
  expanded instances can be inspected without resetting their state.

- Clarify mandatory state-value, control-treatment and action ownership; distinguish
  unchanged stateful reuse from variants and independent component responsibilities.

- Remove stacked minimum heights from variant specimen wrappers and let fluid
  specimen hosts use the available preview width, reducing excess empty space.

- Focus the first variant on opening and add variant navigation chips above
  Contract & Anatomy that select and pan to their corresponding preview.

- Restore the selected variant’s live preview above interaction states, including
  components without registered state targets.

- Place component and variant copy controls beside their names and add a subtle
  dot matrix to the variant preview canvas.

- Give single-preview components a named Default tile and variant copy action;
  preserve registered target names and show the same name in interactions.

- Restore the Component preview toggle with in-place inspection highlights while
  keeping the separate inspector sidebar closed and interaction states visible.

- Fit full-width variant tiles inside bounded pan/zoom canvases with Recenter;
  size the right-hand interaction panel from its specimen width. — text-part typography inspection

- Replace root-level tokenization verdicts with named text-part reports.
- Trace inherited styles and property-specific tokens in font shorthands; distinguish
  literal values, browser defaults and unsupported cascade cases with source details.
- Keep component instance copy context aligned with the text-part report.
- Add typography provenance tests. No component styling, catalog schema or release
  lock changes are included in this inspector update.

- Shared inspector now supports S for Spacing and C for Components, with visible
  shortcut hints. Typing, composition, held keys and modified shortcuts are excluded.
  Removed the App sidebar's duplicate shortcut registration.

- Add a persistent catalog theme picker in Foundations, index active theme token
  overrides, and adapt preview framing to the registered color scheme.
