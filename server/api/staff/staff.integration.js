'use strict';

var app = require('../..');
import request from 'supertest';

var newStaff;

describe('Staff API:', function() {
  describe('GET /api/staffs', function() {
    var staffs;

    beforeEach(function(done) {
      request(app)
        .get('/api/staffs')
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if(err) {
            return done(err);
          }
          staffs = res.body;
          done();
        });
    });

    it('should respond with JSON array', function() {
      expect(staffs).to.be.instanceOf(Array);
    });
  });

  describe('POST /api/staffs', function() {
    beforeEach(function(done) {
      request(app)
        .post('/api/staffs')
        .send({
          name: 'New Staff',
          info: 'This is the brand new staff!!!'
        })
        .expect(201)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if(err) {
            return done(err);
          }
          newStaff = res.body;
          done();
        });
    });

    it('should respond with the newly created staff', function() {
      expect(newStaff.name).to.equal('New Staff');
      expect(newStaff.info).to.equal('This is the brand new staff!!!');
    });
  });

  describe('GET /api/staffs/:id', function() {
    var staff;

    beforeEach(function(done) {
      request(app)
        .get(`/api/staffs/${newStaff._id}`)
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if(err) {
            return done(err);
          }
          staff = res.body;
          done();
        });
    });

    afterEach(function() {
      staff = {};
    });

    it('should respond with the requested staff', function() {
      expect(staff.name).to.equal('New Staff');
      expect(staff.info).to.equal('This is the brand new staff!!!');
    });
  });

  describe('PUT /api/staffs/:id', function() {
    var updatedStaff;

    beforeEach(function(done) {
      request(app)
        .put(`/api/staffs/${newStaff._id}`)
        .send({
          name: 'Updated Staff',
          info: 'This is the updated staff!!!'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) {
            return done(err);
          }
          updatedStaff = res.body;
          done();
        });
    });

    afterEach(function() {
      updatedStaff = {};
    });

    it('should respond with the original staff', function() {
      expect(updatedStaff.name).to.equal('New Staff');
      expect(updatedStaff.info).to.equal('This is the brand new staff!!!');
    });

    it('should respond with the updated staff on a subsequent GET', function(done) {
      request(app)
        .get(`/api/staffs/${newStaff._id}`)
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if(err) {
            return done(err);
          }
          let staff = res.body;

          expect(staff.name).to.equal('Updated Staff');
          expect(staff.info).to.equal('This is the updated staff!!!');

          done();
        });
    });
  });

  describe('PATCH /api/staffs/:id', function() {
    var patchedStaff;

    beforeEach(function(done) {
      request(app)
        .patch(`/api/staffs/${newStaff._id}`)
        .send([
          { op: 'replace', path: '/name', value: 'Patched Staff' },
          { op: 'replace', path: '/info', value: 'This is the patched staff!!!' }
        ])
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) {
            return done(err);
          }
          patchedStaff = res.body;
          done();
        });
    });

    afterEach(function() {
      patchedStaff = {};
    });

    it('should respond with the patched staff', function() {
      expect(patchedStaff.name).to.equal('Patched Staff');
      expect(patchedStaff.info).to.equal('This is the patched staff!!!');
    });
  });

  describe('DELETE /api/staffs/:id', function() {
    it('should respond with 204 on successful removal', function(done) {
      request(app)
        .delete(`/api/staffs/${newStaff._id}`)
        .expect(204)
        .end(err => {
          if(err) {
            return done(err);
          }
          done();
        });
    });

    it('should respond with 404 when staff does not exist', function(done) {
      request(app)
        .delete(`/api/staffs/${newStaff._id}`)
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
