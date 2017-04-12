/**
 * Register model events
 */

'use strict';

import {EventEmitter} from 'events';
import Seaport from './seaport.model';
var SeaportEvents = new EventEmitter();


// Model events
var events = {
  save: 'save',
  remove: 'remove'
};

// Seaport the event emitter to the model events
for(var e in events) {
  let event = events[e];
  Seaport.schema.post(e, emitEvent(event));
}

function emitEvent(event) {
  return function(doc) {
    SeaportEvents.emit(`${event}:${doc._id}`, doc);
    SeaportEvents.emit(event, doc);
  };
}

export default SeaportEvents;
