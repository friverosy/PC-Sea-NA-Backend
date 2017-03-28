'use strict';

import mongoose from 'mongoose';

var ManifestSchema = new mongoose.Schema({
  reservationId: String,
  reservationStatus: String,
  ticketId: String,
  
  person: { type: mongoose.Types.ObjectId, ref: 'Person' },
  origin: { type: mongoose.Types.ObjectId, ref: 'Seaport' },
  destination: { type: mongoose.Types.ObjectId, ref: 'Seaport' }
});

export default mongoose.model('Manifest', ManifestSchema);
