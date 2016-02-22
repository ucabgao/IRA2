#!/bin/bash
echo "Content-type: text/html"
echo ""
incoming=`echo ${QUERY_STRING}`
# querystring format is:  lat=43.071342719686626&lon=-89.4073979305899
lat=`echo ${location} | grep --only-matching 'lat\=[+|-|0-9][0-9][0-9|.][+|-|0-9][0-9|$]*[^\&]' | sed 's/lat=//g'`
lon=`echo ${location} | grep --only-matching 'lon\=.*' | sed 's/lon=//g'`
command -v lynx >/dev/null 2>&1 || { echo "There has been an error." >&2; exit 1; }

weatherURL="https://api.worldweatheronline.com/free/v1/weather.ashx?q=${lat},${lon}&format=json&extra=isDayTime&num_of_days=1&includelocation=yes&key=kc2u593rw3h5bp2pga7fs7ut"

weatherIn=`/usr/bin/curl --silent --user-agent "Mozilla/5.0 (Lynx/WeatherCheck/UW-Madison CS Undergrad Projects Lab github.com/airmanopus/weathercheck)" ${weatherURL}` 

echo ${weatherIn}
