'use strict';

import mongoose from 'mongoose';

var RouteSchema = new mongoose.Schema({
  name: String,
  itinerary: { type: mongoose.Schema.Types.ObjectId, ref: 'Itinerary' },
  seaports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Seaport' }]
});

export default mongoose.model('Route', RouteSchema);
