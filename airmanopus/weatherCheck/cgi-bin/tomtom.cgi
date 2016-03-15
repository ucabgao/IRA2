#!/bin/bash
echo "Content-type: text/html"
echo ""
incoming=`echo ${QUERY_STRING}`
curl --silent "$incoming"
