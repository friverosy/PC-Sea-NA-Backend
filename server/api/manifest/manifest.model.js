'use strict';

import mongoose from 'mongoose';

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
      .then(function(manifest){
        let personData = manifest;
        
        personData.manifest = manifest._id;
        
        return Person.create(personData);
      })
      .then(function() { 
        return manifest; 
      });
  }
}

export default mongoose.model('Manifest', ManifestSchema);
