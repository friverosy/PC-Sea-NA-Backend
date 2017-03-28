'use strict';

import mongoose from 'mongoose';

var ManifestSchema = new mongoose.Schema({
  name: String,
  info: String,
  active: Boolean
});

export default mongoose.model('Manifest', ManifestSchema);
