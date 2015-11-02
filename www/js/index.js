/* global five,BleSerialPort */
'use strict';

function initControls() {
  console.log('initialize arm controls');
  var controlsElem = document.getElementById('controls');

  var bsp;
  if (window.cordova) {
    if (window.cordova.platformId == 'ios') {
      bsp = new BleSerialPort({address: CONFIG.DEVICE_ADDRESS_IOS});
    } else {
      bsp = new BleSerialPort({address: CONFIG.DEVICE_ADDRESS});
    }
  }
  //This is for testing in the browser
  else {
    var socket = io(CONFIG.SOCKET_IO_SERVER);

    bsp = new SocketIoSerialPort({
      client: socket,
      device: {   //put your device channel/address here
        channel: 'ble',
        name: CONFIG.DEVICE_NAME,
        address: CONFIG.DEVICE_ADDRESS
      }
    });
  }

  function acc2deg(acc) {
    if (acc < 1.8) {
      acc = 1.8;
    } else if (acc > 7.8) {
      acc = 7.8;
    }
    return (acc - 2.4) / 6.0 * 90.0 + 45.0;
  }

  bsp.connect().then(function() {
    console.log('BSP connected');
    var board = new five.Board({port: bsp, repl: false});
    board.on('ready', function() {
      console.log('Arduino connected!');
      controlsElem.style.background = '#000000';
      var led = new five.Led(7);
      led.on();
      var holderServo = new five.Servo({
        pin: 3,
        range: [45, 135],
        startAt: 45
      });
      var xServo = new five.Servo({
        pin: 5,
        range: [45, 135],
        startAt: 90
      });
      var yServo = new five.Servo({
        pin: 6,
        range: [0, 90],
        startAt: 0
      });
      navigator.accelerometer.watchAcceleration(
          function(acceleration) {
            //console.log(acceleration);
            var x = acc2deg(acceleration.x + 5);
            var y = acc2deg(10 - acceleration.y) - 45;
            //console.log('accX', acceleration.x);
            //console.log('accY', acceleration.y);
            //console.log('x', x);
            //console.log('y', y);
            xServo.to(x);
            yServo.to(y);
          },
          function() {
            console.error('Accelerometer Error!');
          },
          { frequency: 1000 });
      controlsElem.addEventListener('touchstart', function() {
        holderServo.to(135);
      });
      controlsElem.addEventListener('touchend', function() {
        holderServo.to(45);
      });
    });
  });
}

var app = {

  initialize: function() {
    this.bindEvents();
  },

  bindEvents: function() {
    document.addEventListener('deviceready', this.onDeviceReady, false);
  },

  onDeviceReady: function() {
    app.receivedEvent('deviceready');
    try {
      initControls();
    } catch (e) {
      console.error(e);
    }
  },

  receivedEvent: function(id) {
    var parentElement = document.getElementById(id);
    var listeningElement = parentElement.querySelector('.listening');
    var receivedElement = parentElement.querySelector('.received');

    listeningElement.setAttribute('style', 'display:none;');
    receivedElement.setAttribute('style', 'display:block;');

    console.log('Received Event: ' + id);
  }
};

app.initialize();

//This is for testing in the browser
if (!window.cordova) {
  document.dispatchEvent(new CustomEvent('deviceready'));
}