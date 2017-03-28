'use strict';

import mongoose from 'mongoose';

var ItinerarySchema = new mongoose.Schema({
  route: { type: mongoose.Types.ObjectId, ref: 'Route' },
  manifest: { type: mongoose.Types.ObjectId, ref: 'Manifest' },
  staff: { type: mongoose.Types.ObjectId, ref: 'Staff' }
});

export default mongoose.model('Itinerary', ItinerarySchema);
