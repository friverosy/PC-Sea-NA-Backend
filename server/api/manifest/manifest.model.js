'use strict';

import Promise from 'bluebird';
import mongoose from 'mongoose';
import moment from 'moment';
mongoose.Promise = require('bluebird');

import Seaport from '../seaport/seaport.model';
import Register from '../register/register.model';
import Person from '../person/person.model';

var ManifestSchema = new mongoose.Schema({
  reservationId: Number,
  reservationStatus: Number,
  ticketId: String,
  
  origin: { type: mongoose.Schema.Types.ObjectId, ref: 'Seaport' },
  destination: { type: mongoose.Schema.Types.ObjectId, ref: 'Seaport' },
  itinerary: { type: mongoose.Schema.Types.ObjectId, ref: 'Itinerary'},
  register: { type: mongoose.Schema.Types.ObjectId, ref: 'Register' }
});

ManifestSchema.statics = { 
  createManifest: function(data) {
    let Manifest = this;
    let now = new Date();

    return Promise.all([
      Seaport.find().where('locationName').equals(new RegExp(`^${data.originName}`, 'i')).exec(),
      Seaport.find().where('locationName').equals(new RegExp(`^${data.destinationName}`, 'i')).exec()
    ])    
    .spread(function(candidateOrigins, candidateDestinations){
      // TODO: ATM getting the first one given the regexp (maybe use JaroWinkler for string distance?)
      
      
      data.origin      = candidateOrigins[0] ? candidateOrigins[0]._id : null;
      data.destination = candidateDestinations[0] ? candidateDestinations[0]._id : null;
      
      if (!data.origin || !data.destination) {
        console.log(`no seaports with name = ${data.originName}. Manifest and related data will not be created`);
        console.log(`requesting data.originName = ${data.originName}. Got the following = ${JSON.stringify(candidateOrigins)}`);
        console.log(`requesting data.destinationName = ${data.destinationName}. Got the following = ${JSON.stringify(candidateDestinations)}`);
        throw new Exception(`no seaports with locationName = ${data.originName} found`);
      }

      return Manifest.create(data)
        .then(function(newManifest){
          console.log("Manifest");
          console.log(newManifest);
          console.log("documentId:" + data.documentId);
          //return Person.update({documentId : data.documentId}, 
          //{
          //  name: data.name,
          //  sex: data.sex,
          //  resident: data.resident,
          //  nationality: data.nationality,
          //  documentId: data.documentId,
          //  documentType: data.documentType
          //},
          //{ upsert: true })
          return Person.create( 
            {
              name: data.name,
              sex: data.sex,
              resident: data.resident,
              nationality: data.nationality,
              documentId: data.documentId,
              documentType: data.documentType
            })
            .then(function(newPerson){
            //console.log(data.isOnboard);
            console.log("Person");
            console.log(newPerson);
            if(data.isOnboard)
              return Register.create({
                person: newPerson._id,
                manifest: newManifest._id,
                seaportCheckin: data.origin,
                checkinDate: moment(now),
                isOnboard: true
              })
            else
              return Register.create({
                person: newPerson._id,
                manifest: newManifest._id,
                seaportCheckin: data.origin
              })
          })
          .then(function(newRegister){
            console.log("Register");
            console.log(newRegister);
            console.log("------");
            return newManifest;
          });
        });
    });
  }
}

export default mongoose.model('Manifest', ManifestSchema);
