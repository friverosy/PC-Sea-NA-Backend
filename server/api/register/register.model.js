'use strict';

import mongoose from 'mongoose';

var RegisterSchema = new mongoose.Schema({
  state: { type: String, enum: ['pending', 'onboard'], default: 'pending' },
  isOnboard: { type: Boolean, default: false },
  isDenied: { type: Boolean, default: false },
  
  person: { type: mongoose.Schema.Types.ObjectId, ref: 'Person'},
  manifest: { type: mongoose.Schema.Types.ObjectId, ref: 'Manifest' },
  seaportCI: { type: mongoose.Schema.Types.ObjectId, ref: 'Seaport' },
  seaportCO: { type: mongoose.Schema.Types.ObjectId, ref: 'Seaport' }
});

export default mongoose.model('Register', RegisterSchema);