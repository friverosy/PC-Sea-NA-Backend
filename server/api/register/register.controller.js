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

  requiredParams.forEach(function(p) {
    if(!_.includes(_.keys(req.body), p)) {
      res.status(401).json({ messsage: `required parameter "${p}" is missing` });
      return false;
    }
  });

  let baseQuery = {
    person: req.body.person,
    manifest: req.body.manifest
  };

  var stateId = {0: 'pending', 1: 'checkin', 2: 'checkout'};

  let registerData = {
    state: stateId[Number(req.body.state)],
    person: req.body.person,
    manifest: req.body.manifest
  };

  if(Number(req.body.state) === 1) {
    baseQuery.seaportCheckin = req.body.seaport;
    registerData.seaportCheckin = req.body.seaport;
    registerData.checkinDate = req.body.date;
  } else if(Number(req.body.state) === 2) {
    baseQuery.seaportCheckout = req.body.seaport;
    registerData.seaportCheckout = req.body.seaport;
    registerData.checkoutDate = req.body.date;
  } else {
    return res.status(401).json({ messsage: `invalid register state: ${req.body.state}` });
  }

  return Register.update(baseQuery, registerData, { upsert: true })
    .then(respondWithResult(res, 201))
    .catch(handleError(res));
}

// Upserts the given Register in the DB at the specified ID
export function upsert(req, res) {
  console.log(`upsert with body =  ${JSON.stringify(req.body)}`);
  //console.log(">>>>>>>>>>>>>>>> req.params.id");
  //console.log(req.params.id);
  //console.log(req.params);
  if(req.params['id'] == 'null')  {
    console.log("Ivalid passenger trying to checkin, logging the information ...");
    return res.json({error: 'please do not use this endpoint without sending the id'});
  } else {
    if(req.body._id) {
      delete req.body._id;
    }

    if(req.body.deniedReason) {
      req.body.isDenied = true;
    }

    if(req.body.state == 1) {
      //map checkinDate, seaportCheckin 
      req.body.checkinDate = req.body.date;
      req.body.seaportCheckin = req.body.seaport;
    } else if(req.body.state == 2) {
      //map checkoutDate, seaportCheckout 
      req.body.checkoutDate = req.body.date;
      req.body.seaportCheckout = req.body.seaport;
    }

    let states = { 0: 'pending', 1: 'checkin', 2: 'checkout' };
    req.body.state = states[req.body.state];

    console.log(req.params.id);
    console.log(req.body);

    return Register.findOneAndUpdate({_id: req.params.id}, req.body, {upsert: true, setDefaultsOnInsert: true, runValidators: true})
    .exec()
    .then(respondWithResult(res))
    .catch(handleError(res));
  }
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
  var stateId = [];
  stateId.pending = 0;
  stateId.checkin = 1;
  stateId.checkout = 2;

  return Itinerary.findOne({ refId: req.query.itinerary }).exec()
  .then(function(itinerary) {
    //console.log(`got itinerary = ${JSON.stringify(itinerary)} from refId = ${req.query.itinerary}`);

    if(!itinerary) {
      return res.json([]);
    }

    return Manifest.find()
      .where('itinerary')
      .equals(itinerary._id)
      .exec();
  })
  .then(function(manifests) {
    return Register.find()
      .where('isDenied')
      .equals(false)
      .populate('person')
      .populate('manifest')
      .where('manifest')
      .in(manifests.map(m => m._id))
      .exec();
  })
  .then(function(registers) {
    return registers.map(r => {
       
      if(r.person != null) {
        return {
          documentId: r.person.documentId,
          state: stateId[r.state],
          origin: r.manifest.origin
        };
      } else {
        console.log('------');
        console.log('Corrupt Register, Person is null!:');
        console.log(r);
        return;
      }
    });
  })
  .then(respondWithResult(res, 201))
  .catch(handleError(res));
}

export function createManualSell(req, res) {
  // validate required params
  // let requiredParams = [
  //   'itinerary',
  //   'origin',
  //   'destination',
  //   'ticketId',
  //   'name',
  //   'sex',
  //   'resident',
  //   'nationality',
  //   'documentId',
  //   'documentType'
  // ];

  return Register.manualSell(req.body)
  .then(respondWithResult(res, 201))
  .catch(handleError(res));
}

export function deniedRegister(req, res) {
  return Register.deniedRegister(req.body)
  .then(respondWithResult(res, 201))
  .catch(handleError(res));
}
