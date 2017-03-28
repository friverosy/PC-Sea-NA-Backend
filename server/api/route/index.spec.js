'use strict';

var proxyquire = require('proxyquire').noPreserveCache();

var routeCtrlStub = {
  index: 'routeCtrl.index',
  show: 'routeCtrl.show',
  create: 'routeCtrl.create',
  upsert: 'routeCtrl.upsert',
  patch: 'routeCtrl.patch',
  destroy: 'routeCtrl.destroy'
};

var routerStub = {
  get: sinon.spy(),
  put: sinon.spy(),
  patch: sinon.spy(),
  post: sinon.spy(),
  delete: sinon.spy()
};

// require the index with our stubbed out modules
var routeIndex = proxyquire('./index.js', {
  express: {
    Router() {
      return routerStub;
    }
  },
  './route.controller': routeCtrlStub
});

describe('Route API Router:', function() {
  it('should return an express router instance', function() {
    expect(routeIndex).to.equal(routerStub);
  });

  describe('GET /api/routes', function() {
    it('should route to route.controller.index', function() {
      expect(routerStub.get
        .withArgs('/', 'routeCtrl.index')
        ).to.have.been.calledOnce;
    });
  });

  describe('GET /api/routes/:id', function() {
    it('should route to route.controller.show', function() {
      expect(routerStub.get
        .withArgs('/:id', 'routeCtrl.show')
        ).to.have.been.calledOnce;
    });
  });

  describe('POST /api/routes', function() {
    it('should route to route.controller.create', function() {
      expect(routerStub.post
        .withArgs('/', 'routeCtrl.create')
        ).to.have.been.calledOnce;
    });
  });

  describe('PUT /api/routes/:id', function() {
    it('should route to route.controller.upsert', function() {
      expect(routerStub.put
        .withArgs('/:id', 'routeCtrl.upsert')
        ).to.have.been.calledOnce;
    });
  });

  describe('PATCH /api/routes/:id', function() {
    it('should route to route.controller.patch', function() {
      expect(routerStub.patch
        .withArgs('/:id', 'routeCtrl.patch')
        ).to.have.been.calledOnce;
    });
  });

  describe('DELETE /api/routes/:id', function() {
    it('should route to route.controller.destroy', function() {
      expect(routerStub.delete
        .withArgs('/:id', 'routeCtrl.destroy')
        ).to.have.been.calledOnce;
    });
  });
});
