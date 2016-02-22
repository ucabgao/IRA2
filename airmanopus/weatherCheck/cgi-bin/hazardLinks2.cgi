#!/bin/bash 
echo "Content-type: text/html"
echo ""
#echo "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Transitional//EN\" \"http:\\www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd\">"
#echo "<html>"
#echo "<head>"
#echo "<meta http-equiv=\"Content-type\" content=\"text/html; charset=utf-8\">"
#echo "<meta name=\"viewport\" content=\"initial-scale=1.0, maximum-scale=2.0, user-scalable=yes\" />"
#echo "<link href='https:\/\/fonts.googleapis.com\/css?family=Droid+Sans+Mono' rel='stylesheet' type='text\/css'>"
#echo "<title>WeatherCheck</title>"
#echo "</head>"
#echo "<body>"

# we need lat= , lon=
location=`echo ${QUERY_STRING}`

# querystring format is:  lat=43.071342719686626&lon=-89.4073979305899
lat1=`echo ${location} | grep --only-matching 'lat\=[+|-|0-9][0-9][0-9|.][+|-|0-9][0-9|$]*[^\&]' | sed 's/lat=//g'`
lon1=`echo ${location} | grep --only-matching 'lon\=.*' | sed 's/lon=//g'`

# round to format -89.407398   
lat=`printf "%'5f\n" ${lat1}`   
lon=`printf "%'5f\n" ${lon1}`   

# use lynx to pull down the page from forecast.weather.gov
# we need to make sure our site has lynx available 
command -v lynx >/dev/null 2>&1 || { echo "There has been an error." >&2; exit 1; }
lynxLocation=`command -v lynx`

# storage for the forecast page; we only use it once so we only have to download it once
forecastDir=`mktemp -d -t forecastpage.$$.XXXXXXXXX`

# download the forecast page
weatherIn=`$lynxLocation -source -noreferer -useragent="Mozilla/5.0 (WeatherCheck/UW-Madison CS UPL github.com/airmanopus/weathercheck)" "http://forecast.weather.gov/MapClick.php?lat=${lat}&lon=${lon}" > ${forecastDir}/forecastpage.html`

city=`cat ${forecastDir}/forecastpage.html | grep --only-matching '<h1>.*</h1>' | sed '1d' | sed '2d' | sed 's/[<h1>|<\/h1>]//g'`

location=`cat ${forecastDir}/forecastpage.html | grep --only-matching "three-fifth-first\"><h1>.*</h1><h2>" | tail -n +2 | sed 's/<\/h1>//g'`
 
# filter out the links to products on the page. if this results in an empty string, there are no active products
# also add http://forecast.weather.gov to start of each link so we actually get there

# the result is that each hazardous weather product link is in its own separate file
# we ignore xaa as it will always be empty, and worry about xab, xac etc
cd $forecastDir
cat forecastpage.html | grep --only-matching "showsigwx.php?warnzone=[A-Z][A-Z][A-Z][0-9][0-9][0-9]&warncounty=[A-Z][A-Z][A-Z][0-9][0-9][0-9]&firewxzone=[A-Z][A-Z][A-Z][0-9][0-9][0-9]&local_place1=Madison WI&product1=\w.*\w&lat=[0-9][0-9]\.[0-9][0-9][0-9][0-9][0-9]&lon=[-][0-9][0-9]\.[0-9][0-9][0-9][0-9][0-9]" | sed 's/showsigwx.php/http:\/\/forecast.weather.gov\/showsigwx.php/g' | sed 's/<li>//g' | sed 's/<\/li>//g' | sed 's/http/\^http/g' |  tr -s '^' '\n' | split -l 1

# list of the x__ files minus the xaa that we dont care about
linksListing=`ls -l x* | cut -b 43- | tail -n +2`
linksCount=`echo $linksListing | wc -l`
#echo "Reference point: ${location}<br>"
for urlFile in $linksListing
do
	productURL=`cat $urlFile | lynx -stdin --force-html --nolog --nolist -dump | tr '\n' ' ' | sed 's/ //g'`
	productText=`$lynxLocation --force-html -nolist -nolog -nonumbers -dump "$productURL" | sed 's/[A-Z][a-z]//g' | sed 's/NWS//g' |sed 's/[a-z].*//g' | sed 's/\_//g' | sed '/\$\$/q'`
	echo "<div id='productText' style='alerts-text'><p>$productText</p></div>"
	echo "<br>"
done

#echo "</div>"
#echo "</body>"
#echo "</html>"  
