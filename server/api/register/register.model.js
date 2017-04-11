'use strict';

import mongoose from 'mongoose';
import Promise from 'bluebird'
import moment from 'moment';
mongoose.Promise = require('bluebird');

import Seaport from '../seaport/seaport.model';
import Register from '../register/register.model';
import Person from '../person/person.model';
import Manifest from '../manifest/manifest.model';

var RegisterSchema = new mongoose.Schema({
  state: { type: String, enum: ['pending', 'checkin', 'checkout'], default: 'pending' },
  isOnboard: { type: Boolean, default: false },
  isDenied: { type: Boolean, default: false },

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
  	let now = new Date();
  	data.isOnboard = true;

	return Manifest.create(data)
      .then(function(newManifest){
    	return Person.update(
    		{ documentId: data.documentId },
    		{ name: data.name, sex: data.sex, resident: data.resident, nationality: data.nationality, documentId: data.documentId, documentType: data.documentType },
        	{ upsert: true })
      .then(function(newPerson){
        return Register.create({
        	person: newPerson._id,
            manifest: newManifest._id,
            seaportCheckin: data.origin,
            isOnboard: true
        })
      })
      .then(function(newRegister){
            return newManifest;
      });
    });
  }
}

export default mongoose.model('Register', RegisterSchema);
