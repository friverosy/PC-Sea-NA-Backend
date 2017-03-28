'use strict';

import mongoose from 'mongoose';

var SeaportSchema = new mongoose.Schema({
  name: String
});

export default mongoose.model('Seaport', SeaportSchema);
