/**
 * Register model events
 */

'use strict';

import {EventEmitter} from 'events';
import Register from './register.model';
var RegisterEvents = new EventEmitter();

// Model events
var events = {
  save: 'save',
  remove: 'remove'
};

// Register the event emitter to the model events
for(var e in events) {
  let event = events[e];
  Register.schema.post(e, emitEvent(event));
}

function emitEvent(event) {
  return function(doc) {
    RegisterEvents.emit(`${event}:${doc._id}`, doc);
    RegisterEvents.emit(event, doc);
  };
}

export default RegisterEvents;
