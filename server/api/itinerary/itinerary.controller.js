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
import Manifest from '../manifest/manifest.model';
import Register from '../register/register.model';
import moment from 'moment';

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

// Gets a list of Itinerarys
export function index(req, res) {
  let baseQuery;
  if(req.query.date) {
    let dateStart = moment(req.query.date).startOf('Day')
                    .toISOString();
    let dateEnd = moment(dateStart).add(1, 'd')
                    .toISOString();
    baseQuery = Itinerary.find()
      .where('depart')
      .gte(dateStart)
      .where('depart')
      .lt(dateEnd);
  } else {
    baseQuery = Itinerary.find();
  }

  if(req.query.active) {
    baseQuery.where('active').equals(req.query.active);
  }

  if(req.query.refId) {
    baseQuery.where('refId').equals(req.query.refId);
  }

  return baseQuery.exec()
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

export function getSeaports(req, res) {
  return Manifest.find()
    .populate('origin destination')
    .where('itinerary')
    .equals(req.params.id)
    .exec()
    .map(function(manifest) {
      //console.log("---------");
      //console.log("manifest");
      //console.log(manifest);
      return [
        manifest.origin,
        manifest.destination
      ];
    })
    .then(function(seaports) {
      return _.filter(_.uniqBy(_.flatten(seaports), function(s) {
        if(s)  {
          return s._id.toString();
        } else {
          console.log("Error: manifest has seaport that does not exist");
          console.log("----tshen2-------");
          console.log(s);
        }
      }), s => s != null);
    })
    .then(respondWithResult(res, 201))
    .catch(handleError(res));
}

// Gets active itineraries
export function getActives(req, res) {
  let baseQuery;
  baseQuery = Itinerary.find();

  return baseQuery.exec()
    .then(respondWithResult(res))
    .catch(handleError(res));
}

export function getRegisters(req, res) {
  return Manifest.find()
    .where('itinerary')
    .equals(req.params.id)
    .where('reservationStatus')
    .equals(1)
    .exec()
    .then(function(manifests) {
      let manifestsIds = manifests.map(m => m._id);
      
      let registersBaseQuery = Register.find()
        .populate('person seaportCheckin seaportCheckout')
        .deepPopulate('manifest.origin manifest.destination')
        .where('manifest')
        .in(manifestsIds);
      
      if (req.query.denied == 'true' || req.query.denied == 'false') {
        return registersBaseQuery.where('isDenied').equals(JSON.parse(req.query.denied)).exec()
      } else {
        return registersBaseQuery.exec()
      }
    })
    .then(respondWithResult(res, 200))
    .catch(handleError(res));
}

// export person list as a excel file
export function exportRegistersExcel(req, res) {
  let itineraryId = req.params.id;

  return Itinerary.exportRegistersExcel(itineraryId, true)
    .then(excel => {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=registers-export.xlsx');
    
      return res.end(excel);
    })
    .catch(handleError(res));
}