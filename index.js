"use strict"

// express setup

    const mqtt = require("mqtt")
    const path = require("path")
    const express = require("express");
    const app = express();
    const database = require("./database");
    const fs = require("fs");
    const jsonfile = require("jsonfile");
    const cors = require("cors");
    const { config } = require("process");
    const { type } = require("os");
    app.set("view engine", "ejs");


//

// POST request setup
    app.use(express.urlencoded({
        extended: false
    }))

    app.use(express.json())
//

// Port setup
    const _PORT = 30000

    app.listen(_PORT)
//

// Cors setup
    app.use(cors());

//

// expose public folder

    app.use(express.static(path.join(__dirname, "/public")));

//

// MQTT init setup

    const configfile = path.join(__dirname, "configfile.json");
    
    let _IPADDRESS;

    var loadedConfig;

    var client;

    var client;

    jsonfile.readFile(configfile)
    .then(function(obj) {
        
        console.log(`connecting to ${obj.ip}:${obj.port}`);

        _IPADDRESS =`${obj.ip}:${obj.port}`; 

        client = mqtt.connect(`mqtt://${obj.ip}:${obj.port}`)


        client.subscribe("zigbee2mqtt", function(err, granted) {
            console.log(granted);
            client.unsubscribe("zigbee2mqtt");
            client.end();
        })
    });



//

// writes new data to configfile
app.post("/writeConfig", (req,res) => {
    console.log("new write config request", req.body);

    jsonfile.writeFile(configfile, req.body, function (err) {
        if(!err) {
            try {
                console.log("Writing config, send status")
                res.sendStatus(200).send();
            }
            catch (err) {
                console.log(err);
            }
        } else {
            console.log(err);
        }
    }) 
})

// returns data from configfile
app.get("/readConfig", (req,res) => {
    jsonfile.readFile(configfile, (err, obj) => {
        if(!err) {
            try {
                console.log("Sending object");
                res.send(obj)
            }
            catch (err) {
                console.log(err);
            }
        } else {
            console.log(err);
        }
    })
})


app.get("/", (req,res) => {
    res.redirect("/home")
})

app.get("/home", (req, res) => {
    res.render("home.ejs", {})
})

app.get("/scenes", (req, res) => {
    res.render("scenes.ejs", {})
})

app.get("/automation", (req, res) => {
    res.render("automation.ejs", {})
})

app.get("/settings", (req, res) => {
    res.render("settings.ejs", {})
})


app.post("/set/:name/:key/:value", async (req, res) => {
    console.log(`== STATE CHANGE ${req.params.name} ${req.params.key} ${req.params.value} == `)
    let name = req.params.name;
    let state;
    let value;

    if(req.params.key == "color") {
        // add "#"
        value = `#${req.params.value}`;
    } else {
        value = req.params.value
    }

    let parsedValue = parseInt(value);

    // find out if the key is a number
    if(parsedValue.toString() == "NaN") 
    {
       // value is a string
       state = `{"${req.params.key}": "${value}"}`
    } 
    else 
    {
        // value is a number
        state = `{"${req.params.key}": ${value}}`
    }
    
    let url = `zigbee2mqtt/${name}/set`

    console.log(url, state);

    try {
        await mqttNetwork.sendRequest(url, state);
        res.status(200);
    } catch (err) {
        console.log(err);
        res.status(500);
    }

    res.send();
    console.log("sentResponse");

    console.log("====== DONE =====");
    
})

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const mqttNetwork = {
    // GET request with parameters
    sendRequest: function(url, body) {
        return new Promise((resolve, reject) => {
            client = mqtt.connect(`mqtt://${_IPADDRESS}`);
            client.on("connect", function() {
                try {
                    console.log("Connected");
                    client.publish(url, body, function(err) {
                        console.log("published callback");
                        if(!err) { resolve() } else { reject(err) }
                        client.end();
                    })
                } catch (err) { reject(err)  }
            })
        })
    },
    // just a GET request
    getRequest: function(url, type = "packetreceive") {
        return new Promise((resolve, reject) => {
            client = mqtt.connect(`mqtt://${_IPADDRESS}`);

            client.on("connect", function() {
                try {
                    console.log("Connected, subscribing to:", url);
                    client.subscribe(url, async function(err, granted) {
                        console.log("Subscribed", granted);
                        if(type == "packetreceive") {
                            await sleep(25);
                        }
                        let isRecieved = false;

                        client.on(type, async function(topic, buffer, packet) {
                            console.log("recieved", topic);
                            if(!isRecieved) {
                                try {
                                    isRecieved = true;

                                    // make message
                                        let message;
                                        let jsonMessage;

                                        switch (type) {
                                                case "packetreceive":
                                                message = topic.payload.toString();
                                                let messageArray = function() {
                                                    message.replace("[", "").replace("]","");
                                                    return JSON.parse(message);
                                                };
                                                jsonMessage = messageArray();
                                                break;
                                            case "message":
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
        })
    },
    // sends GET request, but with extra parameters as JSON body
    getRequestWithBody: function(url, body) {
        return new Promise((resolve, reject) => {
            console.log("get Request with body");
            let isSent = false;

            if(!isSent) {
                isSent = true;
                client = mqtt.connect(`mqtt://${_IPADDRESS}`);
                client.on("connect", function() {
                    try {
                        console.log("Connected");
                        client.publish(`${url}/get`, body, function(err) {
                            console.log("published callback");
        
                            client.subscribe(url, async function(err, granted) {
                                console.log("Subscribed", granted);
                                await sleep(25);
        
                                client.on("packetreceive", async function(topic, buffer, packet) {
                                    console.log("Message recieved");
                                    try {
                                        let message = topic.payload.toString();
                                        let messageArray = function() {
                                            message.replace("[", "").replace("]","");
                                            return JSON.parse(message);
                                        };
                                        let jsonMessage = messageArray();
                
                                        // callback might be called multiple times with different messages
                                        console.log("Is target attribute");
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
            } else {
                reject("is sent");
            }
        })
    },
}

let RequestQueue = [], isWorking = false;

app.get("/getIndivData/:friendlyName/:attribute", (req,res) => {
    console.log(`=== GETTING ${req.params.friendlyName} ${req.params.attribute} ===`);

    let Request = {
        reqFriendlyName: req.params.friendlyName,
        reqAttribute: req.params.attribute,
        body: ``,
        url: ``,
    }

    Request.body = `{"${Request.reqAttribute}": ""}`;
    Request.url = `zigbee2mqtt/${Request.reqFriendlyName}`;

    RequestQueue.push(Request);

    // Check if first in queue, if not
    // wait until
    let QueueCheck = setInterval(async function () {
        console.log("Checking Queue, length:", RequestQueue.length);
        if(checkQueue) {
            console.log("Next Request inserted");
            try {
                let data = await getIndivData(Request);
                res.send(data);
            } catch (err) {
                res.status(500).send();
            }
            clearInterval(QueueCheck);
        } 
    }, 1000);
})

function checkQueue() {
    let returnVal = false;
    // check if API is working and there is a Queue
    if(!isWorking && currentRequest.length > 1) {
        returnVal = true;
    }
    return returnVal;
}

function getIndivData(Request) {
    return new Promise(async (resolve, reject) => {
        isWorking = true;
        RequestQueue.push(Request);
        console.log("Current Request:", Request);
        try {
            let data;
            data = await mqttNetwork.getRequestWithBody(Request.url, Request.body);
            if(!data.hasOwnProperty(Request.reqAttribute)) {
                console.log("not correct attribute");
                await sleep(3000);
                data = await mqttNetwork.getRequestWithBody(Request.url, Request.body);
            }
            if(!data.hasOwnProperty(Request.reqAttribute)) {
                reject("attribute");
                isWorking = false;
            } else {
                isWorking = false;
                resolve(data);
            }
        } catch (err) {
            isWorking = false;
            reject(err);
        }
        let removedEle = RequestQueue.shift();
    })
}

let groups = [];

// get groups
app.get("/getGroups", (req, res) => {
    console.log("Getting groups");

    client = mqtt.connect(`mqtt://${_IPADDRESS}`);

    client.on("connect", function() {
        if(groups.length > 0) {
            console.log("using cache");
            try {
                console.log("sending groups");
                res.send(groups);
            }
            catch (err) {
                console.log(err);
            }
            console.log("====== DONE =======");
        }
        else {
            let url = `zigbee2mqtt/bridge/groups`
    
            client.subscribe(url, function(err, granted) {     
                client.on("message", function(topic, buffer, packet) {
                    let message = buffer.toString();
                    console.log("connected to", topic);
        
                    // make array of friendly names
                    const friendlyNames = function() {
                        let nameArray = [];
        
                        // clean message to Array with objects
                        let messageArray = function() {
                            message.replace("[", "").replace("]","");
                            return JSON.parse(message);
                        };
                        
                        // get friendly_names out and return them in a new array
                        messageArray().forEach(function(group) {
                            
                            // dont insert default bind group
                            if(group.friendly_name != "default_bind_group") {
                                nameArray.push(group.friendly_name);
                            }
                        })
                        return nameArray;
                    }
                    const names = friendlyNames();
                    console.log(names);
                    try {
                        console.log("Sending names");
                        res.send(names);
                    }
                    catch (err) {
                        console.log(err);
                    }
                    groups = names;
                    console.log("====== DONE =======");
                    
                    client.unsubscribe(url);
                    client.end();
                })
            })
        }
    })
})

// gets data from bridge
app.get("/getData/:topic", async (req, res) => {
    console.log("Getting data from topic");
    let topicsArray = req.params.topic.split("&");
    //console.log(topicsArray);

    const topic = topicsArray.join().replace(",", "/");
    const url = `zigbee2mqtt/${topic}`;

    try {
        const data = await mqttNetwork.getRequest(url, "message");
        res.send(data);
    } 
    catch (err) {
        console.log("Error at getData/", topic, "Err or not granted");
        console.log(err);
        res.status(500).send();
    }
    
    
})

app.get("/refreshMirror", function(req,res) {
  console.log("Refreshing cached data...");

  console.log("Connecting to MQTT broker...");
  client = mqtt.connect(`mqtt://${_IPADDRESS}`);
  
  client.on("connect", function() {
    const topic = "bridge/devices";
    const url = `zigbee2mqtt/${topic}`;
    console.log("Connected, getting data...");

    client.subscribe(url, function(err, granted) {
        if(granted == undefined || err) {
            console.log("Could not subscribe to topic!", url, err);
        } else {
            client.on("message", function(resTopic, buffer, packer) {
                let message = JSON.parse(buffer.toString());
                console.log("Got message, connection fully established.");

                client.unsubscribe(topic);
                client.end();

                try {
                    database.makeNewMirror(message).then(function(dataRes) {
                        console.log("sending response");
                        res.sendStatus(200).send();
                    })
                }
                catch (err) {
                    console.log("ERROR AT DATABASE CALL");
                    res.send(err);
                }
            })
        }
    })
  })
})

app.get("/getMirror", function(req,res) {
    console.log("Getting mirror...");
    database.getMirror().then(function(databaseRes) {
        console.log("Got", databaseRes);
        console.log("Sending mirror");
        res.send(databaseRes);
    })
})

// saves current setup to scenes db
app.post("/saveScene/:name/:group/:bri", (req,res) => {
    console.log("saving scene...")
    database.saveCurrentToScene(req.params.name, req.params.group, req.params.bri)
    .then(function(returnDoc) {
        //console.log(returnDoc);

        // send scene doc to mqtt
        // {"scene_store": SCENE_ID}
        const url = `zigbee2mqtt/${returnDoc.group}/set`
        let doc = `{"scene_store": ${returnDoc.id}}`
        //console.log("Contents: ",url, doc);
        console.log("Sending response to save scene");
        client.publish(url, doc, res.status(200).send());
        console.log("===== DONE ====")
    })
})

// returns scenes
app.get("/getScenes", (req, res) => {
    database.getAllScenes()
    .then(function(returnDocs) {
        //console.log(returnDocs)
        try {
            console.log("Sending scenes")
            res.send(returnDocs);
        }
        catch (err) {
            console.log(err);
        }
    })
})


// executes scene
app.get("/scene/:groupName/:sceneId", async (req, res) => {
    console.log("=== EXEC SCENE", req.params.groupName, req.params.sceneId, "===");

    let url = `zigbee2mqtt/${req.params.groupName}/set`
    let state = `{"scene_recall": ${req.params.sceneId}}`

    // set scene
    try {
        await mqttNetwork.sendRequest(url, state);
        res.status(200);
    } catch (err) {
        console.log(err);
        res.status(500);
    }

    res.send();
    console.log("=== DONE ===");
})

// updates program
app.get("/update", (req, res) => {
    console.log("Sending update ok");
    res.status(200).send();
})

app.post("/updateProgram", function(req, res) {
    const { exec } = require('child_process');
    exec('./update.sh', (err, stdout, stderr) => {
    if (err) {
        //some err occurred
        console.error(err)
        console.log("Sending 500 err");
        res.status(500).send();
    } else {
    // the *entire* stdout and stderr (buffered)
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
    console.log("Sending 200 ok");
    res.status(200).send();
    }
    });
})

