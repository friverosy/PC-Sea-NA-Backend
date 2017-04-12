/**
 * Manifest model events
 */

'use strict';

import {EventEmitter} from 'events';
import Manifest from './manifest.model';
var ManifestEvents = new EventEmitter();


// Model events
var events = {
  save: 'save',
  remove: 'remove'
};

// Register the event emitter to the model events
for(var e in events) {
  let event = events[e];
  Manifest.schema.post(e, emitEvent(event));
}

function emitEvent(event) {
  return function(doc) {
    ManifestEvents.emit(`${event}:${doc._id}`, doc);
    ManifestEvents.emit(event, doc);
  };
}

export default ManifestEvents;
