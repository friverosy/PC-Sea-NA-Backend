'use strict';

import mongoose from 'mongoose';

import Manifest from '../manifest/manifest.model';
import Register from '..//.model';
import Routes from '../manifest/manifest.model';

var ItinerarySchema = new mongoose.Schema({
  name: String,
  depart: Date,
  arrival: Date
});


ItinerarySchema.statics = {
}

export default mongoose.model('Itinerary', ItinerarySchema);
