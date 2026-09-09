# Design System Studio: ownership and agent entry point

This repository is shared, updatable software. Read README.md and
framework/CONTRACTS.md before making changes.

## If working on an app’s design system

Read the attached app’s studio.config.json and AGENTS.md, then
framework/AGENT-WORKFLOW.md in full, including its required component audit and interaction ownership rules.
Follow any component checklist linked by the attached content’s AGENTS.md or USAGE.md. The configuration locates appRoot and the
app-owned content folder. Use existing screens in place; no inbox is required.

If no attachment exists, initialize with:
`node studio.js init --app /path/to/existing-app`.
This creates only a new app-design-system/ folder by default, never replaces an
existing DS, and prints the configuration and agent entry-point paths.

Do not customize this repository to change one app’s design language. Tokens,
component implementations, registry entries, icons, patterns, specimens, decisions
and app-specific instructions belong in the separate content folder.

## If improving the studio itself

The sidebar, catalog presentation, inspector, anatomy, mock fixtures, initialization,
update tooling and shared workflows belong here. Preserve app catalog contract v1,
or explicitly version and document a migration. Never automatically migrate app data.

Run `node studio.js check` and `npm test`. For attachment changes, test external
content and arbitrary existing screen paths. Test updates against a disposable Git
remote, checking that app files and board data are byte-for-byte unchanged.

Update CHANGELOG.md and framework/version.json for a release. Regenerate the
framework lock only as a deliberate maintainer step after reviewing changes.

The bundled project/ is a legacy empty test fixture, not an app installation
destination. reference/ is historical evidence, not active agent policy.
Do not commit or push without the user’s authorization.
