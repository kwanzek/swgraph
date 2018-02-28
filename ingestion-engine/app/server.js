'use strict';

let dataBootstrap = require('./data-bootstrap');
let _ = require('lodash');
let express = require('express');
let app = express();
let util = require('util');

//Sending over a lot of data in one request so we need to increase the default limit
app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({limit: '10mb', extended: true}));

app.get('/', function(req, res) {
  res.status(200).send('Welcome to the ingestion-engine endpoint!');
});

app.post('/bootstrap', function(req, res) {
  util.inspect(req.body);
  dataBootstrap.saveEntities(req.body.entityData, req.body.schemaData)
    .then(result => {
      res.status(200).send(result);
    })
    .catch(err => {
      res.status(400).send('Failed to load SW Entities: ' + err);
    });
});

module.exports = app;
