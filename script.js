var lat;
var lon;
var status;
var sensorSocket = io.connect(document.location.host);
var firstTime = 1;

function UpdateGPSData(GPSData)
{
  if(GPSData != null)
  {
    if(GPSData.type == "GGA")
    {
      lat = GPSData.lat;
      lon = GPSData.lon;

      document.getElementById("GPSTimeID").innerHTML  = GPSData.time;
      document.getElementById("latID").innerHTML      = parseFloat(GPSData.lat).toFixed(4);
      document.getElementById("lonID").innerHTML      = parseFloat(GPSData.lon).toFixed(4);
      document.getElementById("altID").innerHTML      = Math.round(GPSData.alt*3.28);
      document.getElementById("SatellitesID").innerHTML   = GPSData.satelites;
      document.getElementById("textareaID").innerHTML   += GPSData.raw;
    }

    if(GPSData.type == "RMC")
    {
      document.getElementById("speedID").innerHTML    = Math.round(GPSData.speed*1.15077845);
      document.getElementById("statusID").innerHTML   = GPSData.status;
      status = GPSData.status;
    }

    if(GPSData.raw != null)
    {
      if(firstTime == 1)
      {
        firstTime = 0;
        document.getElementById("textareaID").innerHTML = "";
      }
      else
      {
        document.getElementById("textareaID").innerHTML   += GPSData.raw;
      }
    }
  }
}

sensorSocket.on('GPS', function(data)
{
  UpdateGPSData(data);
});

sensorSocket.on('INT_TEMP', function(data)
{
  document.getElementById("IntTemperatureID").innerHTML = data.temp;
});

sensorSocket.on('EXT_TEMP', function(data)
{
  document.getElementById("ExtTemperatureID").innerHTML = data.temp;
});

sensorSocket.on('CALL', function(data)
{
    document.getElementById("callID").innerHTML     = data.call;
});

sensorSocket.on('HUM', function(data)
{
  document.getElementById("HumidityID").innerHTML    = data.hum;
});

sensorSocket.on('PRES', function(data)
{
  document.getElementById("PressureID").innerHTML    = data.pres;
});

sensorSocket.on('BATT', function(data)
{
  document.getElementById("BatteryID").innerHTML    = data.batt;
});

sensorSocket.on('CONN_TIMEOUT', function(data)
{
  labelID = "rssiGW" + data.gw + "Label"
  rssiID  = "rssiGW" + data.gw
  document.getElementById(labelID).style.color = "White"
  document.getElementById(rssiID).innerHTML   = "";
});

sensorSocket.on('RSSI_TIMEOUT', function(data)
{
  labelID = "rssiGW" + data.gw + "Label"
  rssiID  = "rssiGW" + data.gw
  document.getElementById(rssiID).innerHTML   = "";
});

sensorSocket.on('PING', function(data)
{
  labelID = "rssiGW" + data.gw + "Label"
  document.getElementById(labelID).style.color = "Green"
});

sensorSocket.on('RSSI', function(data)
{
  labelID = "rssiGW" + data.gw + "Label"
  rssiID  = "rssiGW" + data.gw
  document.getElementById(labelID).style.color = "Green"
  document.getElementById(rssiID).innerHTML    = data.rssi;
});

function myMap() 
{
  var map;
  var myLatLng;
  var marker;
  if(status == "active")
  {
    myLatLng = new google.maps.LatLng(lat,lon);
    var mapOptions = {center: myLatLng, zoom: 18};
    var map = new google.maps.Map(document.getElementById("map"), mapOptions);

  	var marker = new google.maps.Marker({
  	  position: myLatLng,
  	  map: map,
  	  title: 'Mount Carmel High Demo'
  	});

  }
  else
  {
    document.getElementById("map").innerHTML   = "GPS Not Valid";
  }
}

function sendAPRS() 
{
  if(status == "active")
  {
    document.getElementById("map").innerHTML   = "Updating APRS with our GPS position";
    window.open("https://aprs.fi/#!mt=roadmap&z=11&call=a%2FWB9COY-6",'_blank');
  }
  else
  {
    document.getElementById("map").innerHTML   = "GPS Not Valid";
  }
}

function displayImages() 
{
  window.open("/images");
} 

