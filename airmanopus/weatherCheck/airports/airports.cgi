#!/bin/bash
echo "Content-type: text/html"
airportIATA=`echo ${QUERY_STRING}`
echo "<div id=airport>$airportIATA</div>"

airportCheck="http://services.faa.gov/airport/status/${airportIATA}?format=application/xml"

echo $airportCheck

echo "</body></html>"



