'use strict';

import mongoose from 'mongoose';

var RegisterSchema = new mongoose.Schema({
  state: { type: String, enum: ['pending', 'onboard'], default: 'pending' },
  isOnboard: { type: Boolean, default: false },
  isDenied: { type: Boolean, default: false },
  
  resolvedRegister: { type: mongoose.Schema.Types.ObjectId, ref: 'Register' },
  person: { type: mongoose.Schema.Types.ObjectId, ref: 'Person'},
  manifest: { type: mongoose.Schema.Types.ObjectId, ref: 'Manifest' },
  seaport: { type: mongoose.Schema.Types.ObjectId, ref: 'Seaport' }
});

export default mongoose.model('Register', RegisterSchema);