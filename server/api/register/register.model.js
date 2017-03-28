'use strict';

import mongoose from 'mongoose';

var RegisterSchema = new mongoose.Schema({
  state: String,
  isOnboard: Boolean,
  isDenied: Boolean,
  seaport: { type: mongoose.Types.ObjectId, ref: 'Seaport'},
  person: { type: mongoose.Types.ObjectId, ref: 'Person'},
  resolvedRegister: { type: mongoose.Types.ObjectId, ref: 'Register' }
});

export default mongoose.model('Register', RegisterSchema);
