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
       self._DB_DIR = "/home/tzu/na-cron-logs/db"
       self._closed_itineraries  = self.load_closed_itineraries()
       self._pp = pprint.PrettyPrinter(indent=4)
       pass

    def connect(self, intinerary_id):
       filename = self._DB_DIR + '/' + 'nav-' + str(intinerary_id) + '.db'
       print filename
       self._db = sqlite3.connect(filename)
       #check if the db exists already, otherwise create it. 
       cursor = self._db.cursor()
       try: 
           cursor.execute("SELECT count(*) from manifests");
       except sqlite3.OperationalError:
           print "creating the table"
           self.createDB()

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
                ticket TEXT, 
                processed INT, 
                objectId TEXT)
         ''')
        self._db.commit()
    def load_closed_itineraries(self):
        itineraries  = {1828: {'name': 'Puerto Montt - Chaiten'}, 
               1857: {'name': 'Chaiten - Puerto Montt'}}
        return itineraries

    def isClosedItinerary(self, refId): 
        print self._closed_itineraries
        
        try:
            refId = self._closed_itineraries[refId]
            #it's a closed ititnerary
            return True
        except KeyError:
            #this refId doesn't exist in the dictionary, therefore it must be not closed yet.
            return False

    def reset_processing_status(self):
        cursor = self._db.cursor()
        cursor.execute("UPDATE manifests SET processed = 0 where id in (select id from manifests)")

    def remove_deleted_manifests(self):
        print "Looking for deleted manifests ..."
        cursor = self._db.cursor()
        sSQL = "SELECT * from manifests where processed = 0"
        print "sSQL=" + sSQL
        cursor.execute(sSQL)
        data = cursor.fetchall()
        print data 
        for m in data:
            print "change the reservationStatus of the manifest to deleted (-1)"
            #(1, u'25711561-5', u'Chaiten', 453345, 1924, None, u'Chileno(a)', u'Cdula de Identidad', u'ADAM VAUGHN', u'Quellon', u'No', u'M', u'263069', 0, u'591d355dd94afa7a90d5d0e5')
            url_nav_manifest = NAV_API_URL + 'manifests/'
            objectId = m[14]
            print "change manifest with objectId = %s to disable" % (objectId)
            print url_nav_manifest
            response = requests.patch(url_nav_manifest + objectId, data={"op":"replace", "path":"/reservationStatus", "value": "-1"}, headers={'Authorization':'Baerer ' + TOKEN_NAV})
            print "response"
            print response.content


    def add_new(self, manifest): 
        print ''
        print "\tProcessing manifest:"
        pp.pprint(manifest)
        cursor = self._db.cursor()
        
        codigo_pasajero = manifest['codigo_pasajero']
        destino = manifest['destino'].encode('ascii', 'ignore') 
        id_detalle_reserva = manifest['id_detalle_reserva'] 
        id_itinerario = manifest['id_itinerario']
        id_itinerario_relacionado = manifest['id_itinerario_relacionado']
        nacionalidad  = manifest['nacionalidad'].encode('ascii','ignore')
        nombre_cod_documento = manifest['nombre_cod_documento'].encode('ascii','ignore')
        nombre_pasajero  = manifest['nombre_pasajero'].encode('ascii','ignore')
        origen = manifest['origen'].encode('ascii', 'ignore')
        residente = manifest['residente'].encode('ascii', 'ignore')
        sexo = manifest['sexo'].encode('ascii', 'ignore')
        ticket = manifest['ticket'].encode('ascii', 'ignore')
        processed = "1"
        
        sSQL = "SELECT * from manifests where codigo_pasajero = '%s'" \
               "  and destino = '%s'" \
               "  and id_detalle_reserva = %d" \
               "  and id_itinerario = %d" \
               "  and nacionalidad ='%s'" \
               "  and nombre_cod_documento ='%s'" \
               "  and nombre_pasajero = '%s'" \
               "  and origen ='%s'" \
               "  and residente ='%s'" \
               "  and sexo ='%s'" \
               "  and ticket =%s" % (codigo_pasajero, 
                                     destino, 
                                     id_detalle_reserva, 
                                     id_itinerario, 
                                     nacionalidad,
                                     nombre_cod_documento,
                                     nombre_pasajero, 
                                     origen, 
                                     residente, 
                                     sexo, 
                                     ticket )
        print sSQL
        cursor.execute(sSQL)
        data = cursor.fetchall()
        print len(data)
        print data

        if(len(data) == 0 ):
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
               ticket, 
               processed)
               VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)''',
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
               ticket,
               processed))
            self._db.commit()   
            print("\t\tmanifest added to sqlite")
            return 1
        if(len(data) == 1):
            _id = data[0][0]
            print "\t\tthis manifest is already in the system, skip" 
            print "id=%d" % _id
            
            sSQL = "UPDATE manifests SET processed = 1 where id = %d" % _id
            print sSQL
            cursor.execute(sSQL)
            self._db.commit()   
            return 0
        else:
            print "\t\tError, there are more than one register that match this manifest, this shouldn't happen"
            return 0
                

    def updateObjectId(self, manifest, objectId): 
        cursor = self._db.cursor()
        
        codigo_pasajero = manifest['codigo_pasajero']
        destino = manifest['destino'].encode('ascii', 'ignore') 
        id_detalle_reserva = manifest['id_detalle_reserva'] 
        id_itinerario = manifest['id_itinerario']
        id_itinerario_relacionado = manifest['id_itinerario_relacionado']
        nacionalidad  = manifest['nacionalidad'].encode('ascii','ignore')
        nombre_cod_documento = manifest['nombre_cod_documento'].encode('ascii','ignore')
        nombre_pasajero  = manifest['nombre_pasajero'].encode('ascii','ignore')
        origen = manifest['origen'].encode('ascii', 'ignore')
        residente = manifest['residente'].encode('ascii', 'ignore')
        sexo = manifest['sexo'].encode('ascii', 'ignore')
        ticket = manifest['ticket'].encode('ascii', 'ignore')
        processed = "1"
        
        sSQL = "SELECT * from manifests where codigo_pasajero = '%s'" \
               "  and destino = '%s'" \
               "  and id_detalle_reserva = %d" \
               "  and id_itinerario = %d" \
               "  and nacionalidad ='%s'" \
               "  and nombre_cod_documento ='%s'" \
               "  and nombre_pasajero = '%s'" \
               "  and origen ='%s'" \
               "  and residente ='%s'" \
               "  and sexo ='%s'" \
               "  and ticket =%s" % (codigo_pasajero, 
                                     destino, 
                                     id_detalle_reserva, 
                                     id_itinerario, 
                                     nacionalidad,
                                     nombre_cod_documento,
                                     nombre_pasajero, 
                                     origen, 
                                     residente, 
                                     sexo, 
                                     ticket )
        print sSQL
        cursor.execute(sSQL)
        data = cursor.fetchall()
        print len(data)
        print data

        if(len(data) == 1):
            _id = data[0][0]
            print "\t\tFound the manifest, updating the objectId" 
            print "id=%d" % _id
            
            sSQL = "UPDATE manifests SET objectId = '%s' where id = %d" % (objectId, _id)
            print sSQL
            cursor.execute(sSQL)
            self._db.commit()   
            return 0
        else:
            print "\t\tError, there must be only one register that match this manifest, I found %d, this shouldn't happen" % len(data)
            return 0
                



#---- end of nav_dv class
        
    
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

def getItineraryStatus(itinerary_id):
    print 'Itinerary:', itinerary_id

    url_nav_manifest = NAV_API_URL + 'itineraries?refId=' + str(itinerary_id)
    #print url_nav_manifest
    response = requests.get(url_nav_manifest , headers={'Authorization':'Baerer ' + TOKEN_NAV})

    itineraries = json.loads(response.text)
    #print "------------"
    for itinerary in itineraries:
        #print itinerary
        if(itinerary['refId'] == itinerary_id):
            #print "Bingo, found the ObjectId for refId: %d" % itinerary_id 
            return str(itinerary['active'])
     
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

def postManifest(manifest, refId, itineraryObjectId, port):
    counter = 0
    counter_new = 0
    for m in manifest['manifiesto_embarque']:
        #print m
        #print ''
        #print ''
        counter = counter  + 1;
        result = navDB.add_new(m)
        if result > 0: 
            counter_new = counter_new + 1
            url_nav_manifest = NAV_API_URL + 'manifests/'
            response = requests.post(url_nav_manifest, data={'name':m['nombre_pasajero'], 'sex':m['sexo'], 'resident':m['residente'], 
                                                        'nationality':m['nacionalidad'], 'documentId':m['codigo_pasajero'], 
                                                        'documentType':m['nombre_cod_documento'], 'reservationId':m['id_detalle_reserva'], 
                                                        'reservationStatus':1, 'ticketId':m['ticket'], 'originName':m['origen'], 
                                                        'destinationName':m['destino'], 'itinerary':itineraryObjectId}, headers={'Authorization':'Baerer ' + TOKEN_NAV})
            manifest_object_id = eval(response.content)['_id']
            navDB.updateObjectId(m, manifest_object_id)

    print "\t====> refId: %s , the number of new manifests at %s  are: %d" % (refId, port, counter_new)
    print "\t====> refId: %d , the number of processed manifests at %s are: %d" % (refId, port, counter)

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

        pp = pprint.PrettyPrinter(indent=4)
        
        itineraries = getItineraries(date)
        pp.pprint(itineraries)

        #print ''
        #print 'Getting Ports Associated to each itinerary'
        for keyword in itineraries:
            for itinerary in itineraries[keyword]:
                refId = itinerary["id_itinerario"]
                print "Processing manifest of the itinerary: %d " % (refId)
                
                navDB = nav_db()
                #if navDB.isClosedItinerary(refId):
                #    print "itinerary %d is already closed, no need to process it." % refId
                #    continue 
                #else: 
                #    print "itinerary %d is a valid itinerary." % refId
          
                itineraryStatus = getItineraryStatus(refId)
                print "The status of the itinerary %s is: %s" % (refId, str(itineraryStatus))
                if str(itineraryStatus) == 'False': 
                    print "itinerary %d is already closed, no need to process it." % refId
                    continue 
                else: 
                    print "itinerary %d is a valid itinerary." % refId


                navDB.connect(itinerary["id_itinerario"])
#                #reset the process status in order to find deleted manifests, which should be have the field 'processed' = 0 after the loop. 
#                navDB.reset_processing_status()
#
#                # POST itinerary
#                if do_post:
#                    itineraryObjectId = postItinerary(itinerary)
# 
#                # GET ports
#                ports = getPorts(itinerary["id_itinerario"])
#                print "Ports associated to the itinerary: %s, itinerary " % (itinerary["id_itinerario"])
#                print "itinerary : %s " % itineraryObjectId
#                pp.pprint(ports)
#
#                total_manifests = 0
#
#                #print 'Getting Initial Manifest Associated to each itinerary and port'
#                for port_id in ports:
#                    for p in ports[port_id]:
#                        print 'posting port: ' + p['nombre_ubicacion']
#                        # POST Port
#                        if do_post:
#                            postPort(p)
#                        
#                    for p in ports[port_id]:
#                        # POST Manifest
#                        manifest = getInitialManifest(itinerary["id_itinerario"], p['id_ubicacion'])
#                        print "\tThere are %d entries in the manifest of the itinerary: %s / port: %s " % (len(manifest['manifiesto_embarque']), itinerary["id_itinerario"], p['nombre_ubicacion'])
#                        total_manifests = total_manifests + len(manifest['manifiesto_embarque'])
#                        #pp.pprint(manifest)
#
#                        if do_post: 
#                            postManifest(manifest, refId, itineraryObjectId, p['nombre_ubicacion'])
#                        print "listo puerto %s" % (p['nombre_ubicacion']) 
#                        print ""
#
                navDB.remove_deleted_manifests()
#                print "==> Itinerary: %s, itinerary " % (itinerary["id_itinerario"])
#                print "==> Total number of received manifest %d" %  total_manifests 
#                print ""
#                print ""
#                print ""

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



  

