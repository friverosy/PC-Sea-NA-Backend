/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/manifests              ->  index
 * POST    /api/manifests              ->  create
 * GET     /api/manifests/:id          ->  show
 * PUT     /api/manifests/:id          ->  upsert
 * PATCH   /api/manifests/:id          ->  patch
 * DELETE  /api/manifests/:id          ->  destroy
 */

'use strict';

import jsonpatch from 'fast-json-patch';
import moment from 'moment';
import Manifest from './manifest.model';
import Register from '../register/register.model';

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

// Gets a list of Manifests
export function index(req, res) {
  let baseQuery = Manifest.find().populate('itinerary');
  console.log(moment(req.query.date));

  return baseQuery
    .lean()
    .exec()
    .filter(function(manifest) {
      if(req.query.itinerary) {
        return manifest.itinerary.refId == req.query.itinerary;
      } else {
        return manifest.itinerary != null; 
      }
    })
    .map(function(manifest) {
      if(req.query.date){
        return Register.findOne()
          .populate('person')
          .where('manifest')
          .equals(manifest._id)
          .where('checkinDate')
          .gte(moment(req.query.date))
          .exec()
          .then(function(register) {
            return {
              personId: register.person._id,
              documentId: register.person.documentId,
              name: register.person.name,
              origin: manifest.origin,
              destination: manifest.destination,
              refId: manifest.itinerary.refId
            }
          });
      }
      else{
        return Register.findOne().populate('person')
          .where('manifest')
          .equals(manifest._id)
          .exec()
          .then(function(register){
            return {
              personId: register.person._id,
              documentId: register.person.documentId,
              name: register.person.name,
              origin: manifest.origin,
              destination: manifest.destination,
              refId: manifest.itinerary.refId
            }
          });
      }
    })
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Gets a single Manifest from the DB
export function show(req, res) {
  return Manifest.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Creates a new Manifest in the DB
export function create(req, res) {   
  return Manifest.createManifest(req.body)
    .then(respondWithResult(res, 201))
    .catch(handleError(res));
}

// Upserts the given Manifest in the DB at the specified ID
export function upsert(req, res) {
  if(req.body._id) {
    delete req.body._id;
  }
  return Manifest.findOneAndUpdate({_id: req.params.id}, req.body, {upsert: true, setDefaultsOnInsert: true, runValidators: true}).exec()
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Updates an existing Manifest in the DB
export function patch(req, res) {
  if(req.body._id) {
    delete req.body._id;
  }
  return Manifest.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(patchUpdates(req.body))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Deletes a Manifest from the DB
export function destroy(req, res) {
  return Manifest.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
}
