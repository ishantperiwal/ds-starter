'use strict';
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const within = (parent, target) => target === parent || target.startsWith(parent + path.sep);
function inside(root, relative) {
  const target = path.resolve(root, relative);
  if (!within(root, target)) throw Error('Path outside mount');
  return target;
}
// Resolve existing ancestors too: symlinked parents cannot conceal an overlapping tree.
function canonical(file) {
  file = path.resolve(file);
  if (fs.existsSync(file)) return fs.realpathSync(file);
  return path.join(canonical(path.dirname(file)), path.basename(file));
}
function assertSeparate(studio, content) {
  studio = canonical(studio); content = canonical(content);
  if (within(studio, content) || within(content, studio)) {
    throw Error('App content and studio checkout must be separate, non-overlapping folders.');
  }
}
function configuration(root = ROOT, configFile) {
  const file = path.resolve(configFile || path.join(root, 'studio.config.json'));
  const config = JSON.parse(fs.readFileSync(file, 'utf8'));
  const version = JSON.parse(fs.readFileSync(path.join(root, 'framework/version.json'), 'utf8'));
  if (config.contractVersion !== version.contractVersion) {
    throw Error('Content contract migration required. App files were not changed.');
  }
  if (config.configVersion !== undefined && config.configVersion !== 1) throw Error('Unsupported studio configuration format');
  return config;
}
function runtimePaths(root = ROOT, configFile) {
  root = canonical(root);
  const file = path.resolve(configFile || path.join(root, 'studio.config.json'));
  const config = configuration(root, file);
  const external = config.configVersion === 1;
  const base = path.dirname(file);
  let content, app, screens;
  if (external) {
    if (typeof config.appRoot !== 'string' || typeof config.content !== 'string') throw Error('Configuration needs appRoot and content paths');
    content = canonical(path.resolve(base, config.content));
    app = canonical(path.resolve(base, config.appRoot));
    assertSeparate(root, content);
    if (typeof config.studioRoot !== 'string' || canonical(path.resolve(base,config.studioRoot)) !== root) {
      throw Error('This app is linked to a different studio checkout. Review studioRoot in its configuration.');
    }
    if (within(content, app)) throw Error('Existing app screens must live outside the DS content folder');
    if (!fs.statSync(app).isDirectory()) throw Error('App root must be an existing directory');
    const registry = JSON.parse(fs.readFileSync(path.join(content,'registry.json'),'utf8'));
    if (registry.contractVersion !== config.contractVersion) throw Error('Registry contract migration required; app files were not changed.');
  } else {
    // v0.1 consumers continue working; this layout is not used by new initialization.
    const project = inside(root, config.project);
    content = path.join(project, 'design-system');
    screens = path.join(project, 'screens');
  }
  return {
    root, file, config, external, content, app, screens,
    examples: inside(root, config.examples || 'framework/examples'),
    board: external ? path.join(content, '.moodboard-data') : path.join(root, '.moodboard-data')
  };
}
module.exports = {ROOT, within, inside, canonical, assertSeparate, configuration, runtimePaths};
