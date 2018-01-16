Sample code to connect to TrackNet appx and pulling device data
===============================================================

This nodejs sample code connects to the TrackNet network server
and prints messages received from connected devices.

Requirements:
- node >= 6.11.3
- npm  >= 3.10.10


1) Install node packages.

In this directory, type:
$ npm install


2) Edit account.info to match your server/account information.

Required are INFOSURI, APISURI, OWNERID, TOKEN.


3) Get certificates/keys for your account. 

$ ./get-tls-certs.sh

This will use the REST API to to download certs/keys from the API server
and save them in the ./certs directory.

4) Run demo code:

$ node index.js


