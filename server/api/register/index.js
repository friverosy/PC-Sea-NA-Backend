'use strict';

var express = require('express');
var controller = require('./register.controller');

var router = express.Router();

router.get('/', controller.index);
router.get('/status', controller.status);
router.get('/:id', controller.show);
router.post('/', controller.create);
router.post('/manualSell', controller.createManualSell);
router.put('/:id', controller.upsert);
router.patch('/:id', controller.patch);
router.delete('/:id', controller.destroy);

module.exports = router;
