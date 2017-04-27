import requests
import json
import sys
from StringIO import StringIO
import getopt
import pprint

TOKEN_NAV = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1OGRiM2I3NGI0ODRjOTIyOTVmMTE3MWUiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE0OTA3NjI2MTl9.pHVwA2u0iaVhjJ_ljU0NtFR_y0EGCwKXsLgIKSUcCK8'
NAV_API_URL = 'http://localhost:9001/api/'

def getItineraryObjectId(mdate, itinerary_id):
    #print 'Itinerary:', itinerary_id

    url_nav_manifest = NAV_API_URL + 'itineraries?date=' + mdate
    #print url_nav_manifest
    response = requests.get(url_nav_manifest , headers={'Authorization':'Baerer ' + TOKEN_NAV})

    itineraries = json.loads(response.text)
    #print "------------"
    for itinerary in itineraries:
        #print itinerary
        if(itinerary['refId'] == itinerary_id):
            #print "Bingo, found the ObjectId for refId: %d" % itinerary_id 
            return str(itinerary['_id'])
     
    return "-1"

def getItineraryActive():
    #print 'Itinerary:', itinerary_id

    url_nav_manifest = NAV_API_URL + 'itineraries?active=true'
    response = requests.get(url_nav_manifest , headers={'Authorization':'Baerer ' + TOKEN_NAV})

    itineraries = json.loads(response.text)

    return itineraries

def getItineraryInactive():
    #print 'Itinerary:', itinerary_id

    url_nav_manifest = NAV_API_URL + 'itineraries?active=false'
    response = requests.get(url_nav_manifest , headers={'Authorization':'Baerer ' + TOKEN_NAV})

    itineraries = json.loads(response.text)

    return itineraries

def postItinerary(itinerary):
    #print itinerary

    url_nav_itinerary = NAV_API_URL + 'itineraries/'
    response = requests.post(url_nav_itinerary, data={'refId':itinerary['id_itinerario'], 'depart':itinerary['zarpe'], 'name':itinerary['nombre_ruta'], 'active':'true'}, headers={'Authorization':'Baerer ' + TOKEN_NAV})

    itineraryObjectId = ''

    try:
        itineraryObjectId = json.loads(response.text)['_id']
    except:
        itineraryObjectId = json.loads(response.text)['op']['_id']

    return itineraryObjectId

def postPort(port):
    #print port

    url_nav_port = NAV_API_URL + 'seaports/'
    response = requests.post(url_nav_port, data={'locationId':port['id_ubicacion'], 'locationName':port['nombre_ubicacion']}, headers={'Authorization':'Baerer ' + TOKEN_NAV})

def postManifest(manifest, itineraryObjectId):
    for m in manifest['manifiesto_embarque']:
        print m
        print ''
        print ''

        url_nav_manifest = NAV_API_URL + 'manifests/'
        response = requests.post(url_nav_manifest, data={'name':m['nombre_pasajero'], 'sex':m['sexo'], 'resident':m['residente'], 
                                                        'nationality':m['nacionalidad'], 'documentId':m['codigo_pasajero'], 
                                                        'documentType':m['nombre_cod_documento'], 'reservationId':m['id_detalle_reserva'], 
                                                        'reservationStatus':0, 'ticketId':m['ticket'], 'originName':m['origen'], 
                                                        'destinationName':m['destino'], 'itinerary':itineraryObjectId}, headers={'Authorization':'Baerer ' + TOKEN_NAV})

def postUpdateManifest(manifest, itineraryObjectId):
    for m in manifest['manifiesto_pasajero']:
        print m
        print ''
        print ''

        url_nav_manifest = NAV_API_URL + 'manifests/'
        response = requests.post(url_nav_manifest, data={'name':m['nombre_pasajero'], 'sex':m['sexo'], 'resident':m['residente'], 
                                                        'nationality':m['nacionalidad'], 'documentId':m['codigo_pasajero'], 
                                                        'documentType':m['nombre_cod_documento'], 'reservationId':m['id_detalle_reserva'], 
                                                        'reservationStatus':0, 'ticketId':m['ticket'], 'originName':m['origen'], 
                                                        'destinationName':m['destino'], 'itinerary':itineraryObjectId}, headers={'Authorization':'Baerer ' + TOKEN_NAV})
