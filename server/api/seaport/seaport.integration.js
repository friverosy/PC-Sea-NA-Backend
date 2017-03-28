'use strict';

var app = require('../..');
import request from 'supertest';

var newSeaport;

describe('Seaport API:', function() {
  describe('GET /api/seaports', function() {
    var seaports;

    beforeEach(function(done) {
      request(app)
        .get('/api/seaports')
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if(err) {
            return done(err);
          }
          seaports = res.body;
          done();
        });
    });

    it('should respond with JSON array', function() {
      expect(seaports).to.be.instanceOf(Array);
    });
  });

  describe('POST /api/seaports', function() {
    beforeEach(function(done) {
      request(app)
        .post('/api/seaports')
        .send({
          name: 'New Seaport',
          info: 'This is the brand new seaport!!!'
        })
        .expect(201)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if(err) {
            return done(err);
          }
          newSeaport = res.body;
          done();
        });
    });

    it('should respond with the newly created seaport', function() {
      expect(newSeaport.name).to.equal('New Seaport');
      expect(newSeaport.info).to.equal('This is the brand new seaport!!!');
    });
  });

  describe('GET /api/seaports/:id', function() {
    var seaport;

    beforeEach(function(done) {
      request(app)
        .get(`/api/seaports/${newSeaport._id}`)
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if(err) {
            return done(err);
          }
          seaport = res.body;
          done();
        });
    });

    afterEach(function() {
      seaport = {};
    });

    it('should respond with the requested seaport', function() {
      expect(seaport.name).to.equal('New Seaport');
      expect(seaport.info).to.equal('This is the brand new seaport!!!');
    });
  });

  describe('PUT /api/seaports/:id', function() {
    var updatedSeaport;

    beforeEach(function(done) {
      request(app)
        .put(`/api/seaports/${newSeaport._id}`)
        .send({
          name: 'Updated Seaport',
          info: 'This is the updated seaport!!!'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) {
            return done(err);
          }
          updatedSeaport = res.body;
          done();
        });
    });

    afterEach(function() {
      updatedSeaport = {};
    });

    it('should respond with the original seaport', function() {
      expect(updatedSeaport.name).to.equal('New Seaport');
      expect(updatedSeaport.info).to.equal('This is the brand new seaport!!!');
    });

    it('should respond with the updated seaport on a subsequent GET', function(done) {
      request(app)
        .get(`/api/seaports/${newSeaport._id}`)
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if(err) {
            return done(err);
          }
          let seaport = res.body;

          expect(seaport.name).to.equal('Updated Seaport');
          expect(seaport.info).to.equal('This is the updated seaport!!!');

          done();
        });
    });
  });

  describe('PATCH /api/seaports/:id', function() {
    var patchedSeaport;

    beforeEach(function(done) {
      request(app)
        .patch(`/api/seaports/${newSeaport._id}`)
        .send([
          { op: 'replace', path: '/name', value: 'Patched Seaport' },
          { op: 'replace', path: '/info', value: 'This is the patched seaport!!!' }
        ])
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) {
            return done(err);
          }
          patchedSeaport = res.body;
          done();
        });
    });

    afterEach(function() {
      patchedSeaport = {};
    });

    it('should respond with the patched seaport', function() {
      expect(patchedSeaport.name).to.equal('Patched Seaport');
      expect(patchedSeaport.info).to.equal('This is the patched seaport!!!');
    });
  });

  describe('DELETE /api/seaports/:id', function() {
    it('should respond with 204 on successful removal', function(done) {
      request(app)
        .delete(`/api/seaports/${newSeaport._id}`)
        .expect(204)
        .end(err => {
          if(err) {
            return done(err);
          }
          done();
        });
    });

    it('should respond with 404 when seaport does not exist', function(done) {
      request(app)
        .delete(`/api/seaports/${newSeaport._id}`)
        .expect(404)
        .end(err => {
          if(err) {
            return done(err);
          }
          done();
        });
    });
  });
});
