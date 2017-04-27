import requests
import json
import sys
from StringIO import StringIO
import getopt
import pprint

TOKEN = '860a2e8f6b125e4c7b9bc83709a0ac1ddac9d40f'

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

    #print 'URL:', url_imaginex_manifest
    #print manifest

    return manifest
