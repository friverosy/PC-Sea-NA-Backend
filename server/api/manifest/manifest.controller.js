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
import mongoose from 'mongoose';

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
    console.log("entity to be patched");
    console.log(entity);
    console.log("patches");
    console.log(patches);
    try {
      jsonpatch.apply(entity, patches, /*validate*/ true);
    } catch(err) {
      return Promise.reject(err);
    }
    console.log("entity after patch");
    console.log(entity);

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
  console.log("requesting manifests from refId=" + req.query.itinerary + ", since");
  console.log(moment(req.query.date));

  return baseQuery
    .lean()
    .exec()
    .filter(function(manifest) {
      if(req.query.itinerary) {
        //console.log(manifest.itinerary);
        if(manifest.itinerary != null) {
          //console.log(manifest.itinerary.refId);
          return manifest.itinerary.refId == req.query.itinerary;
        } else {
          console.log('corrupted manifest found, itinerary or refid is null:');
          console.log(manifest);
        }
      } else {
        return manifest.itinerary != null;
      }
    })
    .map(function(manifest) {
      //console.log(manifest);
      let baseQuery2;
      if(req.query.date) {
        //console.log("manifest.id= " + manifest._id.getTimestamp());
        var timestamp = new Date(req.query.date);
        //console.log("timestamp=" + timestamp);
        timestamp.setHours(timestamp.getHours() + 4); //convert CLT to UTC
        //console.log("timestamp in UTC=" + timestamp);
        var hexSeconds = Math.floor(timestamp/1000).toString(16);
        //console.log("hex=" + hexSeconds);
        var myobjId = mongoose.Types.ObjectId(hexSeconds + "0000000000000000");
        //console.log("hex=" + myobjId);
        
        baseQuery2 = Register.find()
          .where('isDenied')
          .equals(false)
          .populate('person')
          .where('manifest')
          .equals(manifest._id)
          .where('_id')
          .gte(myobjId);
          //.where('checkinDate')
          //.gte(moment(req.query.date).toISOString());
      } else {
        baseQuery2 = Register.find()
          .where('isDenied')
          .equals(false)
          .populate('person')
          .where('manifest')
          .equals(manifest._id);
      }

      return baseQuery2.exec()
        .map(function(register) {
          if(register.person) {
            return {
              personId: register.person._id,
              documentId: register.person.documentId,
              name: register.person.name,
              origin: manifest.origin,
              destination: manifest.destination,
              refId: manifest.itinerary.refId,
              manifestId: manifest._id,
              registerId: register._id,
              isOnboard: register.isOnboard,
              reservationStatus: manifest.reservationStatus,
              createdAt:  manifest.createdAt
            };
          } else {
            console.log('Error: Bad Register, it does not contain register.person._id, these are the faulty documents');
            console.log('Manifest');
            console.log(manifest);
            console.log('Register of manifest _id:', manifest._id);
            console.log(register);
            console.log('------');
            return {
              personId: 0,
              documentId: '',
              name: '',
              origin: manifest.origin,
              destination: manifest.destination,
              refId: manifest.itinerary.refId,
              manifestId: manifest._id,
              registerId: register._id
            };
          }
        });
    })
    .filter(m => m != null)
    .then(m => _.flatten(m))
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
  console.log("patching manifest, patch:");
  console.log(req.body);
  console.log("objectId to be patched:");
  console.log(req.params.id);

  if(req.body._id) {
    delete req.body._id;
  }
  return Manifest.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(patchUpdates([req.body]))
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
