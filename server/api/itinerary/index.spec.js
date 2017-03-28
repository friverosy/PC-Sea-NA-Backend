'use strict';

var proxyquire = require('proxyquire').noPreserveCache();

var itineraryCtrlStub = {
  index: 'itineraryCtrl.index',
  show: 'itineraryCtrl.show',
  create: 'itineraryCtrl.create',
  upsert: 'itineraryCtrl.upsert',
  patch: 'itineraryCtrl.patch',
  destroy: 'itineraryCtrl.destroy'
};

var routerStub = {
  get: sinon.spy(),
  put: sinon.spy(),
  patch: sinon.spy(),
  post: sinon.spy(),
  delete: sinon.spy()
};

// require the index with our stubbed out modules
var itineraryIndex = proxyquire('./index.js', {
  express: {
    Router() {
      return routerStub;
    }
  },
  './itinerary.controller': itineraryCtrlStub
});

describe('Itinerary API Router:', function() {
  it('should return an express router instance', function() {
    expect(itineraryIndex).to.equal(routerStub);
  });

  describe('GET /api/itineraries', function() {
    it('should route to itinerary.controller.index', function() {
      expect(routerStub.get
        .withArgs('/', 'itineraryCtrl.index')
        ).to.have.been.calledOnce;
    });
  });

  describe('GET /api/itineraries/:id', function() {
    it('should route to itinerary.controller.show', function() {
      expect(routerStub.get
        .withArgs('/:id', 'itineraryCtrl.show')
        ).to.have.been.calledOnce;
    });
  });

  describe('POST /api/itineraries', function() {
    it('should route to itinerary.controller.create', function() {
      expect(routerStub.post
        .withArgs('/', 'itineraryCtrl.create')
        ).to.have.been.calledOnce;
    });
  });

  describe('PUT /api/itineraries/:id', function() {
    it('should route to itinerary.controller.upsert', function() {
      expect(routerStub.put
        .withArgs('/:id', 'itineraryCtrl.upsert')
        ).to.have.been.calledOnce;
    });
  });

  describe('PATCH /api/itineraries/:id', function() {
    it('should route to itinerary.controller.patch', function() {
      expect(routerStub.patch
        .withArgs('/:id', 'itineraryCtrl.patch')
        ).to.have.been.calledOnce;
    });
  });

  describe('DELETE /api/itineraries/:id', function() {
    it('should route to itinerary.controller.destroy', function() {
      expect(routerStub.delete
        .withArgs('/:id', 'itineraryCtrl.destroy')
        ).to.have.been.calledOnce;
    });
  });
});
