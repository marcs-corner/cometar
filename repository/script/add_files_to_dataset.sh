#!/bin/bash

conffile=$(dirname $0)/../config/conf.cfg
cleardata=false
directory=`dirname $0`
port=3030
silentmode=""
testmode=false
loadChangeFiles=false

while [ ! $# -eq 0 ]
do
	case "$1" in
		-t)
			port=3031
			testmode=true
			;;
		-d)	
			shift
			directory=$1
			;;
		-c)
			cleardata=true
			;;
		-s)
			silentmode="--silent"
			;;
		-h)
			loadChangeFiles=true
			;;
		-p)
			shift
			conffile=$1
			;;
	esac
	shift
done

source "$conffile"
EXITCODE=0

if $cleardata; then
	if $testmode; 
	then
		curl -X PUT -H "Content-Type: text/turtle;charset=utf-8" $silentmode -G "$FUSEKITESTDATASET/data" -d default --data ""
	else
  		curl -X PUT -H "Content-Type: text/turtle;charset=utf-8" $silentmode -G "$FUSEKILIVEDATASET/data" -d default --data ""
	fi
fi
if $testmode; then
	shopt -s nullglob
	while read line ; do
		filename=$line
		echo "Adding file $(basename "$filename")."
		STATUSCODE=$(curl -X POST -H "Content-Type: text/turtle;charset=utf-8" $silentmode -S --output /dev/stderr -w "%{http_code}" -T "$filename" -G "$FUSEKITESTDATASET/data" -d default) 
		if ! [ $STATUSCODE -ge 200 -a $STATUSCODE -lt 300 ]
		then
       		 	EXITCODE=1
		fi
	done < <(find "$directory" -iname '*.ttl')
	echo "Inserting rules"
	endpoint="$FUSEKITESTDATASET/update"
	curl -X POST -s -T "$CONFDIR/insertrules.ttl" -G "$endpoint"
else
	if $loadChangeFiles; then
		echo "Loading change files into live server."
		shopt -s nullglob
		while read line ; do
			filename=$line
			echo "Adding file $(basename "$filename")."
			STATUSCODE=$(curl -X POST -H "Content-Type: text/turtle;charset=utf-8" $silentmode -S --output /dev/stderr -w "%{http_code}" -T "$filename" -G "$FUSEKILIVEDATASET/data" -d default) 
			if ! [ $STATUSCODE -ge 200 -a $STATUSCODE -lt 300 ]
			then
					EXITCODE=1
			fi
		done < <(find "$CHANGESFILESDIR/output" -iname '*.ttl')
	else
		echo "Loading dataset into live server."
		STATUSCODE=$(curl -X POST -H "Content-Type: text/turtle;charset=utf-8" $silentmode -S --output /dev/stderr -w "%{http_code}" -T "$TEMPDIR/export.ttl" -G "$FUSEKILIVEDATASET/data" -d default)
		if ! [ $STATUSCODE -ge 200 -a $STATUSCODE -lt 300 ]
		then
		EXITCODE=1
		fi
	fi
fi

exit $EXITCODE
