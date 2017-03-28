'use strict';

import mongoose from 'mongoose';

var StaffSchema = new mongoose.Schema({
  name: String,
  info: String,
  active: Boolean
});

export default mongoose.model('Staff', StaffSchema);
