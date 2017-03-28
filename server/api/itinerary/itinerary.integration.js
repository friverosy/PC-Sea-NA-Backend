'use strict';

var app = require('../..');
import request from 'supertest';

var newItinerary;

describe('Itinerary API:', function() {
  describe('GET /api/itineraries', function() {
    var itineraries;

    beforeEach(function(done) {
      request(app)
        .get('/api/itineraries')
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if(err) {
            return done(err);
          }
          itineraries = res.body;
          done();
        });
    });

    it('should respond with JSON array', function() {
      expect(itineraries).to.be.instanceOf(Array);
    });
  });

  describe('POST /api/itineraries', function() {
    beforeEach(function(done) {
      request(app)
        .post('/api/itineraries')
        .send({
          name: 'New Itinerary',
          info: 'This is the brand new itinerary!!!'
        })
        .expect(201)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if(err) {
            return done(err);
          }
          newItinerary = res.body;
          done();
        });
    });

    it('should respond with the newly created itinerary', function() {
      expect(newItinerary.name).to.equal('New Itinerary');
      expect(newItinerary.info).to.equal('This is the brand new itinerary!!!');
    });
  });

  describe('GET /api/itineraries/:id', function() {
    var itinerary;

    beforeEach(function(done) {
      request(app)
        .get(`/api/itineraries/${newItinerary._id}`)
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if(err) {
            return done(err);
          }
          itinerary = res.body;
          done();
        });
    });

    afterEach(function() {
      itinerary = {};
    });

    it('should respond with the requested itinerary', function() {
      expect(itinerary.name).to.equal('New Itinerary');
      expect(itinerary.info).to.equal('This is the brand new itinerary!!!');
    });
  });

  describe('PUT /api/itineraries/:id', function() {
    var updatedItinerary;

    beforeEach(function(done) {
      request(app)
        .put(`/api/itineraries/${newItinerary._id}`)
        .send({
          name: 'Updated Itinerary',
          info: 'This is the updated itinerary!!!'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) {
            return done(err);
          }
          updatedItinerary = res.body;
          done();
        });
    });

    afterEach(function() {
      updatedItinerary = {};
    });

    it('should respond with the original itinerary', function() {
      expect(updatedItinerary.name).to.equal('New Itinerary');
      expect(updatedItinerary.info).to.equal('This is the brand new itinerary!!!');
    });

    it('should respond with the updated itinerary on a subsequent GET', function(done) {
      request(app)
        .get(`/api/itineraries/${newItinerary._id}`)
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if(err) {
            return done(err);
          }
          let itinerary = res.body;

          expect(itinerary.name).to.equal('Updated Itinerary');
          expect(itinerary.info).to.equal('This is the updated itinerary!!!');

          done();
        });
    });
  });

  describe('PATCH /api/itineraries/:id', function() {
    var patchedItinerary;

    beforeEach(function(done) {
      request(app)
        .patch(`/api/itineraries/${newItinerary._id}`)
        .send([
          { op: 'replace', path: '/name', value: 'Patched Itinerary' },
          { op: 'replace', path: '/info', value: 'This is the patched itinerary!!!' }
        ])
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) {
            return done(err);
          }
          patchedItinerary = res.body;
          done();
        });
    });

    afterEach(function() {
      patchedItinerary = {};
    });

    it('should respond with the patched itinerary', function() {
      expect(patchedItinerary.name).to.equal('Patched Itinerary');
      expect(patchedItinerary.info).to.equal('This is the patched itinerary!!!');
    });
  });

  describe('DELETE /api/itineraries/:id', function() {
    it('should respond with 204 on successful removal', function(done) {
      request(app)
        .delete(`/api/itineraries/${newItinerary._id}`)
        .expect(204)
        .end(err => {
          if(err) {
            return done(err);
          }
          done();
        });
    });

    it('should respond with 404 when itinerary does not exist', function(done) {
      request(app)
        .delete(`/api/itineraries/${newItinerary._id}`)
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
