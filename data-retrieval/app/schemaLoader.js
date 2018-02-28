'use strict';

let fs = require('fs');
let _ = require('lodash');

function loadSchemas(entityTypes) {
  let schemaLookup = {};
  _.each(entityTypes, entityType => {
    let content = JSON.parse(fs.readFileSync('schema/' + entityType + '.json'));
    schemaLookup[entityType] = content;
  });
  return schemaLookup;
}

module.exports = {
  load: loadSchemas
};
