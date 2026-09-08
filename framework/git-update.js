'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {ROOT, canonical, runtimePaths} = require('./configuration');

function update({root = ROOT, configFile, checkOnly = false} = {}) {
  root = canonical(root);
  const git = args => execFileSync('git', args, {cwd: root, encoding:'utf8', stdio:['ignore','pipe','pipe']}).trim();
  if (canonical(git(['rev-parse','--show-toplevel'])) !== root) throw Error('Studio must be its own Git checkout');
  const paths = runtimePaths(root, configFile);
  if (!paths.external && configFile) throw Error('Use an external app configuration for the plug-in update workflow');
  if (git(['status','--porcelain'])) throw Error('Local studio edits/untracked files exist. Commit or preserve them before updating.');
  const branch = git(['symbolic-ref','--quiet','--short','HEAD']);
  const remote = git(['config','--get','branch.' + branch + '.remote']);
  const merge = git(['config','--get','branch.' + branch + '.merge']);
  if (!remote || remote.startsWith('-') || remote === '.' || !merge.startsWith('refs/heads/')) {
    throw Error('Current branch needs a trusted upstream remote branch');
  }
  // Fetch is the only change in --check mode: the installed files and app remain untouched.
  git(['fetch',remote,merge]);
  const target = git(['rev-parse','FETCH_HEAD']);
  const previous = git(['rev-parse','HEAD']);
  const version = JSON.parse(git(['show',target + ':framework/version.json']));
  const installed = JSON.parse(fs.readFileSync(path.join(root,'framework/version.json'),'utf8'));
  if (version.contractVersion !== paths.config.contractVersion ||
      version.contractVersion !== installed.contractVersion) {
    throw Error('Content contract migration required. Update stopped before checkout; app files unchanged.');
  }
  if (!/^\d+\.\d+\.\d+$/.test(version.version)) throw Error('Invalid upstream version metadata');
  const lock = JSON.parse(git(['show',target + ':framework.lock.json']));
  if (lock.version !== version.version || lock.contractVersion !== version.contractVersion) {
    throw Error('Upstream version/lock metadata mismatch');
  }
  try {git(['merge-base','--is-ancestor',previous,target]);}
  catch {throw Error('Upstream is not a fast-forward. No merge or reset was performed.');}
  const changed = git(['diff','--name-only',previous,target]).split('\n').filter(Boolean);
  if (!checkOnly && previous !== target) git(['merge','--ff-only',target]);
  return {
    previous, target, version:version.version, changed,
    applied:!checkOnly && previous !== target,
    content:paths.content, app:'untouched',
    next: checkOnly ? 'Run without --check after reviewing; stop the studio first.' : 'Restart studio, validate the app catalog and review previews.'
  };
}
module.exports = {update};
