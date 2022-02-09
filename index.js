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
const { send } = require("express/lib/response");
const { resolve } = require("path");
const { request } = require("http");
const { handle } = require("express/lib/application");
    app.set("view engine", "ejs");


//

// global vars

    // refresh timer in ms, default 2 seconds
    const __REQUEST_QUEUE_REFRESH_TIMER = 2000;
    // timeout time in seconds, default 2 minutes
    const __REQUEST_QUEUE_TIMEOUT_TIME = 120;
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
    // POST request
    sendRequest: function(url, body) {
        return new Promise((resolve, reject) => {
            client = mqtt.connect(`mqtt://${_IPADDRESS}`);
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
        })
    },
    // just a GET request
    getRequest: function(url, msgType = "message") {
        return new Promise((resolve, reject) => {
            client = mqtt.connect(`mqtt://${_IPADDRESS}`);
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
        })
    },
    // GET request with body
    getRequestWithBody: function(url, body) {
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
            } else {
                reject("is sent");
            }
        })
    },
    // POST then GET
    experimentalRequest: function(url, body) {
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
}

// RequestQueue holds an array of objects with { request: Object, type: string }
let RequestQueue = [], isWorking = false;

app.get("/getIndivData/:friendlyName/:attribute", async (req,res) => {
    console.log(`=== GETTING ${req.params.friendlyName} ${req.params.attribute} ===`);

    let Request = {
        reqFriendlyName: req.params.friendlyName,
        reqAttribute: req.params.attribute,
        body: ``,
        url: ``,
    }

    Request.body = `{"${Request.reqAttribute}": ""}`;
    Request.url = `zigbee2mqtt/${Request.reqFriendlyName}`;
    try {
        let data;
        data = await getIndivData(Request);

        if(!data.hasOwnAttribute(Request.reqAttribute)) {
            console.log("Resending");
            data = await getIndivData(Request);
        }

        res.send(data);
    } catch (err) { res.status(404).send() }

})

app.post("/getDataForMultipleLights", async (req,res) => {
    console.log("Getting data for multiple lights");
    const reqArray = req.body, resArray = [];
    
    console.log(reqArray);

    while(reqArray.length != 0) {
        console.log(resArray);
        try {
            let currentReq = reqArray[reqArray.length-1];
            currentReq.body = currentReq.body.replace(/'/g, '"');
            console.log(currentReq.body, typeof currentReq.body);

            let data = await getIndivData(currentReq);
           
            resArray.push(data);
            reqArray.pop();
        } catch (err) { console.log(err); }
        await sleep(1000);
    }

    res.send(resArray);
})

app.post("/api/test/queue", async (req, res) => {
    let data;

    try {
        data = await insertNewRequest(req.body.request, req.body.type);
    } catch(e) {
        data = { "Error": e.reason, "Request": e.Request, "done": false };
    }

    res.send(data);
    
})


function insertNewRequest(Request, reqType) {
    return new Promise((resolve, reject) => {

        // valid reqType's
        // -- getIndivData, getData
        RequestQueue.push({ request: Request, type: reqType });

        let timer = 0;
        // check every second if request has been handled
        // rejects if Request could not be handled
        // timeouts after n time in seconds
        let reqCheck = setInterval(async () => {
            timer++;
            if(RequestQueue[0].hasOwnProperty("done")) {
                if(RequestQueue[0].done === true) {
                    console.log("shifting request out");
                    const handledRequest = RequestQueue.shift();
                    resolve(handledRequest);
                } else {
                    console.log("shifting request out");
                    const handledRequest = RequestQueue.shift();
                    reject(handledRequest);
                }

                clearInterval(reqCheck);

            } else if (timer == __REQUEST_QUEUE_TIMEOUT_TIME) {
                // timeout
                console.log("timeout");
                const unhandledRequest = RequestQueue.shift();
                reject({ Request: unhandledRequest, reason: "timeout" });
                clearInterval(reqCheck);
            }
        }, 1000);

    })
}

let mockRequest = {
    request: {
        reqFriendlyName: "testFriendlyName"
    },
    type: "testType"
}

// runs every n seconds, checking if there are Requests waiting
// n is specified as __REQUEST_QUEUE_REFRESH_TIMER constant
setInterval(async function () {
    // only do something if not working and requestQueue holds data
    console.log("checking queue, current:", RequestQueue[0]);
    if(!isWorking && RequestQueue.length > 0) {
        console.log("-- Next Request inserted", RequestQueue[0].request.reqFriendlyName), RequestQueue[0].type;
        isWorking = true;
        try {
            let data;
            // switches types
            /* DISABLED FOR DEBUGGING
            switch(RequestQueue.type) {
                case "getIndivData":
                    data = await getIndivData(RequestQueue[0]);
                    break;
                case "getData":
                    data = await getData(RequestQueue[0]);
                    break;
            } */

            await sleep(7500);

            console.log(`-- Request done: ${RequestQueue[0].request.reqFriendlyName} of type ${RequestQueue[0].type}`);         
            RequestQueue[0].done = true;
            isWorking = false;
        } catch (err) { 
            console.log("-- Error at Queue: Failed to handle Request:", 
            RequestQueue[0],
            err );
            
            if(RequestQueue[0] != undefined) {
                RequestQueue[0].done = false;
            } else {
                RequestQueue[0] = { done: false };
            }
            
            isWorking = false; 
        }
    } 
}, __REQUEST_QUEUE_REFRESH_TIMER);

// gets specific data with SET Request prior to the GET request
function getIndivData(Request) {
    return new Promise(async (resolve, reject) => {
        console.log("Getting indiv data for", Request.reqFriendlyName);
        try {
            let data = await mqttNetwork.experimentalRequest(Request.url, Request.body);
            data.friendlyName = Request.reqFriendlyName;
            console.log("Done getting data");

        } catch (err) {
            reject(err);
        }
    })
}

// getData @Params: { Request : Object }
function getData(Request) {
    return new Promise(async (resolve, reject) => {
        try {
            const data = await mqttNetwork.getRequest(Request.url, "message");
            resolve(data);
        } 
        catch (err) {
            reject(err);
        }
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

    const request = {
        topic: topicsArray.join().replace(",", "/"),
        url: `zigbee2mqtt/${topic}`,
    }

    try {
        const data = await getData(request);
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
    console.log("saving scene...");
    database.saveCurrentToScene(req.params.name, req.params.group, req.params.bri)
    .then(async function(returnDoc) {
        
        const url = `zigbee2mqtt/${returnDoc.group}/set`;
        let doc = `{"scene_store": ${returnDoc.id}}`;

        console.log("Sending scene", url, doc);
        await mqttNetwork.sendRequest(url, doc);
        
        res.status(200).send({doc: doc})
        console.log("===== DONE ====");
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

console.log("Done with main module");