'use strict';

import mongoose from 'mongoose';

var PersonSchema = new mongoose.Schema({
  name: { type: String, uppercase: true, required: true },
  sex: String,
  resident: String,
  nationality: String,
  documentType: String,
  documentId: { type: String, uppercase: true, required: true }
});

export default mongoose.model('Person', PersonSchema);
