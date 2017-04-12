/**
 * Itinerary model events
 */

'use strict';

import {EventEmitter} from 'events';
import Itinerary from './itinerary.model';
var ItineraryEvents = new EventEmitter();

// Model events
var events = {
  save: 'save',
  remove: 'remove'
};

// Register the event emitter to the model events
for(var e in events) {
  let event = events[e];
  Itinerary.schema.post(e, emitEvent(event));
}

function emitEvent(event) {
  return function(doc) {
    ItineraryEvents.emit(`${event}:${doc._id}`, doc);
    ItineraryEvents.emit(event, doc);
  };
}

export default ItineraryEvents;
