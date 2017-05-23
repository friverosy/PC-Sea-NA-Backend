'use strict';

import Promise from 'bluebird';
import mongoose from 'mongoose';
import moment from 'moment';
mongoose.Promise = require('bluebird');

import Seaport from '../seaport/seaport.model';
import Register from '../register/register.model';
import Person from '../person/person.model';
import Itinerary from '../itinerary/itinerary.model';

var deepPopulate = require('mongoose-deep-populate')(mongoose);

var ManifestSchema = new mongoose.Schema({
  reservationId: Number,
  ticketId: String,
  reservationStatus: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },

  origin: { type: mongoose.Schema.Types.ObjectId, ref: 'Seaport' },
  destination: { type: mongoose.Schema.Types.ObjectId, ref: 'Seaport' },
  itinerary: { type: mongoose.Schema.Types.ObjectId, ref: 'Itinerary'},
  register: { type: mongoose.Schema.Types.ObjectId, ref: 'Register' }
});

ManifestSchema.index({ itinerary: 1 }, { unique: true });
ManifestSchema.index({ register: 1 }, { unique: true });


ManifestSchema.statics = {
  createManifest: function(data) {
    let Manifest = this;
    let now = new Date();

    if(!data.itinerary) {
      console.log("can not create a Manifest without a itinerary");
      console.log(data); 
      throw new Error(`no itinerary was passed in the req.body`);
    }

    return Itinerary.findById(data.itinerary).exec()
      .then(function(itinerary){
        //console.log(itinerary);
        if(itinerary.active == true){
          return Promise.all([
            Seaport.find().where('locationName')
              .equals(new RegExp(`^${data.originName}`, 'i'))
              .exec(),
            Seaport.find().where('locationName')
              .equals(new RegExp(`^${data.destinationName}`, 'i'))
              .exec()
          ])
          .spread(function(candidateOrigins, candidateDestinations) {
            // TODO: ATM getting the first one given the regexp (maybe use JaroWinkler for string distance?)

            data.origin = candidateOrigins[0] ? candidateOrigins[0]._id : null;
            data.destination = candidateDestinations[0] ? candidateDestinations[0]._id : null;

            if(!data.origin || !data.destination) {
              console.log(`no seaports with name = ${data.originName}. Manifest and related data will not be created`);
              console.log(`requesting data.originName = ${data.originName}. Got the following = ${JSON.stringify(candidateOrigins)}`);
              console.log(`requesting data.destinationName = ${data.destinationName}. Got the following = ${JSON.stringify(candidateDestinations)}`);
              throw new Error(`no seaports with locationName = ${data.originName} found`);
            }

            return Manifest.create(data)
              .then(function(newManifest) {
                return Person.create({
                  name: data.name,
                  sex: data.sex,
                  resident: data.resident,
                  nationality: data.nationality,
                  documentId: data.documentId,
                  documentType: data.documentType
                })
                .then(function(newPerson) {
                  if(data.isOnboard) {
                    return Register.create({
                      person: newPerson._id,
                      manifest: newManifest._id,
                      seaportCheckin: data.origin,
                      checkinDate: moment(now),
                      isOnboard: true
                    });
                  } else {
                    return Register.create({
                      person: newPerson._id,
                      manifest: newManifest._id,
                      seaportCheckin: data.origin
                    });
                  }
                })
                .then(function() {
                  return newManifest;
                });
              });
          });
        } else {
          console.log("Cannot create deniedRegister -> Itinerary is not active");
          throw new Error(`Cannot create deniedRegister -> Itinerary is not active`);
        }
      })
  }
};

//-------------------------------------------------------
//                     Plugins
//-------------------------------------------------------


ManifestSchema.plugin(deepPopulate, {});


export default mongoose.model('Manifest', ManifestSchema);
