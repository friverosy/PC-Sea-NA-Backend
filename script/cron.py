import requests
import json
import sys
from StringIO import StringIO
import getopt
import pprint

TOKEN = '860a2e8f6b125e4c7b9bc83709a0ac1ddac9d40f'
TOKEN_NAV = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1OGRiM2I3NGI0ODRjOTIyOTVmMTE3MWUiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE0OTA3NjI2MTl9.pHVwA2u0iaVhjJ_ljU0NtFR_y0EGCwKXsLgIKSUcCK8'
NAV_API_URL = 'http://localhost:9001/api/'

def getItineraries(date):
    #print 'Getting itineraries from:', date

    url_imaginex_itineraries = 'http://ticket.bsale.cl/control_api/itineraries?date=' + date
    response = requests.get(url_imaginex_itineraries, headers={'token': TOKEN})

    itineraries = json.loads(response.text)
    #print itineraries

    return itineraries

def getPorts(itinerary_id):
    #print 'Itinerary:', itinerary_id

    url_imaginex_ports = 'http://ticket.bsale.cl/control_api/itinerary_ports?itinerary=' + str(itinerary_id)
    response = requests.get(url_imaginex_ports, headers={'token': TOKEN})

    ports = json.loads(response.text)

    return ports

def getInitialManifest(itinerary_id, port_id):
    #print 'Itinerary:', itinerary_id, 'Port:', port_id

    url_imaginex_manifest = 'http://ticket.bsale.cl/control_api/embarks?itinerary=' + str(itinerary_id) + '&port=' + str(port_id)
    response = requests.get(url_imaginex_manifest, headers={'token': TOKEN})

    manifest = json.loads(response.text)

    #print manifest

    return manifest

def getUpdatedManifest(itinerary_id, port_id, update_time):
    print 'Itinerary:', itinerary_id, 'Port:', port_id

    url_imaginex_manifest = 'http://ticket.bsale.cl/control_api/itinerary_manifest?itinerary=' + str(itinerary_id) + '&port=' + str(port_id) + '&date=' + update_time
    response = requests.get(url_imaginex_manifest, headers={'token': TOKEN})

    manifest = json.loads(response.text)

    print manifest

    return manifest

def postItinerary(itinerary):
    #print itinerary

    url_nav_itinerary = NAV_API_URL + 'itineraries/'
    response = requests.post(url_nav_itinerary, data={'refId':itinerary['id_itinerario'], 'depart':itinerary['zarpe'], 'name':itinerary['nombre_ruta']}, headers={'Authorization':'Baerer ' + TOKEN_NAV})

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

try:
    opts, args = getopt.getopt(sys.argv[1:], 'd:u:h', ['date=', 'update=', 'help='])
except getopt.GetoptError:
    print 'test.py -d date'
    sys.exit(2)

# TODO:  pass as part of arguments 
do_post = True

if do_post: 
    print "Data will be inserted into the mongodb. do_post: %s"  % str(do_post)
else:
    print "Data won't be inserted into the mongodb. do_post: %s" % str(do_post)

for opt, arg in opts:
    if opt == '-h':
        print 'test.py -d <date>'
        print 'test.py -u <date time>'
        sys.exit()
    elif opt in ("-d", "--date"):
        date = arg
        pp = pprint.PrettyPrinter(indent=4)

        itineraries = getItineraries(date)
        pp.pprint(itineraries)

        #print ''
        #print 'Getting Ports Associated to each itinerary'
        for keyword in itineraries:
            for itinerary in itineraries[keyword]:

                # POST itinerary
                if do_post:
                    itineraryObjectId = postItinerary(itinerary)
                    print "itinerary : %s " % itineraryObjectId
 
                # GET ports
                ports = getPorts(itinerary["id_itinerario"])
                print "\nPorts associated to the itinerary: %s, itinerary " % (itinerary["id_itinerario"])
                pp.pprint(ports)

                total_manifests = 0

                #print 'Getting Initial Manifest Associated to each itinerary and port'
                for port_id in ports:
                    for p in ports[port_id]:
                        print 'posting port: ' + p['nombre_ubicacion']
                        # POST Port
                        if do_post:
                            postPort(p)
                        
                    for p in ports[port_id]:
                        # POST Manifest
                        manifest = getInitialManifest(itinerary["id_itinerario"], p['id_ubicacion'])
                        print "\tThere are %d entries in the manifest of the itinerary: %s / port: %s " % (len(manifest['manifiesto_embarque']), itinerary["id_itinerario"], p['nombre_ubicacion'])
                        total_manifests = total_manifests + len(manifest['manifiesto_embarque'])
                        pp.pprint(manifest)

                        if do_post: 
                            postManifest(manifest, itineraryObjectId)
                print "\t==> Total number of manifest %d" %  total_manifests 

    elif opt in ("-u", "--update"):
        update_time = arg
        date = update_time.split(' ')[0]

        itineraries = getItineraries(date)

        print 'Getting Ports Associated to each itinerary'
        for keyword in itineraries:
            for itinerary in itineraries[keyword]:
                ports = getPorts(itinerary["id_itinerario"])

                print 'Getting Initial Manifest Associated to each itinerary and port'
                for port_id in ports:
                    for p in ports[port_id]:
                        manifest = getUpdatedManifest(itinerary["id_itinerario"], p['id_ubicacion'], update_time)

