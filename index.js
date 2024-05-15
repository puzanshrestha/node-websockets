import { WebSocketServer, WebSocket } from "ws";
import express from "express";

const app = express();
const port = 13000;

app.use(express.static("./"));

app.get("/", function (req, res) {
  res.render("index.html");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

const wss = new WebSocketServer({ port: 8080 });
const DEVICE_NODE_MCU_ID = "NODE-MCU-1212";
var wsDeviceNodeMCU;

const ActionType = {
  TURN_ON_LED: "TURN_ON_LED",
  TURN_OFF_LED: "TURN_OFF_LED",
  REQUEST_DEVICE_STATUS: "REQUEST_DEVICE_STATUS",
  RESPOND_DEVICE_STATUS: "RESPOND_DEVICE_STATUS",
  DEVICE_HEART_BEAT: "DEVICE_HEART_BEAT",
  INIT_WEIGHT_SENSOR: "INIT_WEIGHT_SENSOR",
  START_WEIGHT_SENSOR: "START_WEIGHT_SENSOR",
  STOP_WEIGHT_SENSOR: "STOP_WEIGHT_SENSOR",
  WEIGHT_SENSOR_DATA: "WEIGHT_SENSOR_DATA",
};

wss.on("connection", function connection(ws, req) {
  let headers = req.headers;

  let clientId = headers["client_id"];

  if (clientId == DEVICE_NODE_MCU_ID) {
    wsDeviceNodeMCU = ws;
  }
  let heartbeatTimeout;

  function heartbeat() {
    clearTimeout(heartbeatTimeout);
    heartbeatTimeout = setTimeout(() => {
      console.log("NodeMCU disconnected");
      ws.terminate();
      broadcastDeviceStatus();
    }, 5000);
  }
  broadcastDeviceStatus();

  ws.on("message", function message(data) {
    console.log("received: %s", data);

    var jsonData = parseJsonObject(data);

    if (jsonData == null) {
      return;
    }

    switch (jsonData.actionType) {
      case ActionType.REQUEST_DEVICE_STATUS:
        broadcastDeviceStatus();
        break;

      case ActionType.DEVICE_HEART_BEAT:
        heartbeat();
        break;

      case ActionType.WEIGHT_SENSOR_DATA:
        broadcastData(jsonData);
        break;

      case ActionType.TURN_ON_LED:
        turnOnLED();
        break;

      case ActionType.TURN_OFF_LED:
        turnOffLED();
        break;

      case ActionType.INIT_WEIGHT_SENSOR:
        initWeightSensor();
        break;

      case ActionType.START_WEIGHT_SENSOR:
        startWeightSensor();
        break;

      case ActionType.STOP_WEIGHT_SENSOR:
        stopWeightSensor();
        break;
    }
  });
});

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

function sendDataToNodeMCU(actionType, body = "") {
  var data = {};
  data.actionType = actionType;
  data.body = body;

  if (wsDeviceNodeMCU != undefined) wsDeviceNodeMCU.send(JSON.stringify(data));
}

function getResponseData(actionType, body = "") {
  var data = {};
  data.actionType = actionType;
  data.body = body;
  return JSON.stringify(data);
}

function getReadyStateString(state) {
  switch (state) {
    case WebSocket.CONNECTING:
      return "CONNECTING";
    case WebSocket.OPEN:
      return "ACTIVE";
    case WebSocket.CLOSING:
      return "CLOSING";
    case WebSocket.CLOSED:
      return "CLOSED";
    default:
      return "UNKNOWN";
  }
}

function broadcastDeviceStatus() {
  wss.clients.forEach(function (client) {
    if (client != wsDeviceNodeMCU) {
      if (wsDeviceNodeMCU == undefined) {
        client.send(
          getResponseData(
            ActionType.RESPOND_DEVICE_STATUS,
            getReadyStateString(WebSocket.CLOSED)
          )
        );
      } else {
        client.send(
          getResponseData(
            ActionType.RESPOND_DEVICE_STATUS,
            getReadyStateString(wsDeviceNodeMCU.readyState)
          )
        );
      }
    }
  });

  // for (const [key, ws] of Object.entries(clients)) {
  //   if (key != DEVICE_NODE_MCU_ID) {
  //     if (DEVICE_NODE_MCU_ID in clients)
  //       ws.send(
  //         getResponseData(
  //           ActionType.RESPOND_DEVICE_STATUS,
  //           getReadyStateString(clients[DEVICE_NODE_MCU_ID].readyState)
  //         )
  //       )
  //     else
  //       ws.send(
  //         getResponseData(
  //           ActionType.RESPOND_DEVICE_STATUS,
  //           getReadyStateString(WebSocket.CLOSED)
  //         )
  //       );
  //   }
  // }
}

function broadcastData(data) {
  wss.clients.forEach(function (client) {
    if (client != wsDeviceNodeMCU) {
      client.send(getResponseData(data.actionType, data.body));
    }
  });
}

function turnOnLED() {
  sendDataToNodeMCU(ActionType.TURN_ON_LED);
}

function turnOffLED() {
  sendDataToNodeMCU(ActionType.TURN_OFF_LED);
}

function initWeightSensor() {
  sendDataToNodeMCU(ActionType.INIT_WEIGHT_SENSOR);
}

function startWeightSensor() {
  sendDataToNodeMCU(ActionType.START_WEIGHT_SENSOR);
}

function stopWeightSensor() {
  sendDataToNodeMCU(ActionType.STOP_WEIGHT_SENSOR);
}
