'use strict';
const path = require('node:path');
function main(args = process.argv.slice(2)) {
  try {
    const command = args[0] || 'help';
    const options = {};
    for (let i = 1; i < args.length; i++) {
      const key = args[i];
      if (key === '--check') {options.check = true; continue;}
      if (!['--app','--content','--name','--config','--port'].includes(key) || !args[i + 1] || args[i + 1].startsWith('--')) {
        throw Error('Unknown option or missing value: ' + key);
      }
      options[key.slice(2)] = args[++i];
    }
    if (command === 'init') {
      const result = require('./initialize').initialize(options);
      console.log(JSON.stringify(result, null, 2));
      console.log('Start: node studio.js start --config ' + JSON.stringify(result.configFile));
      console.log('Agent entry point: ' + path.join(result.content, require('node:fs').existsSync(path.join(result.content, 'run-ds.md')) ? 'run-ds.md' : 'AGENTS.md'));
    } else if (command === 'start') {
      require('./server').start({configFile: options.config, port: options.port});
    } else if (command === 'check') {
      const result = require('./validate').validate(undefined, options.config);
      console.log(JSON.stringify(result, null, 2));
      if (result.errors.length) process.exitCode = 1;
    } else if (command === 'update') {
      console.log(JSON.stringify(require('./git-update').update({configFile: options.config, checkOnly: options.check}), null, 2));
    } else if (command === 'help' || command === '--help') {
      console.log([
        'node studio.js init --app <existing-folder> [--content <new-folder>] [--name <name>]',
        'node studio.js start --config <app-ds/studio.config.json> [--port 8020]',
        'node studio.js check --config <app-ds/studio.config.json>',
        'node studio.js update --config <app-ds/studio.config.json> [--check]',
        'No config: open the isolated tool-development sandbox.'
      ].join('\n'));
    } else throw Error('Unknown command: ' + command);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = {main};
