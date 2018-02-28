'use strict';

let _ = require('lodash');
let neo4j = require('neo4j-driver').v1;

function saveEntities(entityData, schemaData) {
  //TODO: Pass in url and username/password for authentication
  let driver = neo4j.driver('bolt://neo4j', neo4j.auth.basic('neo4j', 'neo4j'));
  let session = driver.session();

  let promises = [];
  _.each(_.values(schemaData), schema => {
    let entityType = schema['entity_name'];
    let nodes = getNodesForEntityType(entityData[entityType], schema);
    let cypher = getCypherCreateForNodes(entityType);

    promises.push(
      session
        .run(cypher, {nodes: nodes})
        .then(() => {
          console.log('Completed entity type : ' + entityType);
        })
        .catch(err => {
          console.error(err);
        })
    );
  });

  return Promise.all(promises)
    .then(() => {
      session.close();
      driver.close();
      return 'Successfully loaded all entities!';
    })
    .catch(err => {
      session.close();
      driver.close();
      throw new Error(err);
    });
}

function getCypherCreateForNodes(entityType) {
  return 'UNWIND {nodes} as nodeData ' +
    `CREATE (entity:${entityType}) ` +
    'SET entity=nodeData ';
}

function getNodesForEntityType(entityDataForType, schemaDataForType) {
  let schemaProperties = schemaDataForType['properties'];

  //In this case "node" means nodes in Neo as opposed to edges, not Node.js
  let nodeProperties = _.filter(_.values(schemaProperties), property => {
    return property['type'] !== 'array' && property['type'] !== 'object';
  });

  nodeProperties = _.map(nodeProperties, property => {
    return property['graph_property_name'];
  });

  //Entity data is an object keyed by ID but we just want the actual values
  //We want the non-object properties to put in the node
  //so pick out the nodeProperties for each value in entityDataForType
  let nodes = _.map(_.values(entityDataForType), entityData => {
    return _.pick(entityData, nodeProperties);
  });

  return nodes;
}

module.exports = {
  saveEntities: saveEntities
};
