/**
 * Register model events
 */

'use strict';

import {EventEmitter} from 'events';
import Staff from './staff.model';
var StaffEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
StaffEvents.setMaxListeners(0);

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
    StaffEvents.emit(`${event}:${doc._id}`, doc);
    StaffEvents.emit(event, doc);
  };
}

export default StaffEvents;
