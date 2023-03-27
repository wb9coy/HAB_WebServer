const app           = require('express')();
const HTTPserver    = require('http').Server(app);
const HTTPserverIO  = require('socket.io')(HTTPserver);
const WebSocket     = require('ws');
const FtpSvr 		    = require ( 'ftp-srv' );
const fs 			      = require('fs');
const path 			    = require('path');
var net             = require('net');
const nmea          = require('node-nmea')
const GPS           = require('./gps.js');
var Gallery         = require('express-photo-gallery');
var sleep           = require('sleep');
const { spawn }     = require('child_process');

const path_req = './pipe_req';
var fifoWs     = null;

var parser     = null;
//var GPSJSON    = null;
var HOST       = null;

var HOST_ADDR  = "my server IP address"

var HTTP_PORT  = 8080;
var GW_PORT    = 8081;

var FTP_CTL_ADDR      = "my server IP address"
var FTP_PORT          = 8082;
var FTP_PORT_PASV_MIN = 8083;
var FTP_PORT_PASV_MAX = 8110;

var gps        = new GPS;
var GPSCount   = 1;

var APRS_CALL      = "NOCALL-6"
var APRS_SYMBOL    = "I"
var APRS_Comment   = "Flight #00"
var APRS_UserName  = "NOCALL"
var APRS_Password  = "youraprs password"
var APRS_BeconTime = 1
var APRSclient     = new net.Socket();
var APRSLogin      = "user " + APRS_UserName + " pass " + APRS_Password + " vers 1.0" + "\n";

var APRS_ADDR      = "noam.aprs2.net"
var APRS_PORT      = 14580
var APRS_CONNECT   = 1
var APRS_CONNECTED = 0
var APRS_ALT       = 0

var TelemetryConnections = [];
var gatwwayConnections   = [];
var connTimerObjs        = [];
var rssiTimerObjs        = []; 

const gatewayServer = new WebSocket.Server({port: GW_PORT});
var GW_TIMEOUT     = 15000;
var RSSI_TIMEOUT   = 60000;

//const emitter = new EventEmitter();

var options = {
  title: 'HAB Image Viewer'
};


fs.mkdir(path.join(__dirname, 'logs'),
  { recursive: true }, (err) => {
    if (err) {
      return console.error(err);
    }
    console.log('Directory created logs successfully!');
  });

sleep.sleep(2)

fs.mkdir(path.join(__dirname, 'logs/images'),
  { recursive: true }, (err) => {
    if (err) {
      return console.error(err);
    }
    console.log('Directory created logs/images successfully!');
  });

sleep.sleep(4)

fs.mkdir(path.join(__dirname, 'logs/imageSeq'),
  { recursive: true }, (err) => {
    if (err) {
      return console.error(err);
    }
    console.log('Directory created logs/imageSeq successfully!');
  });

sleep.sleep(4)

if (fs.existsSync(path_req)) {
    fs.unlink(path_req, (err) => {
        if (err) {
            console.log(err);
        }
        console.log(path_req +" " + "deleted");
    })
}

let fifo_req   = spawn('mkfifo', [path_req]);

const ftpServer = new FtpSvr ({
	url:'ftp://' + HOST_ADDR + ':' + FTP_PORT ,
	pasv_url: FTP_CTL_ADDR,
	pasv_min:FTP_PORT_PASV_MIN,
	pasv_max:FTP_PORT_PASV_MAX,
	anonymous: false,
	greeting : [ "HAB FTP Server"]
});


connTimerObjs.push(setInterval(function(){connTimeout(1)},GW_TIMEOUT));
connTimerObjs.push(setInterval(function(){connTimeout(2)},GW_TIMEOUT));
connTimerObjs.push(setInterval(function(){connTimeout(3)},GW_TIMEOUT));
connTimerObjs.push(setInterval(function(){connTimeout(4)},GW_TIMEOUT));
connTimerObjs.push(setInterval(function(){connTimeout(5)},GW_TIMEOUT));
connTimerObjs.push(setInterval(function(){connTimeout(6)},GW_TIMEOUT));
connTimerObjs.push(setInterval(function(){connTimeout(7)},GW_TIMEOUT));
connTimerObjs.push(setInterval(function(){connTimeout(8)},GW_TIMEOUT));
connTimerObjs.push(setInterval(function(){connTimeout(9)},GW_TIMEOUT));
connTimerObjs.push(setInterval(function(){connTimeout(10)},GW_TIMEOUT));
connTimerObjs.push(setInterval(function(){connTimeout(11)},GW_TIMEOUT));

rssiTimerObjs.push(setInterval(function(){rssiTimeout(1)},RSSI_TIMEOUT));
rssiTimerObjs.push(setInterval(function(){rssiTimeout(2)},RSSI_TIMEOUT));
rssiTimerObjs.push(setInterval(function(){rssiTimeout(3)},RSSI_TIMEOUT));
rssiTimerObjs.push(setInterval(function(){rssiTimeout(4)},RSSI_TIMEOUT));
rssiTimerObjs.push(setInterval(function(){rssiTimeout(5)},RSSI_TIMEOUT));
rssiTimerObjs.push(setInterval(function(){rssiTimeout(6)},RSSI_TIMEOUT));
rssiTimerObjs.push(setInterval(function(){rssiTimeout(7)},RSSI_TIMEOUT));
rssiTimerObjs.push(setInterval(function(){rssiTimeout(8)},RSSI_TIMEOUT));
rssiTimerObjs.push(setInterval(function(){rssiTimeout(9)},RSSI_TIMEOUT));
rssiTimerObjs.push(setInterval(function(){rssiTimeout(10)},RSSI_TIMEOUT))
rssiTimerObjs.push(setInterval(function(){rssiTimeout(11)},RSSI_TIMEOUT))


function connTimeout(gw)
{
  for(i in TelemetryConnections)
  {
  	TelemetryConnections[i].emit("CONN_TIMEOUT",{ 'gw': gw.toString() });
  }
}

function rssiTimeout(gw)
{
  for(i in TelemetryConnections)
  {
  	TelemetryConnections[i].emit("RSSI_TIMEOUT",{ 'gw': gw.toString() });
  }
}

function reportToAPRS(GPSData)
{
  var APRS_lat      = null;
  var APES_lonlon   = null;
  var APRSmsg       = null;

  //console.log(GPSData);

  APRS_lat = nmea.APRSlat(GPSData);
  //console.log(APRS_lat);

  APRS_lng = nmea.APRSlng(GPSData);
  //console.log(APRS_lng);

  APRS_comment_to_send = "/A=" + APRS_ALT +" "+ APRS_Comment
  APRSmsg = APRS_CALL + ">APRS,TCPIP*:=" + APRS_lat + "/" + APRS_lng + APRS_SYMBOL + APRS_comment_to_send + "\n";
  //APRSmsg = APRS_CALL + ">APRS,TCPIP*:=3256.92N/11715.62W" + APRS_SYMBOL + APRS_Comment + "\n";
  //APRSmsg = APRS_CALL + ">APRS,TCPIP*:> Testing\n";
  console.log("Report To APRS " + APRSLogin+APRSmsg);

  if(APRS_CONNECTED == 1)
  {
  	APRSclient.write(APRSLogin+APRSmsg);
  }
}

function sendIntTempData(temp)
{
  for(i in TelemetryConnections)
  {
    if(temp != null)
    {
      TelemetryConnections[i].emit('INT_TEMP',{ 'temp': temp });
    }
  }
}

function sendExtTempData(temp)
{
  for(i in TelemetryConnections)
  {
    if(temp != null)
    {
      TelemetryConnections[i].emit('EXT_TEMP',{ 'temp': temp });
    }
  }
}

function sendHumData(hum)
{
  for(i in TelemetryConnections)
  {
    if(hum != null)
    {
      TelemetryConnections[i].emit('HUM',{ 'hum': hum });
    }
  }
}

function sendCallData(call)
{
  for(i in TelemetryConnections)
  {
    if(call != null)
    {
      TelemetryConnections[i].emit('CALL',{ 'call': call });
    }
  }
}

function sendPresData(pres)
{
  for(i in TelemetryConnections)
  {
    if(pres != null)
    {
      TelemetryConnections[i].emit('PRES',{ 'pres': pres });
    }
  }
}

function sendHumData(hum)
{
  for(i in TelemetryConnections)
  {
    if(hum != null)
    {
      TelemetryConnections[i].emit('HUM',{ 'hum': hum });
    }
  }
}

function sendBattData(batt)
{
  for(i in TelemetryConnections)
  {
    if(batt != null)
    {
      TelemetryConnections[i].emit('BATT',{ 'batt': batt });
    }
  }
}

function processRSSIMsg(gw_rssi)
{
	splitMessage = gw_rssi.split(' ')
	if(splitMessage[0] != null)
	{
		for(i in TelemetryConnections)
  		{
    		if(splitMessage[1] != null)
    		{
      			TelemetryConnections[i].emit("RSSI",{ 'gw':splitMessage[0],
      												  'rssi':splitMessage[1]});
    		}
  		}
  		gwID = parseInt(splitMessage[0])
  		rssiTimerObjs[gwID-1].refresh();
	}
}

function processPingMsg(gw)
{
  for(i in TelemetryConnections)
  {
    if(gw != null)
    {
      TelemetryConnections[i].emit("PING",{ 'gw': gw });
    }
  }

  gwID = parseInt(gw)
  connTimerObjs[gwID-1].refresh();

}

function sendTelemetry(GPSJSON)
{
  for(i in TelemetryConnections)
  {
    if(GPSJSON != null)
    {
      TelemetryConnections[i].emit('GPS',GPSJSON);
      //console.log(GPSJSON);
    }
  }

  if(GPSJSON.type == "GGA")
  {
    APRS_ALT = Math.round(GPSJSON.alt*3.28);
    //console.log(APRS_ALT);
  }

  if(GPSJSON.type == "RMC")
  {

    if(GPSJSON.status == 'active')
    {
		if(APRS_CONNECT == 1)
		{
			APRS_CONNECT = 0;
			APRSclient.connect(APRS_PORT, APRS_ADDR, function() {
				console.log('************************* Connected to ' + APRS_ADDR + " **************************");
			});
		}

	    if((GPSCount % APRS_BeconTime) == 0)
	    {

	        reportToAPRS(GPSJSON);
	    }
    }

    GPSCount = GPSCount + 1;
  }
  //console.log(GPSJSON);
}

fifo_req.on('exit', function(status) {
    console.log('Created Req Pipe');

    fifoWs = fs.createWriteStream(path_req);

    console.log('JS fs.createWriteStream(path_req)')

    console.log("Js Start Python");
    const pyProg = spawn('./imageSeqFileManager.sh', ['']);
    pyProg.stdout.on('data', function(data) {
    console.log(data.toString());
    });

});


APRSclient.on('data', function(data) {
	console.log('Server Says : ' + data);
	APRS_CONNECTED = 1
});

APRSclient.on('error', function (err) {
	console.error("error", err);
	APRS_CONNECT   = 1
	APRS_CONNECTED = 0
});

HTTPserverIO.on('connection', function (socket) 
{
	socket.on('error',console.error);
	
    console.log("*************** Web Browser Connect ***********" +TelemetryConnections.length);

    TelemetryConnections.push(socket);

    socket.on('disconnect', function()
    {
      TelemetryConnections.splice(TelemetryConnections.indexOf(socket),1);
      console.log("***************  Web Browser Disconnect ***********" +TelemetryConnections.length);
    });
});

gatewayServer.on('connection', function (gatewayClient) 
{
	gatewayClient.on('error',console.error);

  var strMessage   = ""
  var splitMessage = ""

    console.log("*************** Gateway Client Connect ***********" +gatwwayConnections.length);

    gatwwayConnections.push(gatewayClient);

    gatewayClient.on('message', function (message) 
    {
        console.log("*************** Gateway Data ***********"+ message);

        strMessage   = message.toString()
        splitMessage = strMessage.split('$G')
        if(splitMessage[0] == '')
        {
          try 
          {
            if (!gps.update(message+'\n'+'\r'))
            {
              console.log("Error with GPS update" + message);
            }
          }
          catch(e)
          {
            console.log(e);
          }
        }
        else
        {
          splitMessage = strMessage.split('$INT_TEMP')
          if(splitMessage[0] == '')
          {
          	sendIntTempData(splitMessage[1])
          }
          else
          {
            splitMessage = strMessage.split('$EXT_TEMP')
            if(splitMessage[0] == '')
            {
          	  sendExtTempData(splitMessage[1])
            }
            else
            {
          	  splitMessage = strMessage.split('$CALL')
              if(splitMessage[0] == '')
              {
                sendCallData(splitMessage[1])
              }
              else
              {
                splitMessage = strMessage.split('$PRES')
                if(splitMessage[0] == '')
                {
                  sendPresData(splitMessage[1])
                }
                else
                {
                  splitMessage = strMessage.split('$HUM')
                  if(splitMessage[0] == '')
                  {
                    sendHumData(splitMessage[1])
                  }
                  else
                  {
              	    splitMessage = strMessage.split('$BATT')
  	                if(splitMessage[0] == '')
  	                {
  	                  sendBattData(splitMessage[1])
  	                }
                    else
                    {
                      splitMessage = strMessage.split('$RSSI_GW')
                      if(splitMessage[0] == '')
                      {
                        processRSSIMsg(splitMessage[1])
                      }
                      else
                      {
                  	    splitMessage = strMessage.split('$PING_GW')
                  	    if(splitMessage[0] == '')
                  	    {
                    	  processPingMsg(splitMessage[1])
                        }
                      }
                  	}
                  }
              	}
              }
          	}
          }
        }
    });

    gatewayClient.on('close', function()
    {
      gatwwayConnections.splice(gatwwayConnections.indexOf(gatewayClient),1);
      console.log("***************  Gateway Client Close ***********" +gatwwayConnections.length);
    });
});

gps.on('data', function(data) 
{

    // GPSJSON = data;
    // console.log(GPSJSON);
    // console.log('');
    sendTelemetry(data);

});

app.get('/', function (req, res) 
{
   res.sendFile(__dirname +'/index.html')
});

app.use('/images', Gallery('logs/images', options));

ftpServer.on('login', ({connection, username, password}, resolve, reject) => 
{
  if(username === "sonde" && password === "sonde"){
       // call resolve 
       resolve({root: 'logs/imageSeq'});
   }
   else
   {
      // if password and username are incorrectly then call reject
       reject({});
   }

  connection.on('STOR', (error, fileName) => 
    {
      console.log("***************  STOR ***********" + fileName);
      fifoWs.write(fileName)
      console.log("Wrote to fifoWs")
    });
});

/* serves all the static files */
 app.get(/^(.+)$/, function(req, res)
 { 
     res.sendFile( __dirname + req.params[0]); 
 });

var server = HTTPserver.listen(HTTP_PORT,HOST_ADDR, function () 
{

  HOST = server.address().address;

  console.log("listening at http://%s:%s", HOST, HTTP_PORT);
});


ftpServer.listen()
    .then(() =>
    {
        console.log ( `Server Running at ftp://${HOST_ADDR}:${FTP_PORT}` );
    }); 

// var gateway = HTTPserver.listen(GW_PORT,HTTP_ADDR, function () 
// {

//   GW = server.address().address;

//   console.log("listening at http://%s:%s", GW, GW_PORT);
// });

if(process.argv[2] != null)
{
	//GPSPort = process.argv[2];
}
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Sonde Server terminated')
  })
})
