var statusMessage = document.getElementById("status-message")
var serverLogs = document.getElementById("server-logs")
var buttonOn = document.getElementById("button-on")
var buttonOff = document.getElementById("button-off")
var deviceStatus = document.getElementById("device-status")
var buttonReconnect = document.getElementById("button-reconnect")



var SOCKET_URL = "ws://192.168.254.64:8080"
var ws

const ActionType =  {
  TURN_ON_LED: 'TURN_ON_LED',
  TURN_OFF_LED : 'TURN_OFF_LED',
  REQUEST_DEVICE_STATUS : 'REQUEST_DEVICE_STATUS',
  RESPOND_DEVICE_STATUS : 'RESPOND_DEVICE_STATUS'
}


function initEvents(){

    buttonOff.disabled = true
    buttonOn.disabled = true

    buttonOn.addEventListener("click", function() {
        send(ActionType.TURN_ON_LED);
    }, false);
    
    buttonOff.addEventListener("click", function() {
        send(ActionType.TURN_OFF_LED);
    }, false);
    
    buttonReconnect.addEventListener("click", function() {
        initWebSocket()
    }, false);

    setInterval(function() {
        send(ActionType.REQUEST_DEVICE_STATUS)
    }, 1000);
}

function initWebSocket() {
    ws = new WebSocket(SOCKET_URL)

    ws.onopen = function() {
        statusMessage.innerText = "Connected"
        buttonReconnect.disabled = true
        buttonOn.disabled = false
        buttonOff.disabled = false
    }

    ws.onmessage = function (evt) { 
        var data = evt.data;
        serverLogs.innerText = data;
        
        console.log(data)

        jsonObj = parseJsonObject(data)
        switch(jsonObj.actionType){
            case ActionType.RESPOND_DEVICE_STATUS:
                deviceStatus.innerText = jsonObj.body
                if(jsonObj.body === "CLOSED"){
                    buttonOn.disabled = true
                    buttonOff.disabled = true
                }
                else if(jsonObj.body === "ACTIVE"){
                    buttonOn.disabled = false
                    buttonOff.disabled = false
                }
                break

        }

    };

    ws.onclose = function() { 
        statusMessage.textContent= "Connection is closed..."; 
        deviceStatus.textContent= "N/A"; 
        buttonReconnect.disabled = false
        buttonOn.disabled = true
        buttonOff.disabled = true
    };  
}

function parseJsonObject(data){
    try{
        var jsonData = JSON.parse(data)
        var jsonObj = {}
        jsonObj.actionType = jsonData['actionType']
        jsonObj.body = jsonData['body']
  
        return jsonObj
    }catch(ex){
        // console.log(ex)
    }
  }

 function send(actionType,body = ""){
    var data = {}
    data.actionType = actionType
    data.body = body
    ws.send(JSON.stringify(data))

    console.log(JSON.stringify(data))
}

initWebSocket()

initEvents()
