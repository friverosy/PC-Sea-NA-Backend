'use strict';

var proxyquire = require('proxyquire').noPreserveCache();

var seaportCtrlStub = {
  index: 'seaportCtrl.index',
  show: 'seaportCtrl.show',
  create: 'seaportCtrl.create',
  upsert: 'seaportCtrl.upsert',
  patch: 'seaportCtrl.patch',
  destroy: 'seaportCtrl.destroy'
};

var routerStub = {
  get: sinon.spy(),
  put: sinon.spy(),
  patch: sinon.spy(),
  post: sinon.spy(),
  delete: sinon.spy()
};

// require the index with our stubbed out modules
var seaportIndex = proxyquire('./index.js', {
  express: {
    Router() {
      return routerStub;
    }
  },
  './seaport.controller': seaportCtrlStub
});

describe('Seaport API Router:', function() {
  it('should return an express router instance', function() {
    expect(seaportIndex).to.equal(routerStub);
  });

  describe('GET /api/seaports', function() {
    it('should route to seaport.controller.index', function() {
      expect(routerStub.get
        .withArgs('/', 'seaportCtrl.index')
        ).to.have.been.calledOnce;
    });
  });

  describe('GET /api/seaports/:id', function() {
    it('should route to seaport.controller.show', function() {
      expect(routerStub.get
        .withArgs('/:id', 'seaportCtrl.show')
        ).to.have.been.calledOnce;
    });
  });

  describe('POST /api/seaports', function() {
    it('should route to seaport.controller.create', function() {
      expect(routerStub.post
        .withArgs('/', 'seaportCtrl.create')
        ).to.have.been.calledOnce;
    });
  });

  describe('PUT /api/seaports/:id', function() {
    it('should route to seaport.controller.upsert', function() {
      expect(routerStub.put
        .withArgs('/:id', 'seaportCtrl.upsert')
        ).to.have.been.calledOnce;
    });
  });

  describe('PATCH /api/seaports/:id', function() {
    it('should route to seaport.controller.patch', function() {
      expect(routerStub.patch
        .withArgs('/:id', 'seaportCtrl.patch')
        ).to.have.been.calledOnce;
    });
  });

  describe('DELETE /api/seaports/:id', function() {
    it('should route to seaport.controller.destroy', function() {
      expect(routerStub.delete
        .withArgs('/:id', 'seaportCtrl.destroy')
        ).to.have.been.calledOnce;
    });
  });
});
