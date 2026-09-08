# Studio software updates, not app-content synchronization

## Recommended: one upstream-connected checkout

Keep the studio as its own Git checkout, either adjacent to an app or ignored inside
it. One checkout can serve multiple external app configurations on different ports.
Each app keeps its own content folder, registry, instructions and board.

No remote renaming or forking is required for ordinary app use. Keep origin pointing
to the trusted studio upstream. The app’s repository owns its DS content separately.

From the studio checkout, with the server stopped:

```sh
node studio.js update --config /path/to/app-design-system/studio.config.json --check
node studio.js update --config /path/to/app-design-system/studio.config.json
node studio.js check --config /path/to/app-design-system/studio.config.json
```

The checked update:

1. Verifies the studio is an independent, clean Git checkout.
2. Loads the app configuration and checks that content is outside the studio tree.
3. Fetches the current branch’s configured upstream. Check mode stops after planning.
4. Reads candidate version/lock metadata and checks the content contract before
   checkout. Incompatible versions require an explicit migration.
5. Fast-forwards only the studio checkout. It never merges divergent history or
   resets local changes. UI, instructions and tooling update together.
6. Reports old/new commits. Restart the server, validate and review app previews.

App tokens, registry, components, screens, local instructions and board files are
not copied, deleted or rewritten. The generated app AGENTS.md loads the current
framework/AGENT-WORKFLOW.md through studioRoot, so instructions stay current without
overwriting app-specific instructions.

Use a trusted upstream. Compatibility checks are a contract boundary, not a guarantee
that every compatible-version release is bug-free. Test releases before broad rollout.
All apps sharing the checkout receive the software change; startup validates each
attachment’s contract. Keep separate checkouts when apps need different pinned versions.

## Maintainer workflow

Improve the shared software and sandbox in the studio repo. Update version.json,
CHANGELOG.md, tests and instructions. Keep contractVersion for compatible changes;
change it and supply a reviewed migration when the content format changes.

```sh
node studio.js check
npm test
node framework/release.js --write-lock
node framework/release.js --check
```

Commit and push when authorized. Consumers can adopt those commits with the checked
updater. Tags can identify reviewed releases. No automatic publishing or signing is
configured. Do not add app-specific content to the upstream repository.

## Recovery and local edits

The Git updater prints the previous commit and retains Git history. If a release
misbehaves, stop the server and switch the studio to a reviewed prior commit/branch,
preserving any local edits first. App content does not need a restore because the
updater did not touch it. Detached checkouts cannot use the branch updater until
returned to a tracking branch.

If you customized studio code locally, preserve/commit and upstream those changes.
The updater refuses dirty or divergent checkouts rather than discarding work.

## Legacy framework-only release bundles

The earlier bundle updater remains for v0.1 consumers. It updates framework/ and
its lock only, not root instructions or launchers. It is not the preferred mechanism
for the new whole-software installation model.

```sh
node framework/release.js --output /path/to/new/studio-release
node framework/update.js --from /path/to/studio-release
node framework/update.js --from /path/to/studio-release --apply
```

Bundle contents are hash-verified; existing managed edits, extra files and symlinks
block replacement. Old framework/ and lock are retained under .framework-backups/.
The command does not auto-migrate app data. Hashes establish integrity, not publisher
identity. Full details of the current app attachment contract are in CONTRACTS.md.

## Moving an installation or migrating an old app

Relative paths in the app configuration make moving the app and nested checkout
together work without edits. If their relative layout changes, update studioRoot,
appRoot and content deliberately; the server checks the linked studio.

For an old v0.1 project/ installation, back it up first. Initialize a new external
content folder and migrate the approved DS files, previews and registry explicitly.
Existing legacy startup still works. Do not run initialization over an existing
design-system folder or point the Git updater at the app repository.
