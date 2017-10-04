'use strict';

var express = require('express');
var controller = require('./itinerary.controller');

var router = express.Router();

router.get('/', controller.index);
router.get('/:id', controller.show);
router.post('/', controller.create);
router.put('/:id', controller.upsert);
router.patch('/:id', controller.patch);
router.delete('/:id', controller.destroy);
router.get('/:id/seaports', controller.getSeaports);
router.get('/:id/export', controller.exportRegistersExcel);

// router.get('/:id/routes', controller.getRoutes);
// router.get('/:id/manifests', controller.getManifests);
router.get('/:id/registers', controller.getRegisters);

router.post('/:id/updateSeaports', controller.updateSeaports);

module.exports = router;
