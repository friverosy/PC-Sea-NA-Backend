'use strict';

import Promise from 'bluebird';
import mongoose from 'mongoose';

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
    return this.create(data)
      .then(function(newManifest){
        return Person.create({
          name: data.name,
          sex: data.sex,
          resident: data.resident,
          nationality: data.nationality,
          documentId: data.documentId,
          documentType: data.documentType
        })
        .then(function(newPerson){
          return Register.create({
            person: newPerson._id,
            manifest: newManifest._id
          })
        })
        .then(function(newRegister){
          return newManifest;
        });
      });
  }
}

export default mongoose.model('Manifest', ManifestSchema);
