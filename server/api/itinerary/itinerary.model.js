'use strict';

import mongoose from 'mongoose';

var ItinerarySchema = new mongoose.Schema({
  refId: Number,
  name: String,
  depart: Date,
  arrival: Date,
  isActive: { type: Boolean, default: true }
});

ItinerarySchema.index({ refId: 1, depart: 1 }, { unique: true });

ItinerarySchema.statics = {};

export default mongoose.model('Itinerary', ItinerarySchema);
