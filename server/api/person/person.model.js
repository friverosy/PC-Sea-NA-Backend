'use strict';

import mongoose from 'mongoose';

var PersonSchema = new mongoose.Schema({
  name: { type: String, uppercase: true, required: false },
  sex: String,
  resident: String,
  nationality: String,
  documentType: String,
  age: { type: Number, default: 0 },
  birthdate: { type: Date, default: null },
  documentId: { type: String, uppercase: true, required: true }
});

export default mongoose.model('Person', PersonSchema);
