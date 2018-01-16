const WebSocket = require('ws');
var fs = require('fs');


// The following code reads first configuration data from 'account.info'.
// It then connects to the info server to retrieve the URIs of the
// appx endpoints. The appx endpoints are the web socket endpoints
// where the communication with devices of an account takes place.
// Device data is pulled from the appx, messages can also be sent
// down. See the API spec for the protocol details.




// The URI of the info server which tells us the endpoints were we can pull data.
var INFOSURI = null;

// Our owner ID. This ID is also shown in the account information.
var OWNERID  = null;

// The URI of the api server for REST calls. Not used in this sample.
var APISURI = null;

// Token to present in REST calls. Not used in this sample.
var TOKEN  = null;



// A map of the URI of the appx endpoints to AppxClient instances.
// These instances receive the traffic of devices.
// In large installations, multiple AppxClient instances
// could be necessary for an account owner.
var appxuri2client = {};




// Read account.info and set the global variables OWNERID and INFOSURI.
var readAccountInfo = function() {
    var s = fs.readFileSync('account.info', 'utf8');
    var sa = s.split(/\s*\r?\n\s*/);
    var res = {};
    sa.forEach((s) => {
	if (s && !s.startsWith('#')) {
	    var tuple = s.split(/\s*=\s*/);
	    if (tuple.length != 2) {
		throw "Invalid line in account.info: '" + s + "'";
	    }
	    res[tuple[0]] = tuple[1];
	}
    });
    if (!res.INFOSURI) {
	throw "Missing 'INFOSURI' in account.info.";
    }
    INFOSURI = res.INFOSURI;
    if (!res.APISURI) {
	throw "Missing 'APISURI' in account.info.";
    }
    APISURI = res.APISURI;
    if (!res.TOKEN) {
	throw "Missing 'TOKEN' in account.info.";
    }
    TOKEN = res.TOKEN;
    if (!res.OWNERID) {
	throw "Missing 'OWNERID' in account.info.";
    }
    OWNERID = res.OWNERID;
};

readAccountInfo();




// WebSocket options for the TLS setup
var WSS_OPTIONS = {
    ca: [
        fs.readFileSync('certs/trust.crt')
    ],
    key: fs.readFileSync('certs/' + OWNERID + '.key'),
    cert: fs.readFileSync('certs/' + OWNERID + '.crt')
};






//
// Client connection to an appx receiving device data through a web socket.
//
class AppxClient {
    constructor(appxuri, appxinfo) {
        this.appxuri = appxuri;
        this.appxinfo = appxinfo;
        this.ws = new WebSocket(appxuri, WSS_OPTIONS);
        this.ws.on('message', this.onMessage.bind(this));
	this.ws.on('open', this.onOpen.bind(this));
	this.ws.on('close', this.onClose.bind(this));
    }

    
    onOpen() {
	console.log('AppxClient: connection established.');
    }

    onClose() {
	console.log('AppxClient: connection closed.');
    }

    
    onMessage(data) {
        console.log('AppxClient: received message: ' + data);
        var msg = JSON.parse(data);
        // Each message carries a 'msgtype'. See Backend API spec for more information.
        var msgtype = msg.msgtype;
        switch(msgtype) {
        case 'joining':
            this.onJoining(msg);
            break;
        case 'updf':
            this.onUpdf(msg);
            break;
        case 'upinfo':
            this.onUpinfo(msg);
            break;
        }
    }

    onJoining(msg) {
        // e.g. record device as known/joined device.
        console.log('AppxClient: joining message: ' + msg.DevEui);
        // ...
    }

    onUpdf(msg) {
        // e.g. a device up message was received. this is sent after the message
        // was picked up by the first gateway has forwarded it.
        console.log('AppxClient: updf message: ' + msg.DevEui);
        // ...
    }

    onUpinfo(msg) {
        // e.g. a device up message was received. this is sent after the server
        // has waited for more gateways to report this message
        console.log('AppxClient: upinfo message: ' + msg.DevEui);
        // ...
    }
}





//
// Ask the info server for the endpoints where we can pull
// device data (these are called appx). In bigger systems,
// there can be many appx where we can get device data from,
// in our case, it is just one appx.
// After we have the URIs of these appx endpoints, we create
// AppxClient instances. They connect and pull the device data.
//
var getAppxWSUri = (callback) => {
    console.log("getAppxWSUri: connecting to info server " + INFOSURI);
    var uri = INFOSURI + "/owner-info";
    const ws = new WebSocket(uri, WSS_OPTIONS);
    ws.on('open', function open() {
        // Ask the infor server for our appx endpoints.
        console.log("getAppxWSUri: connection established, asking info server for endpoints.");
        ws.send(JSON.stringify({ owner: OWNERID }));
    });
    ws.on('message', function incoming(data) {
        console.log('getAppxWSUri: received response from info server:' + data);
        console.log(data);
        var info = JSON.parse(data);
        var appx_list = info.appx_list;
        // There is probably only one appx in a test/demo server setup.
        if (appx_list.length > 1) {
            console.log('INFO: connecting multiple appx endpoint.');
        }
        // Take the appx infos from this list and create client connections.
        appx_list.forEach((appxinfo) => {
            appxuri2client[appxinfo.uri] = new AppxClient(appxinfo.uri, appxinfo);
        });

	// closing connection to info server, not required anymore.
	console.log("getAppxWSUri: closing info server connection.");
	ws.close();
    });
};





var main = () => {
    getAppxWSUri(() => {
        console.log('main: appx connections are up.');
    });
};

main();
