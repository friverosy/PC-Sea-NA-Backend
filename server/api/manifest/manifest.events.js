/**
 * Manifest model events
 */

'use strict';

import {EventEmitter} from 'events';
import Manifest from './manifest.model';
var ManifestEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
ManifestEvents.setMaxListeners(0);

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
