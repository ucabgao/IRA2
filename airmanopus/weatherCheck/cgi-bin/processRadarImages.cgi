#!/bin/bash

cd /home/opus/airmanopus.net/weathercheck/images/radar/

# first chop out the state abbrev, then check the state abbrev to make sure its a state


# now verify against the official list of radar sites
stateRadarSites=`cat /home/opus/airmanopus.net/weathercheck/kml/nexrad_siteid_state.txt | cut -b 1-3`

# the format of the radar image filename we want doesn't change, so we add '_NCR_0.gif' to get the full filename
# ie, MKX_NCR_0.gif
suffix="_NCR_0.gif"

declare -i radarImageSize

for site in $stateRadarSites; do

	radarImage=$site$suffix

	rm $radarImage	

	wget --no-cache -N -q "http://radar.weather.gov/ridge/RadarImg/NCR/$radarImage"
	
	# if the image size is less than 1k we treat it as invalid and skip it
	radarImageSize=`stat -c '%s' $radarImage`

	if [ $radarImageSize -le 980 ]
		then
			# the site we got the image from didnt send a proper image so just ignore that site
			# adjacent radar sites will cover that stations range
			cp --preserve --remove-destination ./transparent.gif /home/opus/airmanopus.net/weathercheck/images/processed/$radarImage
			echo $radarImage >> radar.log
			
	
		else
			/usr/bin/perl /home/opus/airmanopus.net/cgi-bin/noaadenoise.pl -i $radarImage -o /home/opus/airmanopus.net/weathercheck/images/processed/$radarImage -f 40 -x 
	fi
	
	

done
