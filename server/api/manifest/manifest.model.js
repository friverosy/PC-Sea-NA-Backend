'use strict';

import Promise from 'bluebird';
import mongoose from 'mongoose';
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
  itinerary: { type: mongoose.Schema.Types.ObjectId, ref: 'Itinerary'}
});


ManifestSchema.statics = { 
  createManifest: function(data) {
    let Manifest = this;
    return Promise.all([
      Seaport.find().where('locationName').equals(new RegExp(`^${data.originName}`, 'i')).exec(),
      Seaport.find().where('locationName').equals(new RegExp(`^${data.destinationName}`, 'i')).exec()
    ])    
    .spread(function(candidateOrigins, candidateDestinations){
      // TODO: ATM getting the first one given the regexp (maybe use JaroWinkler for string distance?)
      
      console.log(`requesting data.originName = ${data.originName}. Got the following = ${JSON.stringify(candidateOrigins)}`);
      console.log(`requesting data.destinationName = ${data.destinationName}. Got the following = ${JSON.stringify(candidateDestinations)}`);
      
      let origin      = candidateOrigins[0] ? candidateOrigins[0]._id : null;
      let destination = candidateDestinations[0] ? candidateDestinations[0]._id : null;
      
      if (!origin || !destination) {
        console.log(`no seaports with name = ${data.originName}. Manifest and related data will not be created`);
        throw new Exception(`no seaports with locationName = ${data.originName} found`);
      }
      
      return Manifest.create(data)
        .then(function(newManifest){
          return Person.create({
            name: data.name,
            sex: data.sex,
            resident: data.resident,
            nationality: data.nationality,
            documentId: data.documentId,
            documentType: data.documentType,
            manifest: newManifest._id
          })
          .then(function(newPerson){
            return Register.create({
              person: newPerson._id,
              manifest: newManifest._id,
              seaportCI: origin
            })
          })
          .then(function(newRegister){
            return newManifest;
          });
        });
    });
  }
}

export default mongoose.model('Manifest', ManifestSchema);
