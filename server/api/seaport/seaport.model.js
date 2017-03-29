'use strict';

import mongoose from 'mongoose';

var SeaportSchema = new mongoose.Schema({
  locationId: String,
  locationName: String
});

export default mongoose.model('Seaport', SeaportSchema);
