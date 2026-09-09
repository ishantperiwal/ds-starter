# Verification and release checklist

## Automated checks for 0.3.0

Run from the starter directory:

```sh
node framework/validate.js
npm test
node framework/release.js --check
```

The suite checks:

- Both catalog contracts, source/preview paths, CSS imports, anatomy token
  definitions and classic JavaScript syntax; malformed component contracts fail.
- Anatomy initialization without the original Titan workbench DOM.
- Every registered component/composition specimen has a provider, using the actual
  icon implementation rather than a placeholder library.
- All five shared chart renderers produce markup and respond to the size control.
- HTTP mounts, catalog/profile separation, preview pages and recursively referenced
  local HTML/CSS assets; private routes, traversal and general writes are rejected.
- Release dry runs, successful installation and backups, unchanged project files,
  refusal of edited managed files and corrupted release contents.
- Independent moodboard stores in two studio instances, persistence and undo,
  with cross-origin and non-JSON writes rejected.
- Repeat-safe external initialization, paths with spaces, no relocated screens or
  overwritten app instructions, collisions and symlink-overlap rejection.
- Two attached apps with independent catalogs and board stores; existing nested
  screens and root-relative assets, private-data/hidden-file protection.
- Checked Git update against a disposable local upstream: instructions and UI
  refresh while app files (including board data) stay byte-for-byte identical.
  Dry run/no-op, dirty checkout and incompatible-contract refusal are tested.
- All eight shared presentation views with populated and empty catalogs, real
  registry counts, explicit unknown adoption, component/pattern contracts and deep links.
- Foundation declaration scopes, simple root aliases/cycles, theme isolation and
  escaping of app-supplied labels. Shell CSS imports are studio-owned only.

The HTTP checks need permission to bind a loopback port. Update tests use generated
temporary directories and remove only their own fixtures. They never update this
starter's installed framework or your app. Tests remain usable after your project
catalog is populated; they compare the served catalog against its source.

The local sandbox may use port 8030 when 8020 is occupied. Browser automation was
unavailable for this presentation update, so **visual layout, pointer/keyboard interactions, computed
CSS ownership and perceived performance have not been browser-verified**. Renderer
tests use lightweight DOM stubs and do not substitute for these checks.

## Browser acceptance checks before a release

1. Open `/`. Visit all eight tabs. Switch between Sandbox and Your project. The
   project should show its own catalog, not the sandbox's components or palette.
2. Check 1800px and 390px viewports, Fluid/320px specimens, scrolling and keyboard
   focus. Verify there are no console errors or missing network resources.
3. Inspect component anatomy: hover spacing regions, toggle optional parts and
   confirm the real shared styles control the specimen. Verify long/empty content.
4. Open `/demo/screens/record.html?ds=true`. Pause inspection with H; try the mock
   menu, fields and add-note action. Nothing should submit a real app operation.
5. Open `/demo/screens/ownership.html?ds=true`. Select Shared A's gap. A and B must
   match by owner; Local owner, Equal pixels and Inline owner must remain distinct.
   Hidden consumers are not a promise of visible-highlight counts.
6. Press −/+ repeatedly and toggle Shared/Local. Check responsive feedback and
   exact scope; unrelated local/theme declarations must remain unchanged. Inspect
   the literal fixture and verify its chosen token/declaration and source context.
7. Copy the changes prompt. Check original versus requested declarations, owner,
   selector, source, affected count and scope. Reset and reload must remove previews.
8. In Components mode, hold Ctrl/Cmd while hovering nested text/controls, including
   unregistered page-owned elements. Release it to restore component targeting.
9. Compare Directions themes and their inspector contexts. A theme override must
   not be conflated with the default token owner. Add a project-specific fixture
   whenever a real cascade bug is discovered.
10. Try icon search, supported weights and copy. Change chart size. Open/close the
    modal using keyboard, switch settings sections, resize the split pane with
    pointer and arrow keys, and verify its narrow-screen fallback.
11. In Moodboard add a disposable reference, edit its note/source, arrange it and
    undo. Reload to check persistence, then export. Board data must stay outside
    framework/. Do not use private reference images for tool-development fixtures.
12. In a disposable consumer copy, apply a reviewed release. Check your project
    previews, board persistence and rollback before rolling out to real projects.
13. Initialize against an existing app with screens in different folders, then start
    with its --config path. Verify the app-owned location notice, its empty catalog,
    registered screen previews and agent instruction link. Repeat for another app
    on a different port; references and tokens must remain isolated.
14. Compare the shared presentation against the Titan workbench at desktop and
    narrow widths: dark rail, ledger, foundations, component specimens and pattern
    contracts. Check filtering, direct component links, preview width controls and
    selected nav counts. Change preview themes; the studio shell must stay unchanged.

## Known boundaries

- CSS inspection is heuristic, not a complete cascade engine. See
  framework/CONTRACTS.md for token-path, alias, theme and source limitations.
- Validation supports the documented portable schema vocabulary and classic JS;
  an app using module scripts or a build tool should add its own build/lint checks.
- No screenshot diffing or performance benchmarks are included yet.
- The reference snapshot is historical; its scripts and adoption counts do not
  validate new projects. The sandbox demonstrates a curated subset, not every
  archived component state or every chart contract.
- Release integrity checks are not publisher authentication. Remote hosting,
  signing, CI publication and automated update discovery are not configured.

## Component inspection tab (local development)

Added a third Component view using the same specimen DOM, alongside Preview and
Spacing. The inspector highlights real element bounds and intercepts pointer
activation while enabled. Registered class matches use actual catalog entries;
other DOM nodes have explicit structural labels, selectors, and nearest registered
owners. Ancestors outside registered roots are labeled specimen layout. The panel
supports clickable ancestry, Control-click (pointerdown for macOS), Cycle layer,
Control+ArrowUp, reference copying, and Escape/close to Preview. Listeners, overlays,
resize observers and panel are disposed with the preview binding.

Browser checks in attached Titan: selected Bold's image, Control-clicked to its
registered Icon button, and checked the source/selector. The specimen action result
remained empty. Clipboard readback confirmed element-reference text, the icon-button
ID and composer variant selector. In App switcher, selected Titan Labs text and
cycled through its row to the registered Launcher item. Screenshots checked outlines,
hierarchy and panel layout. Closing and navigation removed the inspector panel.
37 studio tests pass, including new identity/reference tests; attachment and sandbox
validation have no errors. Hover behavior is implemented but was not independently
visually checked because the browser automation locator lacks hover. Narrow bottom
sheet and expanded-dialog inspection have not been visually certified.
