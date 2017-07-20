'use strict';

import mongoose from 'mongoose';
mongoose.Promise = require('bluebird');

import { EventEmitter } from 'events';

import Person from '../person/person.model';
import Manifest from '../manifest/manifest.model';
import Itinerary from '../itinerary/itinerary.model';

var deepPopulate = require('mongoose-deep-populate')(mongoose);

var RegisterSchema = new mongoose.Schema({
  state: { type: String, enum: ['pending', 'checkin', 'checkout'], default: 'pending' },
  isOnboard: { type: Boolean, default: false },
  isDenied: { type: Boolean, default: false },
  deniedReason: { type: Number, default: -1 },

  person: { type: mongoose.Schema.Types.ObjectId, ref: 'Person'},
  manifest: { type: mongoose.Schema.Types.ObjectId, ref: 'Manifest' },
  seaportCheckin: { type: mongoose.Schema.Types.ObjectId, ref: 'Seaport' },
  seaportCheckout: { type: mongoose.Schema.Types.ObjectId, ref: 'Seaport' },
  checkinDate: { type: Date },
  checkoutDate: { type: Date }
});

RegisterSchema.index({ manifest: 1 });
RegisterSchema.index({ person: 1 });
RegisterSchema.index({ seaportCheckin: 1 });
RegisterSchema.index({ seaportCheckout: 1 });
RegisterSchema.index({ isDenied: 1 });
RegisterSchema.index({ isOnboard: 1 });
RegisterSchema.index({ state: 1 });

var RegisterEvents = new EventEmitter();
RegisterEvents.setMaxListeners(0);

//-------------------------------------------------------
//                  Pre/Post Hooks
//-------------------------------------------------------

function emitEvent(event) {
  return function(doc) { 
    console.log(`emitting scoket.io event...`)
    
    RegisterEvents.emit(`${event}:${doc._id}`, doc);
    RegisterEvents.emit(event, doc);
  }
}

RegisterSchema.post('save', function(doc) {
  emitEvent('save')(doc);
});

RegisterSchema.post('remove', function(doc) {
  emitEvent('remove')(doc);
});

RegisterSchema.post('update', function(doc) {
  emitEvent('update')(doc);
});

RegisterSchema.post('findOneAndUpdate', function(doc) {
  emitEvent('findOneAndUpdate')(doc);
});


//-------------------------------------------------------
//                     Statics
//-------------------------------------------------------

RegisterSchema.statics = {
  getEventEmitter: function() {
    return RegisterEvents;
  },
  manualSell: function(data) {
    let Register = this;
    data.isOnboard = true;

    console.log("----Manual Sell, data received:");
    console.log(data)

    return Itinerary.findById(data.itinerary).exec()
      .then(function(itinerary){
        if(itinerary.active == true){
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
                
                let newRegister = new Register({
                  manifest: newManifest._id,
                  seaportCheckin: data.origin,
                  person: newPerson._id,
                  checkinDate: data.date,
                  isOnboard: true,
                  state: 'checkin'
                })
                
                return newRegister.save();
              })
              .then(function(newRegister) {
                return newManifest;
              });
            });
        } else {
          console.log("Cannot create manualSell -> Itinerary is not active");
          throw new Error(`Cannot create manualSell -> Itinerary is not active`);
        }
      })
  },
  deniedRegister: function(data) {
    let Register = this;

    console.log("----Denied Regisger, data received:");
    console.log(data)

    return Itinerary.findById(data.itinerary).exec()
      .then(function(itinerary){
        if(itinerary.active == true){
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
                var m_date = new Date().toLocaleString('es-ES', { timeZone: 'America/Santiago' })
                if(data.date) {
                  m_date = data.date;
                }
                
                let registerData = {
                  manifest: newManifest._id,
                  person: newPerson._id,
                  isDenied: true,
                  deniedReason: data.deniedReason,
                  checkinDate: m_date
                };

                if(data.origin) {
                  registerData.seaportCheckin = data.origin;
                }

                if(data.destination) {
                  registerData.seaportCheckout = data.destination;
                }

                return Register.create(registerData);
              })
              .then(function(newRegister) {
                return newManifest;
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


RegisterSchema.plugin(deepPopulate, {});


export default mongoose.model('Register', RegisterSchema);
