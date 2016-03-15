#!/bin/bash 
echo "Content-type: text/html"
echo ""
echo "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Transitional//EN\" \"http:\\www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd\">"
echo "<html>"
echo "<head>"
echo "<meta http-equiv=\"Content-type\" content=\"text/html; charset=utf-8\">"
echo "<meta name=\"viewport\" content=\"initial-scale=1.0, maximum-scale=2.0, user-scalable=yes\" />"
echo "<link href='https:\/\/fonts.googleapis.com\/css?family=Droid+Sans+Mono' rel='stylesheet' type='text\/css'>"

echo "<title>WeatherCheck</title>"
echo "</head>"
echo "<body>"

# we are not interacting with Google Maps on forecast.weather.gov/MapClick.php or jQuery *at all*
# our location is passed in via argument

# we need lat= , lon=
location=`echo ${QUERY_STRING}`

# querystring format is:  lat=43.071342719686626&lon=-89.4073979305899
lat1=`echo ${location} | grep --only-matching 'lat\=[+|-|0-9][0-9][0-9|.][+|-|0-9][0-9|$]*[^\&]' | sed 's/lat=//g'`
lon1=`echo ${location} | grep --only-matching 'lon\=.*' | sed 's/lon=//g'`

# round to format -89.407398; displaying more sig digits than that is a bit extreme   
lat=`printf "%'5f\n" ${lat1}`   
lon=`printf "%'5f\n" ${lon1}`   

# use lynx to pull down the page from forecast.weather.gov
# we need to make sure our site has lynx available 
command -v lynx >/dev/null 2>&1 || { echo "There has been an error." >&2; exit 1; }
lynxLocation=`command -v lynx`

# storage for the forecast page; we only use it once so we only have to download it once
forecastDir=`mktemp -d -t forecastpage.$$.XXXXXXXXX`

# download the forecast page
weatherIn=`$lynxLocation -source -noreferer -useragent="Mozilla/5.0 (WeatherCheck/UW-Madison CS Undergrad Projects Lab github.com/airmanopus/weathercheck)"   "http://forecast.weather.gov/MapClick.php?lat=${lat}&lon=${lon}" > ${forecastDir}/forecastpage.html` 

# we might be n miles from somewhere instead of in a particular city
city=`cat ${forecastDir}/forecastpage.html | grep --only-matching '<h1>.*</h1>' | sed '1d' | sed '2d' | sed 's/[<h1>|<\/h1>]//g'`

# current conditions 
#conditions=`cat ${forecastDir}/forecastpage.html | grep --only-matching "<p class=\"myforecast-current\">*<\/p>" | cut -b 31- | sed 's/<\/p>//g'`
conditions=`cat ${forecastDir}/forecastpage.html |  grep --only-matching '<p class=\"myforecast-current\">[ |a-z|A-Z|/]*' | cut -b 31-`

temperature=`cat ${forecastDir}/forecastpage.html | grep --only-matching 'myforecast-current-lrg">.*</p>' | cut -b 25-60 | grep --only-matching '.*</p>' | sed 's/<\/p>//g'`
 

# if there are one or more product titles that contain the words in effect we need to process the product name for those links a bit diff
ineffect=`cat ${forecastDir}/forecastpage.html | grep "in effect"`

# filter out the links to products on the page. if this results in an empty string, there are no active products
# also add http://forecast.weather.gov to start of each link so we actually get there
linksIn=`cat ${forecastDir}/forecastpage.html | grep --only-matching "showsigwx.php?warnzone=[A-Z][A-Z][A-Z][0-9][0-9][0-9]&warncounty=[A-Z][A-Z][A-Z][0-9][0-9][0-9]&firewxzone=[A-Z][A-Z][A-Z][0-9][0-9][0-9]&local[_]place1=&product1=[A-Z|a-z]\+[+|A-Z|a-z]\++[A-Z|a-z]\+[A-Z|a-z|http]" | sed 's/showsigwx/http:\/\/forecast.weather.gov\/showsigwx/g'`

# pull the text of the current forecast
forecast=`cat ${forecastDir}/forecastpage.html | awk '/\"point-forecast-7-day\"/,/\"row-odd\"/' | sed 's/<[^>]*>//g'`

echo "<div id=forecast class=textforecast>"
echo "Your Coordinates: $lat,$lon<br>"
echo "Conditions at $city<br>" 
echo "Currently: $conditions and $temperature"

echo "<p>$forecast</p>"
echo "</div>"
echo "<div id=products>"
if [ -z $linksIn ]; then 
	echo "<p style='color: white; background: green; font-weight: bold; font-family:'Droid Sans Mono',sans-serif'>All clear</p>" 
else
	echo "<p style='color: white; background: red; font-weight: bold; font-family:'Droid Sans Mono',sans-serif'>Active weather alerts</p><div>"
	# we need the links separated from each other and cleaned up so we can find the right products	
	OIFS=$IFS
	IFS='^'
	
	# add a line break after each a href
	# inserting a ^ gives us a char to use as a field separator	
	links=`echo $linksIn | sed 's/http/\^http/g'`
	linksArray=$links
	for m in $linksArray
	do	
		productNameEncoded=`echo $m | cut -b 118-` 
		productName=`echo $m | cut -b 118- | sed 's/\+/ /g'`
		productNameUpper=`echo -n ${productName} | tr [:lower:] [:upper:]`
		productURL=`echo $m | sed 's/\">.*//g'`
		productText=`$lynxLocation --force-html -nolist -nolog -nonumbers -dump "$productURL" | sed "1,/$productNameUpper/d" | sed '/\$\$/q'`
		echo "<div id='${productNameEncoded}' style='color: red; background: white'>$productName</div>"
		echo "<div id='productText' style='textproducttext'>$productText</div>"
		echo "<br>"
	done
fi

echo "</div>"
echo "</body>"
echo "</html>"  
