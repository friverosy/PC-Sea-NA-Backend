'use strict';

import mongoose from 'mongoose';

import Manifest from '../manifest/manifest.model';
import Register from '../register/register.model'
import xlsx from 'node-xlsx';

var ItinerarySchema = new mongoose.Schema({
  refId: Number,
  name: String,
  depart: Date,
  arrival: Date,
  active: { type: Boolean, default: true }
});

ItinerarySchema.index({ refId: 1, depart: 1 }, { unique: true });

ItinerarySchema.statics = {
	exportRegistersExcel: function(itineraryId, denied) {
	var data = [[]];
	data.push(['Nro Reserva', 'Nro Ticket', 'Pasajero', 'Residente', 'Nacionalidad', 'Sexo', 'Documento', 'Nro Documento', 'Ciudad Origen', 'Ciudad Destino', 'Estado']);
    
	return Manifest.find()
	    .where('itinerary')
	    .equals(itineraryId)
	    .where('reservationStatus')
	    .equals(1)
	    .exec()
	    .then(function(manifests) {
	      let manifestsIds = manifests.map(m => m._id);
	      
	      let registersBaseQuery = Register.find()
	        .populate('person seaportCheckin seaportCheckout')
	        .deepPopulate('manifest.origin manifest.destination')
	        .where('manifest')
	        .in(manifestsIds);
	      
	      if (denied == 'true' || denied == 'false') {
	        return registersBaseQuery.where('isDenied').equals(JSON.parse(req.query.denied)).exec()
	      } else {
	        return registersBaseQuery.exec()
	      }
	    })
        .then(function(registers) {
			for(var i in registers) {
				let rowA;
				rowA = [registers[i].manifest.reservationId, registers[i].manifest.ticketId, registers[i].person.name, registers[i].person.resident,
						registers[i].person.nationality, registers[i].person.sex, registers[i].person.documentType, registers[i].person.documentId,
						registers[i].manifest.origin.locationName, registers[i].manifest.destination.locationName, registers[i].state]
				//console.log("Nro Reserva: ", registers[i].manifest.reservationId);
            	//console.log("Nro Ticket: ", registers[i].manifest.ticketId);
            	//console.log("Pasajero(Nombre): ", registers[i].person.name);
            	//console.log("Residente (si/no): ", registers[i].person.resident);
            	//console.log("Nacionalidad: ", registers[i].person.nationality);
            	//console.log("Sexo: ", registers[i].person.sex);
            	//console.log("Documento (Cedula de identidad / pasaporte): ", registers[i].person.documentType);
            	//console.log("Nro Documento (Rut/Pasaporte): ", registers[i].person.documentId);
            	//console.log("Ciudad Origen: ", registers[i].manifest.origin.locationName);
            	//console.log("Ciudad Destino: ", registers[i].manifest.destination.locationName);
            	//console.log("Estado (Embarcado/Desembarcado): ", registers[i].state);
            	data.push(rowA);
        	}
      })
      .then(function() {
        var buffer = xlsx.build([{ name: 'mySheetName', data: data }]);
        return new Promise(resolve => resolve(buffer));
      });
  }
};

export default mongoose.model('Itinerary', ItinerarySchema);
