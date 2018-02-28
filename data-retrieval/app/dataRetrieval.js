'use strict';

let request = require('request-promise');
let _ = require('lodash');

const baseUrl = 'https://swapi.co/api/';

function getDataForEntity(schema) {
  let entityUrl = baseUrl + schema['api_entity_name'] + '/';
  return getDataHelper(entityUrl, schema, []);
}

function getDataHelper(url, schema, curEntities) {
  let options = {
    uri: url,
    json: true
  };

  console.log('Getting entities from ' + url);

  return request(options)
    .then(function(results) {

      let entities = results.results;
      _.each(entities, entity => {
        curEntities.push(cleanEntity(entity, schema));
      });

      if (results.next) {
        return getDataHelper(results.next, schema, curEntities);
      } else {
        let entityName = schema['entity_name'];
        return {[entityName]: curEntities};
      }
    })
    .catch(function(error) {
      console.trace('Failed to download resource ' + url + ' - Error: '  + error);
      return [];
    });

}

function cleanEntity(entity, schema) {
  let cleanedEntity = {};
  let entityUrl = entity.url;

  let entityId = extractId(entityUrl);
  cleanedEntity.id = entityId;

  let schemaProperties = schema.properties;
  let schemaKeys = _.keys(schemaProperties);
  _.each(schemaKeys, propertyKey => {
    if (propertyKey === 'id') {
      return;
    }

    let property = schemaProperties[propertyKey];
    let propertyType = property.type;
    let propertyGraphName = property['graph_property_name'];

    if (propertyType === 'object') {
      let childUrl = entity[propertyKey];
      if (childUrl) {
        let childId = extractId(childUrl);
        cleanedEntity[propertyKey] = {
          id: childId
        };
      }
    } else if (propertyType === 'array') {
      let children = entity[propertyKey];
      let cleanedObjects = [];
      if (children) {
        _.each(children, childUrl => {
          cleanedObjects.push({
            id: extractId(childUrl)
          });
        });
        cleanedEntity[propertyKey] = cleanedObjects;
      }
    } else {
      let graphName = propertyGraphName;
      cleanedEntity[graphName] = entity[propertyKey];
    }
  });
  return cleanedEntity;
}

function extractId(url) {
  let regex = /https:\/\/swapi\.co\/api\/\w+\/(\d+)/;
  let regexMatch = url.match(regex);
  return regexMatch[1];
}

module.exports = {
  getDataForEntity: getDataForEntity
};
