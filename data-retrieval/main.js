'use strict';

let dataRetrieval = require('./app/dataRetrieval');
let schemaLoader = require('./app/schemaLoader');
let denormalizer = require('./app/denormalize.js');
let _ = require('lodash');
let args = require('args');
let request = require('request-promise');

args
  .option('ingestionIp', 'IP and port of the ingestion service', 'ingestion-engine:9871');

const flags = args.parse(process.argv);
console.log(flags.ingestionIp);

const ingestionIp = 'http://' + flags.ingestionIp + '/bootstrap';

const entityTypes = ['Person', 'Starship', 'Species', 'Planet', 'Vehicle', 'Film'];
const schemas = schemaLoader.load(entityTypes);

let promises = [];

_.each(entityTypes, entityType => {
  promises.push(dataRetrieval.getDataForEntity(schemas[entityType]));
});

Promise.all(promises)
  .then(entityPromises => {

    //The promises return a data structure that looks like:
    //[{ People: [ {data...}, {data...} ]}, {Starships: ....}]

    //What we want is to combine these array values into one object using _.merge
    //And then key the data values by their ID so the resulting structure looks like:
    //{ People: {1: {data...}, 2: {data...}}, Starships: {1: {data...}} }
    let entitiesByEntityType = {};
    _.each(entityPromises, entityObject => {
      entitiesByEntityType = _.merge(entitiesByEntityType, entityObject);
    }, {});
    _.each(entityTypes, type => {
      entitiesByEntityType[type] = _.keyBy(entitiesByEntityType[type], 'id');
    });

    denormalizer.denormalizeAllEntities(entitiesByEntityType, schemas);

    let options = {
      uri: ingestionIp,
      json: true,
      body: {
        schemaData: schemas,
        entityData: entitiesByEntityType
      },
      method: 'POST'
    };

    console.log('Saving entities to ' + options.uri);

    return request(options)
      .then(function(results) {
        console.log('GOT RESULTS : ' + results);
      })
      .catch(err => {
        console.trace('ERRRRRRR: ' + err);
      });
  })
  .catch(error => {
    console.trace('Failed to gather all API data - Error: ' + error.stack);
  });
