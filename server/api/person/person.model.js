'use strict';

import mongoose from 'mongoose';

var PersonSchema = new mongoose.Schema({
  name: { type: String, uppercase: true, required: false },
  sex: String,
  resident: String,
  nationality: String,
  documentType: String,
  age: { type: String, default: '' },
  birthdate: { type: String, default: '' },
  documentId: { type: String, uppercase: true, required: true }
});

export default mongoose.model('Person', PersonSchema);
