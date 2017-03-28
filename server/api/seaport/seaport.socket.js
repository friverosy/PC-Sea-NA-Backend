/**
 * Broadcast updates to client when the model changes
 */

'use strict';

import SeaportEvents from './seaport.events';

// Model events to emit
var events = ['save', 'remove'];

export function seaport(socket) {
  // Bind model events to socket events
  for(var i = 0, eventsLength = events.length; i < eventsLength; i++) {
    var event = events[i];
    var listener = createListener(`seaport:${event}`, socket);

    SeaportEvents.on(event, listener);
    socket.on('disconnect', removeListener(event, listener));
  }
}


function createListener(event, socket) {
  return function(doc) {
    socket.emit(event, doc);
  };
}

function removeListener(event, listener) {
  return function() {
    SeaportEvents.removeListener(event, listener);
  };
}
