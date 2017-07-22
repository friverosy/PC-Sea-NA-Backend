'use strict';

import mongoose from 'mongoose';

import Manifest from '../manifest/manifest.model';
import Register from '../register/register.model'
import Itinerary from '../itinerary/itinerary.model';

import moment from 'moment';
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
	exportRegistersExcel: function(itineraryId, summary, denied) {
	var data = [];
	data.push(["MANIFIESTO PASAJEROS"]);
	data.push([""]);
    
	return Itinerary.findById(itineraryId)
			.exec()
			.then(function(it) {
				data.push(["Ruta", it.name, "Puerto", "---", "Fecha", moment(it.depart).format('MM/DD/YYYY')]);
				data.push(["Tipo", "Transporte de pasajeros", "Nave", "---", "Hora", moment(it.depart).format('HH:mm:ss')]);
				data.push(["Capitan", "---"]);
				data.push([""]);

				return Manifest.find()
		    		.where('itinerary')
		    		.equals(itineraryId)
		    		.where('reservationStatus')
		    		.equals(1)
		    		.exec()
			})
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
        	let chilean = 0;
        	let foreign = 0;

        	for(var i in registers){
        		if (registers[i].state == "checkin"){
        			if(registers[i].person.documentType == "Pasaporte")
        				foreign++
        			else
        				chilean++
        		}
        	}

        	if(summary == "true"){
        		data.push(["Cadena Fondeo", "Al Zarpe"]);
				data.push(["", "Nacional", "Extranjero"]);
				data.push(["Nro Tripulantes Inc Capitan", "---", "---"]);
				data.push(["Cantidad de Pasajeros", chilean, foreign]);
				data.push(["Cantidad de agregados al rol", "---", "---"]);
				data.push(["TOTALES", chilean, foreign]);

				data.push([""]);
        	}

        	data.push(['Nro Reserva', 'Nro Ticket', 'Pasajero', 'Residente', 'Nacionalidad', 'Sexo', 'Documento', 'Nro Documento', 'Ciudad Origen', 'Ciudad Destino', 'Estado']);
		for(var i in registers) {
			let rowA;
                        var sState = "";
                        //console.log("=====registers====");
                        //console.log(registers[i]);

			//if (registers[i].state == "checkin"){
                        if(registers[i].isDenied == false) { 
			  if (registers[i].state == "pending") {
			    sState = "No Embarcado";
		    	  } else if(registers[i].state == "checkin") {
		            sState = "Embarcado";
			  } else if(registers[i].state == "checkout") {
		            sState = "Desembarcado";
                          } else {
			    sState = "Desconocido";
                          }

			  rowA = [registers[i].manifest.reservationId, registers[i].manifest.ticketId, registers[i].person.name, registers[i].person.resident, registers[i].person.nationality, registers[i].person.sex, registers[i].person.documentType, registers[i].person.documentId, registers[i].manifest.origin.locationName, registers[i].manifest.destination.locationName, sState];

			  data.push(rowA);
                        } else {
                          //console.log("=====> isDenied!");
                        }
			//}
		}
                //console.log("=========== DATA ===========");
                //console.log(data);
        	var buffer = xlsx.build([{ name: 'mySheetName', data: data }]);
        	return new Promise(resolve => resolve(buffer));
        });
  }
};

export default mongoose.model('Itinerary', ItinerarySchema);
