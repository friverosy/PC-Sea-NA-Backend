'use strict';

import mongoose from 'mongoose';

var SeaportSchema = new mongoose.Schema({
  name: String,
  info: String,
  active: Boolean
});

export default mongoose.model('Seaport', SeaportSchema);
