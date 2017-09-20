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
import mongoose from 'mongoose';
import Itinerary from './itinerary.model';
import Manifest from '../manifest/manifest.model';
import Register from '../register/register.model';
import Seaport from '../seaport/seaport.model';
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
      .where('active')
      .ne('false')
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
  // return Manifest.find()
  //   .populate('origin destination')
  //   .where('itinerary')
  //   .equals(req.params.id)
  //   .exec()
  //   .map(function(manifest) {
  //     //console.log("---------");
  //     //console.log("manifest");
  //     //console.log(manifest);
  //     return [
  //       manifest.origin,
  //       manifest.destination
  //     ];
  //   })
  //   .then(function(seaports) {
  //     return _.filter(_.uniqBy(_.flatten(seaports), function(s) {
  //       if(s)  {
  //         return s._id.toString();
  //       } else {
  //         console.log("Error: manifest has seaport that does not exist");
  //         console.log("----tshen2-------");
  //         console.log(s);
  //       }
  //     }), s => s != null);
  //   })
  //   .then(respondWithResult(res, 201))
  //   .catch(handleError(res));

  return Itinerary.findById(req.params.id)
    .deepPopulate('seaports')
    .select('seaports -_id')
    .exec()
    .then(function(s) {
      return s.seaports;
    })
    .then(respondWithResult(res))
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
  let summary = req.query.summary;

  return Itinerary.exportRegistersExcel(itineraryId, summary, true)
    .then(excel => {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=registers-export.xlsx');
    
      return res.end(excel);
    })
    .catch(handleError(res));
}
export function updateSeaports_old(req, res) {
  let itineraryId = req.params.id;
  let found = false;

  console.log("body:");
  console.log(req.body.puertos);
  console.log(req.body.puertos[0]);

  req.body.puertos.forEach(seaport_json => {
    found = false;
    console.log("processing seaport_json:");
    console.log(seaport_json.nombre_ubicacion);
    return Itinerary.findOne({_id: itineraryId}).exec()
      .then(function(itinerary) { 
        if(itinerary == null) {
          console.log("Error: Couldn't find itinerary  with id " + itineraryId);
          return  res.status(500).send(err);
        }

        //check that the seaport in bsale is already part of part of the itieneary at mongodb.
        console.log("trying to match seaport: " + seaport_json.nombre_ubicacion + " in the itinerary:");
        itinerary.seaports.forEach(function(s) { 
          console.log("seaport objectId:");
          console.log(s);
          return Seaport.findOne({_id: s}).exec()
            .then(function(_seaport) { 
              if(_seaport == null) {
                console.log("Iconsistency in the itinerary, seaport id=" + s + " doesn't exist in the collection");
                return res.status(500).send(err);
              }  
              //check the name of the seaport 
              if(_seaport.locationName == seaport_json.nombre_ubicacion) {
                console.log("bingo, seaport:'" + seaport_json.nombre_ubicacion + "' is already part of the itinerary, nothing more to do.");
                found = true;
              } else {
                console.log("this is not the objectId of " + seaport_json.nombre_ubicacion);
              }
            });
        });
      });
      
    //new seaport, add it to the itinerary in the mongodb 
    if(found == false) {
      //we shoud add this new seaport and associate it to the itinerary 
      var seaportSave = new Seaport();
      seaportSave.locationId = seaport_json.id_ubicacion;
      seaportSave.locationName = seaport_json.nombre_ubicacion;
      seaportSave.save().then(function(s) {
        console.log("adding new seaport:" + seaport_json.nombre_ubicacion);
        console.log("assoicate the new seaport objectId (" + s + " to the itinerary");
        Itinerary.update({_id: req.params.id},{$push: {seaports:s}},{upsert:true}).exec();
      })
    }
  });

  let baseQuery;
  baseQuery = Itinerary.findById(req.params.id);

  return baseQuery.exec()
    .then(respondWithResult(res))
    .catch(handleError(res));
}

export function updateSeaports(req, res) {
  let itineraryId = req.params.id;

  console.log("req.body.puertos:");
  console.log(req.body.puertos);

  req.body.puertos.forEach(seaport_json => {
    let found = false;
    let queries = [];
    console.log("processing seaport:");
    console.log(seaport_json.nombre_ubicacion);
    Itinerary.findOne({_id: itineraryId})
      .then(function(itinerary) { 
        if(itinerary == null) {
          console.log("Error: Couldn't find itinerary  with id " + itineraryId);
          return  res.status(500).send(err);
        }

        //check that the seaport in bsale is already part of part of the itieneary at mongodb.
        console.log("trying to match seaport: " + seaport_json.nombre_ubicacion + " in the itinerary, length:" + itinerary.seaports.length);
        itinerary.seaports.forEach(function(s) { 
          //console.log("seaport objectId:" + s);
          var p = new Promise(function(resolve, reject) {
            Seaport.findOne({_id: s}).exec()
            .then(function(_seaport) { 
              if(_seaport == null) {
                console.log("Iconsistency in the itinerary, seaport id=" + s + " doesn't exist in the collection");
                reject();
              }  
              //check the name of the seaport 
              if(_seaport.locationName == seaport_json.nombre_ubicacion) {
                console.log("bingo, seaport:'" + seaport_json.nombre_ubicacion + "' is already part of the itinerary.");
                found = true;
                resolve(true);
              } else {
                //console.log("this is not the objectId of " + seaport_json.nombre_ubicacion);
                resolve(false);
              }
            });
          });
          queries.push(p);
        });
        //console.log("==============> queries.length: " + queries.length);
        //for( var i=0; i < queries.length;  i++) {
        //  console.log(queries[i]);
        //}
        return Promise.all(queries).then(values => { 
          console.log("============> promises are resolved for seaport:" + seaport_json.nombre_ubicacion);
          //console.log(values)

          if(values.indexOf(true) >= 0) {
            console.log("conclusion, seaport:'" + seaport_json.nombre_ubicacion + "' is already part of the itinerary " + req.params.id + ", do not need to add it.");
          } else {
            //we shoud add this new seaport and associate it to the itinerary 
            var seaportSave = new Seaport();
            seaportSave.locationId = seaport_json.id_ubicacion;
            seaportSave.locationName = seaport_json.nombre_ubicacion;
            seaportSave.save().then(function(s) {
              console.log("conclusion: adding new seaport:" + seaport_json.nombre_ubicacion + " and associate it to itinerary " + req.params.id);
              Itinerary.update({_id: req.params.id},{$push: {seaports:s}},{upsert:true}).exec();
            });
          }
        });
      }).catch(function(error) {
        console.log("==============>Error found:");
        console.log(error);
      });
  });

  let baseQuery;
  baseQuery = Itinerary.findById(req.params.id);

  return baseQuery.exec()
    .then(respondWithResult(res))
    .catch(handleError(res));
}
