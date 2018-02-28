'use strict';

let _ = require('lodash');

//For each entity we want to look for its child entities
//And take the {id: 1} and add the actual denormalized data in
//This will put things like:
//{Films: {id: 4, name: A New Hope}}
//Into an entity rather than just the id/url
function denormalizeAllEntities(allEntities, allSchemas) {
  _.each(_.keys(allEntities), entityType => {
    let entities = allEntities[entityType];
    let schema = allSchemas[entityType];
    _.each(entities, entity => {
      denormalizeEntity(entity, schema, allEntities);
    });
  });
}

function denormalizeEntity(entity, entitySchema, allEntities) {
  let schemaProperties = entitySchema.properties;
  let schemaKeys = _.keys(schemaProperties);
  _.each(schemaKeys, propertyKey => {

    let property = schemaProperties[propertyKey];
    let propertyType = property.type;

    if (propertyType === 'array') {
      let otherEntityHash = allEntities[property.entity_name];
      if (entity[propertyKey]) {
        entity[propertyKey] = denormalizeOtherArrayEntity(
          _.map(entity[propertyKey], obj => {
            return obj['id'];
          }),
          property,
          otherEntityHash
        );
      }
    } else if (propertyType === 'object') {
      if (entity[propertyKey]) {
        let otherEntityId = entity[propertyKey]['id'];
        entity[propertyKey] = denormalizeSingleOtherEntity(
          property,
          allEntities[property.entity_name][otherEntityId]
        );
      }
    }
  });
}

function denormalizeOtherArrayEntity(otherEntityIds, property, otherEntityHash) {
  let denormalizedValues = [];
  _.each(otherEntityIds, entityId => {
    denormalizedValues.push(denormalizeSingleOtherEntity(property, otherEntityHash[entityId]));
  });
  return denormalizedValues;
}

function denormalizeSingleOtherEntity(property, otherEntity) {
  let newData = {};
  let denormalizeFields = property['fields'];
  _.each(denormalizeFields, field => {
    newData[field] = otherEntity[field];
  });
  return newData;
}

module.exports = {
  denormalizeAllEntities: denormalizeAllEntities
};
