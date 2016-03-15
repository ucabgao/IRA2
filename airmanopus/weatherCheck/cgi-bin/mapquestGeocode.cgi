#!/bin/bash
echo "Content-type: text/html"
echo ""

# we need lat= , lon=
location=`echo ${QUERY_STRING}`

# querystring format is:  lat=43.071342719686626&lon=-89.4073979305899
lat1=`echo ${location} | grep --only-matching 'lat\=[+|-|0-9][0-9][0-9|.][+|-|0-9][0-9|$]*[^\&]' | sed 's/lat=//g'`
lon1=`echo ${location} | grep --only-matching 'lon\=.*' | sed 's/lon=//g'`

# round to format -89.407398; displaying more sig digits than that is a bit extreme   
lat=`printf "%'4f\n" ${lat1}`   
lon=`printf "%'4f\n" ${lon1}` 

# use lynx to pull down the page from forecast.weather.gov
# we need to make sure our site has lynx available 
command -v curl >/dev/null 2>&1 || { echo "There has been an error." >&2; exit 1; }
curlLocation=`command -v curl`
geocode1="https://www.mapquestapi.com/geocoding/v1/reverse?key=Fmjtd%7Cluubnu0yng%2C7s%3Do5-9u1wh4&callback=renderReverse&location="
geocode2="&callback=renderGeocode"
jsonGeocode=`$curlLocation --silent $geocode1$lat,$lon$geocode2 | grep --only-matching 'adminArea3\":\"[A-Z][A-Z]' | cut -b 14-`
{"id": "Open"}
echo "{\"state\": \"$jsonGeocode\"}"
