'use strict';

import mongoose from 'mongoose';

var RegisterSchema = new mongoose.Schema({
  state: String,
  isOnboard: Boolean,
  isDenied: Boolean,
  seaport: { type: mongoose.Schema.Types.ObjectId, ref: 'Seaport'},
  person: { type: mongoose.Schema.Types.ObjectId, ref: 'Person'},
  resolvedRegister: { type: mongoose.Schema.Types.ObjectId, ref: 'Register' },
  itinerary: { type: mongoose.Schema.Types.ObjectId, ref: 'Itinerary' }
});

export default mongoose.model('Register', RegisterSchema);
