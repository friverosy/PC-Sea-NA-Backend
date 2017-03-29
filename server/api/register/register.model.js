'use strict';

import mongoose from 'mongoose';

var RegisterSchema = new mongoose.Schema({
  state: String,
  isOnboard: Boolean,
  isDenied: Boolean,
  
  resolvedRegister: { type: mongoose.Schema.Types.ObjectId, ref: 'Register' },
  person: { type: mongoose.Schema.Types.ObjectId, ref: 'Person'},
  manifest: { type: mongoose.Schema.Types.ObjectId, ref: 'Manifest' }
});

export default mongoose.model('Register', RegisterSchema);
