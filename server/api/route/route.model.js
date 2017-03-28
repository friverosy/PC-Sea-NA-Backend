'use strict';

import mongoose from 'mongoose';

var RouteSchema = new mongoose.Schema({
  name: String,
  seaports: [{ type: mongoose.Types.ObjectId, ref: 'Seaport' }]
});

export default mongoose.model('Route', RouteSchema);
