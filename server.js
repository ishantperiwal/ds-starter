// Stable consumer entry point. Implementation belongs to the upstream framework.
require('./framework/server.js').start({port: process.argv[2]});
