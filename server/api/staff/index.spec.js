'use strict';

var proxyquire = require('proxyquire').noPreserveCache();

var staffCtrlStub = {
  index: 'staffCtrl.index',
  show: 'staffCtrl.show',
  create: 'staffCtrl.create',
  upsert: 'staffCtrl.upsert',
  patch: 'staffCtrl.patch',
  destroy: 'staffCtrl.destroy'
};

var routerStub = {
  get: sinon.spy(),
  put: sinon.spy(),
  patch: sinon.spy(),
  post: sinon.spy(),
  delete: sinon.spy()
};

// require the index with our stubbed out modules
var staffIndex = proxyquire('./index.js', {
  express: {
    Router() {
      return routerStub;
    }
  },
  './staff.controller': staffCtrlStub
});

describe('Seaport API Router:', function() {
  it('should return an express router instance', function() {
    expect(staffIndex).to.equal(routerStub);
  });

  describe('GET /api/staffs', function() {
    it('should route to staff.controller.index', function() {
      expect(routerStub.get
        .withArgs('/', 'staffCtrl.index')
        ).to.have.been.calledOnce;
    });
  });

  describe('GET /api/staffs/:id', function() {
    it('should route to staff.controller.show', function() {
      expect(routerStub.get
        .withArgs('/:id', 'staffCtrl.show')
        ).to.have.been.calledOnce;
    });
  });

  describe('POST /api/staffs', function() {
    it('should route to staff.controller.create', function() {
      expect(routerStub.post
        .withArgs('/', 'staffCtrl.create')
        ).to.have.been.calledOnce;
    });
  });

  describe('PUT /api/staffs/:id', function() {
    it('should route to staff.controller.upsert', function() {
      expect(routerStub.put
        .withArgs('/:id', 'staffCtrl.upsert')
        ).to.have.been.calledOnce;
    });
  });

  describe('PATCH /api/staffs/:id', function() {
    it('should route to staff.controller.patch', function() {
      expect(routerStub.patch
        .withArgs('/:id', 'staffCtrl.patch')
        ).to.have.been.calledOnce;
    });
  });

  describe('DELETE /api/staffs/:id', function() {
    it('should route to staff.controller.destroy', function() {
      expect(routerStub.delete
        .withArgs('/:id', 'staffCtrl.destroy')
        ).to.have.been.calledOnce;
    });
  });
});
