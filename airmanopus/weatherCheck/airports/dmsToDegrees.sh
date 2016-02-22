#!/bin/bash

# convert the coordinates for the airport from dms to decimal degrees

dmsCoords=`cat airportlist.csv | grep --only-matching  '[0-9][0-9]-[0-9][0-9]-[0-9][0-9]\.[0-9][0-9][0-9][0-9][N]\,[0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]\.[0-9][0-9][0-9][0-9][W]'`

for i in $dmsCoords; do

	degreesLatitude=`echo $i | cut -b 1-2`
	minutesLatitude=`echo $i | cut -b 4-5`
	secondsLatitude=`echo $i | cut -b 7-12`

	decimalDegreesLatitude=`echo $degreesLatitude`	
	decimalMinutesLatitude=$(echo "scale=3; ($minutesLatitude / 60)" | bc)
	decimalSecondsLatitude=$(echo "scale=3; ($secondsLatitude / 3600)" | bc)
	decimalLatitude=$(echo "scale=3; $decimalDegreesLatitude + $decimalMinutesLatitude + $decimalSecondsLatitude" | bc)

	degreesLongitude=`echo $i | cut -b 16-18`
        minutesLongitude=`echo $i | cut -b 20-21`
        secondsLongitude=`echo $i | cut -b 23-26`
        
        decimalDegreesLongitude=`echo $degreesLongitude`
        decimalMinutesLongitude=$(echo "scale=3; ($minutesLongitude / 60)" | bc)
        decimalSecondsLongitude=$(echo "scale=3; ($secondsLongitude / 3600)" | bc)
        decimalLongitude=$(echo "scale=3; $decimalDegreesLongitude + $decimalMinutesLongitude + $decimalSecondsLongitude" | bc)
	
	echo "\"$decimalLatitude\",\"-$decimalLongitude\""

done

