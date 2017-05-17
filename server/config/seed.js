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
      username: 'test',
      password: 'test'
    }, {
      role: 'admin',
      name: 'Admin',
      username: 'admin',
      password: 'admin'
    }, {
      name: 'Diego Eterovic',
      username: 'deterovic',
      password: 'navuser'
    })
    .then(() => {
      console.log('finished populating users');
    });
  });
