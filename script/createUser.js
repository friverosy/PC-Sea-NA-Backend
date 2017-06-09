#!/usr/bin/env node

var crypto = require('crypto');
var MongoClient = require('mongodb').MongoClient;

var mongoUri = 'mongodb://localhost/nav-dev';
if (process.env.NODE_ENV === 'production') {
  mongoUri = 'mongodb://localhost/nav';
}

var argv = require('yargs')
    .usage('Usage: $0 [options]')
    .example('$0 -n example -u foo -p bar -r admin', 'create a new user with username foo')
    .alias('n', 'name').nargs('n', 1).describe('n', 'Name of user')
    .alias('u', 'username').nargs('u', 1).describe('u', 'Username')
    .alias('p', 'password').nargs('p', 1).describe('p', 'Password')
    .alias('r', 'role').nargs('r', 1).describe('r', 'role').choices('r', ['auxiliar', 'captain', 'manager', 'admin'])
    .demandOption(['n', 'u', 'p', 'r'])
    .help('h').alias('h', 'help')
    .argv;


function encryptPassword(password, salt) {  
  var defaultIterations = 10000;
  var defaultKeyLength = 64;

  return crypto.pbkdf2Sync(password, new Buffer(salt, 'base64'), defaultIterations, defaultKeyLength, 'SHA1').toString('base64');
}

var username = argv.username.toLowerCase();
var salt     = crypto.randomBytes(16).toString('base64');
var password = encryptPassword(String(argv.password), salt);
var name     = argv.name;
var role     = argv.role;

MongoClient.connect(mongoUri, function(err, db) {
  if (err) {
    console.log('could not connect to database: ' + mongoUri);
    process.exit(-1);
  }

  db.collection('users').findOne({ username: username }, function(err, existingUser){
    if (err) {
      console.error('Error' + err);
      process.exit(1)
    }
    
    if (existingUser) {
      console.error('User already exist in database!. Aborting')
      process.exit(1);
    }
    
    db.collection('users').insertOne({
      username: username,
      password: password,
      name: name,
      role: role,
      salt: salt
    }, function(err, result){
      if(err) {
        console.error('Error' + err);
        process.exit(1)
      }
      
      console.log('User: ' + username + ' has been created succesfully.');
      
      db.close();
    })
  });


})



