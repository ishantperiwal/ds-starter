'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {ROOT, canonical, assertSeparate, within, runtimePaths} = require('./configuration');

function initialize({app, content, name, root = ROOT}) {
  if (!app) throw Error('Specify --app <existing-app-folder>');
  root = canonical(root);
  app = canonical(app);
  if (!fs.statSync(app).isDirectory()) throw Error('App folder must already exist');
  content = canonical(content || path.join(app, 'app-design-system'));
  assertSeparate(root, content);
  if (within(root, app) || within(content, app)) throw Error('App screens must be outside the studio and the new content folder');
  const configFile = path.join(content, 'studio.config.json');
  if (fs.existsSync(content)) {
    if (fs.existsSync(configFile)) {
      const existing = runtimePaths(root, configFile);
      if (existing.external && existing.content === content && existing.app === app) {
        return {created: false, configFile, content, app};
      }
    }
    throw Error('Destination already exists. Nothing was overwritten; choose a new --content folder.');
  }
  const relative = target => path.relative(content, target).split(path.sep).join('/') || '.';
  const config = {
    configVersion: 1, contractVersion: 1,
    name: name || path.basename(app), appRoot: relative(app),
    content: '.', studioRoot: relative(root),
    defaultProfile: 'project', port: 8020
  };
  const registry = {
    contractVersion: 1, name: config.name + ' design system', version: '0.1.0',
    description: 'App-owned design language, extracted from existing screens in place.',
    components: [], compositions: [], patterns: [], visualizations: [], themes: [],
    screens: [], icons: [], tokenFiles: ['tokens/primitives.css', 'tokens/semantics.css'],
    knownGaps: [], decisions: []
  };
  const instructions = [
    '# App-owned design system', '',
    'Read studio.config.json in this directory. Resolve studioRoot relative to that file.',
    'Before each DS task, read <studioRoot>/framework/AGENT-WORKFLOW.md and',
    '<studioRoot>/framework/CONTRACTS.md in full, then this folder’s BRIEF.md, registry.json',
    'and decisions/. The shared workflow is loaded from the installed studio, not copied.',
    '',
    'Use the existing screens identified by the user in place. No inbox or relocation.',
    'Keep this app’s tokens, components, registry, specimens and decisions in this folder.',
    'App-specific instructions here and existing app instructions remain app-owned.',
    'Do not edit studio code to customize this app. Never overwrite unrelated files.', ''
  ].join('\n');
  const templates = {
    'studio.config.json': JSON.stringify(config, null, 2) + '\n',
    'registry.json': JSON.stringify(registry, null, 2) + '\n',
    'AGENTS.md': instructions,
    'CLAUDE.md': '# App design system\n\nRead AGENTS.md here and follow its shared-workflow reference.\n',
    'BRIEF.md': '# App design brief\n\nExisting screen paths (no copying required):\nTarget viewports:\nApproved visual direction:\nRequired interactions:\nApp-specific constraints:\n',
    'README.md': '# App-owned DS content\n\nThis folder belongs to the app, not the studio checkout. Commit it in the app repo.\nExisting screens stay in place. Read AGENTS.md to begin extracting or expanding the DS.\nStudio updates never synchronize over this folder. Local board data is gitignored.\n',
    '.gitignore': '.moodboard-data/\n.DS_Store\n',
    'tokens.css': '@import "./tokens/primitives.css";\n@import "./tokens/semantics.css";\n',
    'components.css': '/* Import app-owned shared component implementations here. */\n',
    'tokens/primitives.css': '/* Extract scales from this app’s screens; no sandbox defaults. */\n',
    'tokens/semantics.css': '/* App-owned semantic and component controls. */\n',
    'decisions/README.md': '# Decisions\n\nRecord evidence, scope, approved exceptions and verification here.\n'
  };
  fs.mkdirSync(path.dirname(content), {recursive: true});
  const staging = fs.mkdtempSync(path.join(path.dirname(content), '.ds-init-'));
  try {
    for (const dir of ['components', 'icons', 'patterns', 'specimens', 'themes']) {
      templates[dir + '/.gitkeep'] = '';
    }
    for (const [file, text] of Object.entries(templates)) {
      const target = path.join(staging, file);
      fs.mkdirSync(path.dirname(target), {recursive: true});
      fs.writeFileSync(target, text, {flag: 'wx'});
    }
    if (fs.existsSync(content)) throw Error('Destination appeared during initialization; refusing to overwrite it');
    fs.renameSync(staging, content);
  } finally {
    // Only this operation's generated staging directory; never the app/content destination.
    if (fs.existsSync(staging)) fs.rmSync(staging, {recursive: true});
  }
  return {created: true, configFile, content, app};
}
module.exports = {initialize};
