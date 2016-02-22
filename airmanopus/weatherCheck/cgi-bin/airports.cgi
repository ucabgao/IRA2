#!/bin/bash 
echo "Content-type: text/html"
echo ""
incoming=`echo ${QUERY_STRING}`
# ?iata=ORD
iata=`echo ${incoming} | cut -b 6-9`
# iata is the three letter code for a particular airport
url="https://services.faa.gov/airport/status/${iata}?format=application/json"
curl --user-agent "Mozilla/5.0 (airmanopus.net)" --url "${url}"



