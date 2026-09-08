# One framework, many project design systems

Use a dedicated upstream repo for this starter. Each consumer keeps a pinned copy
of `framework/` and `framework.lock.json`, plus its independently owned `project/`.
Do not merge the entire upstream starter over a customized project.

## Maintainer workflow

1. Improve framework tools and framework/examples/; reproduce issues in the sandbox.
2. Update framework/version.json and CHANGELOG.md. Keep contractVersion for compatible
   changes; bump it when consumer metadata/integration requires migration.
3. Run validation and tests, then the browser checklist in VERIFICATION.md.
4. Record the reviewed release contents:

```sh
node framework/release.js --write-lock
node framework/release.js --check
node framework/release.js --output /path/to/new/studio-release-0.1.1
```

5. Commit, tag and publish through your normal Git/release workflow. The output
   contains only framework/ and manifest.json, not project files or reference data.
   A zip/tar of that directory can be a release asset. No hosting is required by the tools.

## Consumer workflow

Download/unpack a release from your trusted upstream, or build one from a reviewed
tag checkout. Then, from the consumer repo:

```sh
node framework/update.js --from /path/to/studio-release-0.1.1
```

This is a dry run. It verifies every file hash and reports changed files. It refuses
local managed-file edits, additional managed files, symlinks, malformed release
metadata and incompatible contract versions. Hashes detect corruption; they do not
establish who published a release. Use a trusted upstream/tag.

Once reviewed, stop the local studio server and apply:

```sh
node framework/update.js --from /path/to/studio-release-0.1.1 --apply
node framework/validate.js
node --test framework/tests/starter.test.js
```

Restart the server, reload the browser, and check your project previews. Commit the
framework/ and lock diff in the consumer repo. Updates deliberately do not auto-pull
or silently apply commits while you are working.

## What stays yours

The updater never replaces project/, studio.config.json, root instructions,
reference/, or .moodboard-data/. Examples live inside framework/ and are updated as
tool fixtures. Fork any example you want to customize into project/ first.

If you improve framework files in a consumer, upstream the patch or preserve it on a
branch before updating. Do not run --write-lock merely to bypass the dirty-file check.

## Recovery

Each applied replacement retains the previous framework folder and lock under a
uniquely named `.framework-backups/release-*` directory. The updater prints its path.
No old files are deleted automatically. Failed installation attempts restore the
old framework and lock. A release with a different contractVersion is a manual
migration; no project data migration is attempted.

For a deliberate rollback, stop the server, preserve the current framework/ and
lock, then restore framework/ and framework.lock.json together from the reported
backup. Alternatively revert the consumer's committed upgrade with Git.

The release mechanism is local and usable now. Creating a remote repository,
automated publishing, signed releases or a release-discovery UI is a separate step.
