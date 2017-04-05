  /**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/registers              ->  index
 * POST    /api/registers              ->  create
 * GET     /api/registers/:id          ->  show
 * PUT     /api/registers/:id          ->  upsert
 * PATCH   /api/registers/:id          ->  patch
 * DELETE  /api/registers/:id          ->  destroy
 */

'use strict';

import jsonpatch from 'fast-json-patch';
import Register from './register.model';
import Manifest from '../manifest/manifest.model';
import Itinerary from '../itinerary/itinerary.model';

import * as _ from 'lodash';

function respondWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function(entity) {
    if(entity) {
      return res.status(statusCode).json(entity);
    }
    return null;
  };
}

function patchUpdates(patches) {
  return function(entity) {
    try {
      jsonpatch.apply(entity, patches, /*validate*/ true);
    } catch(err) {
      return Promise.reject(err);
    }

    return entity.save();
  };
}

function removeEntity(res) {
  return function(entity) {
    if(entity) {
      return entity.remove()
        .then(() => {
          res.status(204).end();
        });
    }
  };
}

function handleEntityNotFound(res) {
  return function(entity) {
    if(!entity) {
      res.status(404).end();
      return null;
    }
    return entity;
  };
}

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function(err) {
    console.error(err);
    res.status(statusCode).send(err);
  };
}

// Gets a list of Registers
export function index(req, res) {
  return Register.find().exec()
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Gets a single Register from the DB
export function show(req, res) {
  return Register.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Creates a new Register in the DB
export function create(req, res) {
  
  let requiredParams = [
    'person',
    'seaport',
    'manifest',
    'state'
  ];
  
  requiredParams.forEach(function(p){
    if (!_.includes(requiredParams, p)) {
      return res.status(401).json({ messsage: `required parameter "${p}" is missing` });
    }
  });
  
  let baseQuery = {
    person: req.body.person,
    manifest: req.body.manifest
  };
  
  let registerData = {
    state: req.body.state,
    person: req.body.person,
    manifest: req.body.manifest
  };
  
  if (req.body.state === 'checkin') {
    baseQuery.seaportCheckin = req.body.seaport;
    registerData.seaportCheckin = req.body.seaport;
    registerData.checkinDate = req.body.date
  } else if (req.body.state === 'checkout') {
    baseQuery.seaportCheckout = req.body.seaport;
    registerData.seaportCheckout = req.body.seaport;
    registerData.checkoutDate = req.body.date
  } else {
    return res.status(401).json({ messsage: `invalid register state: ${req.body.state}` });
  }
  
  return Register.update(baseQuery, registerData, { upsert: true })
    .then(respondWithResult(res, 201))
    .catch(handleError(res));
}

// Upserts the given Register in the DB at the specified ID
export function upsert(req, res) {
  if(req.body._id) {
    delete req.body._id;
  }
  return Register.findOneAndUpdate({_id: req.params.id}, req.body, {upsert: true, setDefaultsOnInsert: true, runValidators: true}).exec()

    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Updates an existing Register in the DB
export function patch(req, res) {
  if(req.body._id) {
    delete req.body._id;
  }
  return Register.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(patchUpdates(req.body))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Deletes a Register from the DB
export function destroy(req, res) {
  return Register.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
}

// Return documentId + status for an specific port
export function status(req, res) {  
  return Itinerary.findOne({ refId: req.query.itinerary }).exec()
  .then(function(itinerary){
    console.log(`got itinerary = ${JSON.stringify(itinerary)} from refId = ${req.query.itinerary}`);
    
    if (!itinerary) {
      return res.json([]);
    }
    
    return Manifest.find().where('itinerary').equals(itinerary._id).exec();
  })
  .then(function(manifests){
    return Register.find()
      .populate('person')
      .where('manifest').in(manifests.map(m => m._id))
      .exec()
  })
  .then(function(registers){
    return registers.map(r => {
      return {
        documentId: r.person.documentId,
        state: r.state
      }
    })
  })
  .then(respondWithResult(res, 201))
  .catch(handleError(res));
}