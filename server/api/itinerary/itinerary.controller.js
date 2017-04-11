/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/itineraries              ->  index
 * POST    /api/itineraries              ->  create
 * GET     /api/itineraries/:id          ->  show
 * PUT     /api/itineraries/:id          ->  upsert
 * PATCH   /api/itineraries/:id          ->  patch
 * DELETE  /api/itineraries/:id          ->  destroy
 */

'use strict';

import jsonpatch from 'fast-json-patch';
import Itinerary from './itinerary.model';

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

// Gets a list of Itinerarys
export function index(req, res) {
  return Itinerary.find().exec()
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Gets a single Itinerary from the DB
export function show(req, res) {
  return Itinerary.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Creates a new Itinerary in the DB
export function create(req, res) {
  let requiredBodyArgs = ['refId'];

  requiredBodyArgs.forEach(arg => {
    if(!req.body[arg]) {
      return res.status(400).json({ messsage: `missing attribute: ${arg}`});
    }
  });

  return Itinerary.findOneAndUpdate({refId: req.body.refId}, req.body, { upsert: true, new: true })
    .then(respondWithResult(res, 201))
    .catch(handleError(res));
}

// Upserts the given Itinerary in the DB at the specified ID
export function upsert(req, res) {
  if(req.body._id) {
    delete req.body._id;
  }

  return Itinerary.findOneAndUpdate({_id: req.params.id}, req.body, {upsert: true, setDefaultsOnInsert: true, runValidators: true}).exec()
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Updates an existing Itinerary in the DB
export function patch(req, res) {
  if(req.body._id) {
    delete req.body._id;
  }
  return Itinerary.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(patchUpdates(req.body))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Deletes a Itinerary from the DB
export function destroy(req, res) {
  return Itinerary.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
}
