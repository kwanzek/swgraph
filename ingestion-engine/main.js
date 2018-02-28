'use strict';

let server = require('./app/server.js');

server.listen(9871, () => {
  console.log('Starting ingestion-engine API server.');
});
