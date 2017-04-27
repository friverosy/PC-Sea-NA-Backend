import requests
import json
import sys
from StringIO import StringIO
import getopt
import pprint
import sqlite3

TOKEN = '860a2e8f6b125e4c7b9bc83709a0ac1ddac9d40f'
TOKEN_NAV = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1OGRiM2I3NGI0ODRjOTIyOTVmMTE3MWUiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE0OTA3NjI2MTl9.pHVwA2u0iaVhjJ_ljU0NtFR_y0EGCwKXsLgIKSUcCK8'
NAV_API_URL = 'http://localhost:9001/api/'


class nav_db:
    def __init__(self):
       self._db = None
       pass

    def connect(self, today):
       self._db = sqlite3.connect('nav-' + today + '.db')
       self._pp = pprint.PrettyPrinter(indent=4)

    def createDB(self):
        cursor = self._db.cursor()
        cursor.execute('''
            CREATE TABLE manifests(id INTEGER PRIMARY KEY, 
                codigo_pasajero TEXT, 
                destino TEXT,
                id_detalle_reserva INTEGER,
                id_itinerario INTEGER,
                id_itinerario_relacionado INTEGER,
                nacionalidad TEXT,
                nombre_cod_documento TEXT, 
                nombre_pasajero TEXT, 
                origen TEXT,
                residente TEXT,
                sexo TEXT,
                ticket TEXT)
         ''')
        self._db.commit()
    def add_new(self, manifest): 
        print ''
        print "\tProcessing manifest:"
        pp.pprint(manifest)
        cursor = self._db.cursor()
        
        codigo_pasajero = manifest['codigo_pasajero']
        destino = manifest['destino'] 
        id_detalle_reserva = manifest['id_detalle_reserva'] 
        id_itinerario = manifest['id_itinerario']
        id_itinerario_relacionado = manifest['id_itinerario_relacionado']
        nacionalidad  = manifest['nacionalidad']
        nombre_cod_documento = manifest['nombre_cod_documento']
        nombre_pasajero  = manifest['nombre_pasajero']
        origen = manifest['origen']
        residente = manifest['residente']
        sexo = manifest['sexo']
        ticket = manifest['ticket']


        cursor.execute("SELECT * from manifests where codigo_pasajero = '" + codigo_pasajero + "'");
        if(len(cursor.fetchall()) > 0):
            print "\t\tthis manifest is already in the system, skip" 
            return 0
        else:
            cursor.execute('''INSERT INTO manifests( codigo_pasajero,
               destino, 
               id_detalle_reserva,
               id_itinerario,
               id_itinerario_relacionado,
               nacionalidad,
               nombre_cod_documento,
               nombre_pasajero,
               origen,
               residente,
               sexo,
               ticket)
               VALUES(?,?,?,?,?,?,?,?,?,?,?,?)''',
               (codigo_pasajero,
               destino, 
               id_detalle_reserva,
               id_itinerario,
               id_itinerario_relacionado,
               nacionalidad,
               nombre_cod_documento,
               nombre_pasajero,
               origen,
               residente,
               sexo,
               ticket))
            
            self._db.commit()   
            print("\t\tmanifest added to sqlite")
            return 1
        
myDB = nav_db()
    
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


def getInitialManifest(itinerary_id, port_id):
    #print 'Itinerary:', itinerary_id, 'Port:', port_id

    url_imaginex_manifest = 'http://ticket.bsale.cl/control_api/embarks?itinerary=' + str(itinerary_id) + '&port=' + str(port_id)
    response = requests.get(url_imaginex_manifest, headers={'token': TOKEN})

    manifest = json.loads(response.text)

    #print manifest

    return manifest

def getUpdatedManifest(itinerary_id, port_id, update_time):
    #print 'Itinerary:', itinerary_id, 'Port:', port_id

    url_imaginex_manifest = 'http://ticket.bsale.cl/control_api/itinerary_manifest?itinerary=' + str(itinerary_id) + '&port=' + str(port_id) + '&date=' + update_time
    response = requests.get(url_imaginex_manifest, headers={'token': TOKEN})

    manifest = json.loads(response.text)

    print 'URL:', url_imaginex_manifest
    #print manifest

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

def postManifest(manifest, itineraryObjectId, port):
    counter = 0
    counter_new = 0
    for m in manifest['manifiesto_embarque']:
        #print m
        #print ''
        #print ''

        counter = counter  + 1;
        result = myDB.add_new(m)
        if result > 0: 
            counter_new = counter_new + 1
            url_nav_manifest = NAV_API_URL + 'manifests/'
            response = requests.post(url_nav_manifest, data={'name':m['nombre_pasajero'], 'sex':m['sexo'], 'resident':m['residente'], 
                                                        'nationality':m['nacionalidad'], 'documentId':m['codigo_pasajero'], 
                                                        'documentType':m['nombre_cod_documento'], 'reservationId':m['id_detalle_reserva'], 
                                                        'reservationStatus':0, 'ticketId':m['ticket'], 'originName':m['origen'], 
                                                        'destinationName':m['destino'], 'itinerary':itineraryObjectId}, headers={'Authorization':'Baerer ' + TOKEN_NAV})

    print "\t====> the number of new manifests at %s  are: %d" % (port, counter_new)
    print "\t====> the number of processed manifests at %s are: %d" % (port, counter)

def postUpdateManifest(manifest, itineraryObjectId, currentPort):
    total_delta_manifest = 0
    for m in manifest['manifiesto_pasajero']:
        print currentPort
        print m
        if(m['origen'] == currentPort['nombre_ubicacion']):
            print "======> Este si"
            total_delta_manifest = total_delta_manifest + 1
        else:
            print "======> Este no %s   %s" % (currentPort, m['origen'])
       

        url_nav_manifest = NAV_API_URL + 'manifests/'
        #response = requests.post(url_nav_manifest, data={'name':m['nombre_pasajero'], 'sex':m['sexo'], 'resident':m['residente'], 
        #                                                'nationality':m['nacionalidad'], 'documentId':m['codigo_pasajero'], 
        #                                                'documentType':m['nombre_cod_documento'], 'reservationId':m['id_detalle_reserva'], 
        #                                                'reservationStatus':0, 'ticketId':m['ticket'], 'originName':m['origen'], 
        #                                                'destinationName':m['destino'], 'itinerary':itineraryObjectId}, headers={'Authorization':'Baerer ' + TOKEN_NAV})

        print ''
        print ''
    print 'Se agrego %d mainfiestos' % (total_delta_manifest)

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
        myDB.connect(date)
        #myDB.createDB()

        pp = pprint.PrettyPrinter(indent=4)
        
        itineraries = getItineraries(date)
        pp.pprint(itineraries)

        #print ''
        #print 'Getting Ports Associated to each itinerary'
        for keyword in itineraries:
            for itinerary in itineraries[keyword]:
                print "Processing manifest of the itinerary: %s " % (itinerary["id_itinerario"])

                # POST itinerary
                if do_post:
                    itineraryObjectId = postItinerary(itinerary)
 
                # GET ports
                ports = getPorts(itinerary["id_itinerario"])
                print "Ports associated to the itinerary: %s, itinerary " % (itinerary["id_itinerario"])
                print "itinerary : %s " % itineraryObjectId
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
                        #pp.pprint(manifest)

                        if do_post: 
                            postManifest(manifest, itineraryObjectId, p['nombre_ubicacion'])
                        print "listo puerto %s" % (p['nombre_ubicacion']) 
                        print ""

                print "==> Itinerary: %s, itinerary " % (itinerary["id_itinerario"])
                print "==> Total number of received manifest %d" %  total_manifests 
                print ""
                print ""
                print ""

    elif opt in ("-u", "--update"):
        update_time = arg
        date = update_time.split(' ')[0]
        pp = pprint.PrettyPrinter(indent=4)

        itineraries = getItineraries(date)

        #print 'Getting Ports Associated to each itinerary'
        for keyword in itineraries:
            for itinerary in itineraries[keyword]:
                if(itinerary["id_itinerario"] != 1828):
                    print "\n not interested in itinerary: %d" %  itinerary["id_itinerario"]
                else:
                    itineraryObjectId = getItineraryObjectId(date, itinerary["id_itinerario"])
                    ports = getPorts(itinerary["id_itinerario"])
                    print "\nPorts associated to the itinerary: %s ObjectId(\"%s\"" % (itinerary["id_itinerario"], itineraryObjectId)

                    #print 'Getting Initial Manifest Associated to each itinerary and port'
                    for port_id in ports:
                        for p in ports[port_id]:
                            manifest = getUpdatedManifest(itinerary["id_itinerario"], p['id_ubicacion'], update_time)
                            print "\tThere are %d entries in the manifest of the itinerary: %s / port: %s (id=%d)" % (len(manifest['manifiesto_pasajero']), itinerary["id_itinerario"], p['nombre_ubicacion'], p['id_ubicacion'])
                            #pp.pprint(manifest)
                            #print "The itinerary ObjectId = %s " % itineraryObjectId
                            if itineraryObjectId == "-1": 
                                print "Error in the database, Couldn't find the ObjectId of Itinerary %d, skipping manifests" % itinerary["id_itinerario"]
                            else: 
                                #check if origin port of the manifest is the same than the current port 
                                postUpdateManifest(manifest, itineraryObjectId, p)



  

