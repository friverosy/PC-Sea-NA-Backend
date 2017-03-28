'use strict';

import mongoose from 'mongoose';

var ManifestSchema = new mongoose.Schema({
  reservationId: String,
  reservationStatus: String,
  ticketId: String,
  
  origin: { type: mongoose.Schema.Types.ObjectId, ref: 'Seaport' },
  destination: { type: mongoose.Schema.Types.ObjectId, ref: 'Seaport' },
  itinerary: { type: mongoose.Schema.Types.ObjectId, ref: 'Itinerary'}
});

export default mongoose.model('Manifest', ManifestSchema);
