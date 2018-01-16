#!/bin/bash

if [ ! -f account.info ]; then
    echo Missing \'account.info\' file.
    exit 1
fi

. ./account.info

if [ -z $OWNERID ] || [ -z $APISURI ] || [ -z $TOKEN ] ; then
    echo Missing OWNERID, TOKEN or APISURI in account.info.
    exit 1
fi

mkdir -p certs

rm -rf certs/*

curl --header "Authorization: $TOKEN" "$APISURI/api/gettlssetup?entity=$OWNERID&days=1825" -o ./certs/owner-pki.zip

(cd certs && unzip ./owner-pki.zip)
