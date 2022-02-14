console.log("loading mqttNetwork functions...");
const mqtt = require("mqtt")
const globals = require("./globals");

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const sendRequest = function(url, body) {
    return new Promise((resolve, reject) => {
        console.log("Sending request", body);
        client = mqtt.connect(`mqtt://${globals.getIPAddress()}`);
        client.on("connect", function() {
            try {
                console.log("Connected");

                console.log("sending", body, "to", url);
                client.publish(url, body, {qos: 2} ,function(err) {
                    if(!err) { resolve() } else { reject(err) }
                    client.end();
                })
            } catch (err) { reject(err)  }
        })
        client.on("error", function(err) {
            console.log("mqtt Client error", err);
            reject(err);
        })
    })
}

// just a GET request
const getRequest = function(url, msgType = "message") {
    return new Promise((resolve, reject) => {
        client = mqtt.connect(`mqtt://${globals.getIPAddress()}`);
        let isRecieved = false;

        client.on("connect", function() {
            try {
                console.log("getting", url);

                client.subscribe(url, { qos: 2 }, async function(err, granted) {
                    client.on('message', async function(topic, buffer, packet) {
                        if(!isRecieved) {
                            try {
                                isRecieved = true;

                                // make message
                                    let message;
                                    let jsonMessage;

                                    switch (msgType) {
                                            case "packetreceive":
                                                console.log("getting packet");
                                            message = topic.payload.toString();
                                            let messageArray = function() {
                                                message.replace("[", "").replace("]","");
                                                return JSON.parse(message);
                                            };
                                            jsonMessage = messageArray();
                                            break;
                                        case "message":
                                            console.log("getting message");
                                            jsonMessage = JSON.parse(buffer.toString());
                                            break;
                                    }
                                //

                                resolve(jsonMessage);

                                client.unsubscribe(url);
                                client.end();
                            } catch (err) {
                                console.log(err);
                                reject(err);
                            }
                        }
                    })
                })
            }
            catch (err) {
                console.log(err);
                reject(err);
            }
        })
        client.on("error", function(err) {
            console.log("mqtt Client error", err);
            reject(err);
        })
    })
}

// GET request with body
const getRequestWithBody = function(url, body) {
    return new Promise((resolve, reject) => {
        console.log("get request with body");
        let isSent = false;

        if(!isSent) {
            isSent = true;
            client = mqtt.connect(`mqtt://${_IPADDRESS}`);
            client.on("connect", function() {
                try {
                    console.log("Sending", body, "to", url);
                    client.publish(`${url}/get`, body, function(err) {
    
                        client.subscribe(url, async function(err, granted) {
                            await sleep(50);
    
                            client.on("packetreceive", async function(topic, buffer, packet) {
                                try {
                                    let message = topic.payload.toString();
                                    let messageArray = function() {
                                        message.replace("[", "").replace("]","");
                                        return JSON.parse(message);
                                    };
                                    let jsonMessage = messageArray();
            
                                    // callback might be called multiple times with different messages
                                    try {
                                        resolve(jsonMessage);
                                    } catch (err) {
                                        console.log("Could not send data", err);
                                        reject("Could not send data", err);
                                    }
                                    
                                    client.unsubscribe(url);
                                    client.end();
                                } catch (err) {
                                    reject(err);
                                }
                            })
                        })
                    })
                } catch (err) {
                    reject(err);
                }
            })
            client.on("error", function(err) {
                console.log("mqtt Client error", err);
                reject(err);
            })
        } else {
            reject("is sent");
        }
    })
}

// POST then GET
const experimentalRequest =  function(url, body) {
    return new Promise(async (resolve, reject) => {
        console.log("Experimental Request");
        try {
            await this.sendRequest(url, body);
            // wait for network to catch up
            await sleep(1000);
            let data = await this.getRequest(url);
            resolve(data);
        } catch (err) { reject(err); }
    })
}

exports.sendRequest = sendRequest;
exports.getRequest = getRequest;
exports.getRequestWithBody = getRequestWithBody;
exports.experimentalRequest = experimentalRequest;

console.log("mqttNetworkFunctions loaded");
console.log("===");