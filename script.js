var statusMessage = document.getElementById("status-message");
var serverLogs = document.getElementById("server-logs");
var buttonOn = document.getElementById("button-on");
var buttonOff = document.getElementById("button-off");
var deviceStatus = document.getElementById("device-status");
var buttonReconnect = document.getElementById("button-reconnect");
// import dotenv from "dotenv";
// dotenv.config();

var buttonStartWeightSensor = document.getElementById(
  "button-start-weight-sensor"
);
var buttonInitWeightSensor = document.getElementById(
  "button-init-weight-sensor"
);
var buttonStopWeightSensor = document.getElementById(
  "button-stop-weight-sensor"
);
var weightSensorData = document.getElementById("weight-sensor-data");

// var SOCKET_URL = process.env.SOCKET_URL;
var SOCKET_URL = "ws://13.234.144.51:8080";
var ws;

const ActionType = {
  TURN_ON_LED: "TURN_ON_LED",
  TURN_OFF_LED: "TURN_OFF_LED",
  REQUEST_DEVICE_STATUS: "REQUEST_DEVICE_STATUS",
  RESPOND_DEVICE_STATUS: "RESPOND_DEVICE_STATUS",
  INIT_WEIGHT_SENSOR: "INIT_WEIGHT_SENSOR",
  START_WEIGHT_SENSOR: "START_WEIGHT_SENSOR",
  STOP_WEIGHT_SENSOR: "STOP_WEIGHT_SENSOR",
  WEIGHT_SENSOR_DATA: "WEIGHT_SENSOR_DATA",
};

function initEvents() {
  buttonOff.disabled = true;
  buttonOn.disabled = true;

  buttonOn.addEventListener(
    "click",
    function () {
      send(ActionType.TURN_ON_LED);
    },
    false
  );

  buttonOff.addEventListener(
    "click",
    function () {
      send(ActionType.TURN_OFF_LED);
    },
    false
  );

  buttonReconnect.addEventListener(
    "click",
    function () {
      initWebSocket();
    },
    false
  );

  buttonInitWeightSensor.addEventListener(
    "click",
    function () {
      send(ActionType.INIT_WEIGHT_SENSOR);
    },
    false
  );

  buttonStartWeightSensor.addEventListener(
    "click",
    function () {
      send(ActionType.START_WEIGHT_SENSOR);
    },
    false
  );

  buttonStopWeightSensor.addEventListener(
    "click",
    function () {
      send(ActionType.STOP_WEIGHT_SENSOR);
    },
    false
  );

  setInterval(function () {
    send(ActionType.REQUEST_DEVICE_STATUS);
  }, 1000);
}

function initWebSocket() {
  ws = new WebSocket(SOCKET_URL);

  ws.onopen = function () {
    statusMessage.innerText = "Connected";
    buttonReconnect.disabled = true;
    buttonOn.disabled = false;
    buttonOff.disabled = false;
  };

  ws.onmessage = function (evt) {
    var data = evt.data;
    // serverLogs.innerText = data;

    console.log(data);

    jsonObj = parseJsonObject(data);
    switch (jsonObj.actionType) {
      case ActionType.RESPOND_DEVICE_STATUS:
        deviceStatus.innerText = jsonObj.body;
        if (jsonObj.body === "CLOSED") {
          buttonOn.disabled = true;
          buttonOff.disabled = true;
        } else if (jsonObj.body === "ACTIVE") {
          buttonOn.disabled = false;
          buttonOff.disabled = false;
        }
        break;
      case ActionType.WEIGHT_SENSOR_DATA:
        weightSensorData.innerText = jsonObj.body;
    }
  };

  ws.onclose = function () {
    statusMessage.textContent = "Connection is closed...";
    deviceStatus.textContent = "N/A";
    buttonReconnect.disabled = false;
    buttonOn.disabled = true;
    buttonOff.disabled = true;
  };
}

function parseJsonObject(data) {
  try {
    var jsonData = JSON.parse(data);
    var jsonObj = {};
    jsonObj.actionType = jsonData["actionType"];
    jsonObj.body = jsonData["body"];

    return jsonObj;
  } catch (ex) {
    // console.log(ex)
  }
}

function send(actionType, body = "") {
  var data = {};
  data.actionType = actionType;
  data.body = body;
  ws.send(JSON.stringify(data));

  console.log(JSON.stringify(data));
}

initWebSocket();

initEvents();
