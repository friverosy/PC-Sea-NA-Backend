/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';

import User from '../api/user/user.model';

User.find({}).remove()
  .then(() => {
    User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'test'
    }, {
      role: 'admin',
      name: 'Admin',
      email: 'admin',
      password: 'admin'
    })
    .then(() => {
      console.log('finished populating users');
    });
  });
