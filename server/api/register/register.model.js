'use strict';

import mongoose from 'mongoose';
mongoose.Promise = require('bluebird');

import Person from '../person/person.model';
import Manifest from '../manifest/manifest.model';

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
  checkinDate: { type: Date, default: Date.now },
  checkoutDate: { type: Date }
});

RegisterSchema.statics = {
  manualSell: function(data) {
    let Register = this;
    data.isOnboard = true;
    //console.log("----Manual Sell, data received:");
    //console.log(data)
    return Manifest.create(data)
      .then(function(newManifest) {
        //return Person.findOneAndUpdate(
        //  { documentId: data.documentId },
        //  { name: data.name, sex: data.sex, resident: data.resident, nationality: data.nationality, documentId: data.documentId, documentType: data.documentType },
        //  { upsert: true, setDefaultsOnInsert: true, runValidators: true }
        //console.log("Manifest");
        //console.log(newManifest);
        return Person.create({
          name: data.name,
          sex: data.sex,
          resident: data.resident,
          nationality: data.nationality,
          documentId: data.documentId,
          documentType: data.documentType
        })
        .then(function(newPerson) {
          //console.log("Person");
          //console.log(newPerson);
          return Register.create({
            manifest: newManifest._id,
            seaportCheckin: data.origin,
            person: newPerson._id,
            isOnboard: true,
            state: 'checkin'
          });
        })
        .then(function() {
          //console.log("Register");
          //console.log(newRegister);
          return newManifest;
        });
      });
  }
};

//-------------------------------------------------------
//                     Plugins
//-------------------------------------------------------


RegisterSchema.plugin(deepPopulate, {});


export default mongoose.model('Register', RegisterSchema);
