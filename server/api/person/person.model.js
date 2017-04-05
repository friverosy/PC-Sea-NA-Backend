'use strict';

import mongoose from 'mongoose';

var PersonSchema = new mongoose.Schema({
  name: String,
  sex: String,
  resident: String,
  nationality: String,
  documentType: String,
  documentId: String
});

export default mongoose.model('Person', PersonSchema);
