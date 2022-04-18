"use strict"

// express setup

    const mqtt = require("mqtt")
    const path = require("path")
    const express = require("express");
    const app = express();
    const fs = require("fs");
    const jsonfile = require("jsonfile");
    const cors = require("cors");
    const { config } = require("process");
    const { type } = require("os");
    const { send } = require("express/lib/response");
    const { resolve, format } = require("path");
    const { request } = require("http");
    const { handle } = require("express/lib/application");
    app.set("view engine", "ejs");

//

// global vars


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

// cache setup

    var cacheTime = 86400000*7;     // 7 days

//

// expose public folder

    app.use(express.static(path.join(__dirname, "/public"),{ maxAge: cacheTime }));

//

// init setup
    const globals = require("./globals");

    let groups = []; let themeColor;
    const configfile = path.join(__dirname, "configfile.json");
    var loadedConfig; var client;

    jsonfile.readFile(configfile)
    .then(function(obj) {

        // general settings stuff
            Queue.setRefreshTimer(obj.queue_refresh_timer);
            Queue.setQueueTimeout(obj.queue_timeout_time);

            themeColor = obj.theme_color;
        
        // mqtt stuff
            console.log(`connecting to ${obj.ip}:${obj.port}`);

            globals.setIPAddress(`${obj.ip}:${obj.port}`); 

            client = mqtt.connect(`mqtt://${obj.ip}:${obj.port}`)

            client.subscribe("zigbee2mqtt", function(err, granted) {
                console.log(granted);
                client.unsubscribe("zigbee2mqtt");
                client.end();
            })
    });

//
    // custom libs
    const database = require("./database");
    const Queue = require("./queue");
    const mqttNetwork = require("./mqttNetworkFunctions");


function refreshSettings() {
    jsonfile.readFile(configfile)
    .then(function(obj) {

        // general settings stuff
            Queue.setRefreshTimer(obj.queue_refresh_timer);
            Queue.setQueueTimeout(obj.queue_timeout_time);

            themeColor = obj.theme_color;
        
    });
}

// ==== CONFIG STUFF

    // writes new data to configfile
    app.post("/writeConfig", (req,res) => {

        jsonfile.writeFile(configfile, req.body, function (err) {
            if(!err) {
                try {
                    refreshSettings();
                    console.log("Writing config, send status")
                    res.sendStatus(200).send();
                }
                catch (err) {
                    console.log(err);
                    res.sendStatus(500).send();
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

///// --  FRONTEND APIs

app.get("/", (req,res) => {
    res.redirect("/home")
})

app.get("/home", (req, res) => {
    res.render("home.ejs", { themeColor })
})

app.get("/scenes", (req, res) => {
    res.render("scenes.ejs", { themeColor })
})

app.get("/automation", (req, res) => {
    res.render("automation.ejs", { themeColor })
})

app.get("/settings", (req, res) => {
    res.render("settings.ejs", { themeColor })
})

///////

// ====== BACKEND APIs

    app.post("/set/:name/:key/:value", async (req, res) => {
        console.log(`== STATE CHANGE ${req.params.name} ${req.params.key} ${req.params.value} == `)
        let name = req.params.name, 
            state, 
            value,
            parsedValue,
            url,
            data;

        if(req.params.key == "color") {
            // add "#"
            value = `#${req.params.value}`;
        } else {
            value = req.params.value;
        }

        parsedValue = parseInt(value);

        // find out if the key is a number
        if(parsedValue.toString() == "NaN") 
        {
            // value is a string
            state = `{"${req.params.key}": "${value}"}`;
        } 
        else 
        {
            // value is a number
            state = `{"${req.params.key}": ${value}}`;
        }
        url = `zigbee2mqtt/${name}/set`;
        console.log(url, state);

        const request = { url: url, body: state };
        try {
            data = await Queue.insertNewRequest(request, "sendData");
        } catch(e) {
            data = { "Error": e.reason, "Request": e.Request, "done": false };
        }

        res.send(data);
        console.log("sentResponse");
        console.log("====== DONE =====");
    })

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

    // will be deprecated when Queue system rolls out
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

    // get groups
    app.get("/getGroups", (req, res) => {
        console.log("Getting groups");

        client = mqtt.connect(`mqtt://${globals.getIPAddress()}`);
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
                let url = `zigbee2mqtt/bridge/groups`;
        
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
        let topicsArray = req.params.topic.split("&").join().replaceAll(",", "/");
        //console.log(topicsArray);

        const request = {
            topic: topicsArray,
            url: `zigbee2mqtt/${topicsArray}`,
        }

        try {
            //const data = await getData(request);
            const data = await Queue.insertNewRequest(request, "getData");
            res.send(data);
        } 
        catch (err) {
            console.log("Error at getData/", topicsArray, "Err or not granted");
            console.log(err);
            res.status(500).send();
        }
    })

    // new API
    app.post("/api/v2/queue", async (req, res) => {
        let data;
        try {
            data = await Queue.insertNewRequest(req.body.request, req.body.type);
        } catch(e) {
            data = { "Error": e.reason, "Request": e.Request, "done": false };
        }
        res.send(data);
    })

// ==== MIRROR

    // make new mirror
    app.get("/refreshMirror", function(req,res) {
    console.log("Refreshing cached data...");

    console.log("Connecting to MQTT broker...");
    client = mqtt.connect(`mqtt://${globals.getIPAddress}`);
    
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

    // return mirror
    app.get("/getMirror", function(req,res) {
        console.log("Getting mirror...");
        database.getMirror().then(function(databaseRes) {
            console.log("Got", databaseRes);
            console.log("Sending mirror");
            res.send(databaseRes);
        })
    })

//

// ===== SCENES

    // save scene
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

    // return scenes
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


    // execute scene
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

// ======= UPDATE

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

// ===== AUTOMATIONS

    let { Automation } = require("./automations");

    // holds array of automations. Get one by inserting the id
    let memoryAutomations = {};

    (async function refreshAutomations() {
        const automations = await database.getAllAutomations();
        automations.forEach(automation => {
            console.log(`Got automation:\n${automation.nickname} with id: ${automation._id}\n*******`);
            memoryAutomations[automation._id] = new Automation(automation, false);
        })
    })();

    app.post("/api/v2/automations/set/:id", async (req,res) => {
        const newAutomation = req.body;
        console.log("new automation:", newAutomation);

        let formattedAutomation = {
            time: newAutomation.scheduleTime,
            days: "",
            dayStart: 0,
            dayEnd: 0,
            rooms: newAutomation.automationSelectAffectedRooms,
            nickname: newAutomation.automationName,
            action: newAutomation.automationActionSelect,
            weekday: false,
            weekend: false,
            smoothStateChange: newAutomation.automationSmoothStateChange,
            transitionSpeed: newAutomation.automationTransitionSpeed,
        }

        // dumb repeat stuff
        // rework this!
        if(newAutomation.weekday) {
            formattedAutomation.weekday = true;
            formattedAutomation.dayStart = 1;
            formattedAutomation.dayEnd = 5;
        }
        if(newAutomation.weekend) {
            formattedAutomation.weekend = true;
            formattedAutomation.days = 6;
            formattedAutomation.dayEnd = 0;
        }
        if(newAutomation.weekday && newAutomation.weekend) {
            formattedAutomation.dayStart = 0;
            formattedAutomation.dayEnd = 6;
        }

        formattedAutomation.time = {
            minute: `${formattedAutomation.time.minuteTenths}${formattedAutomation.time.minuteSingle}`,
            hour: `${formattedAutomation.time.hourTenths}${formattedAutomation.time.hourSingle}`,
        }

       
        if(req.params.id != "new") {
            // update old automation
            const automation = memoryAutomations[req.params.id];
                automation.stopAutomation();
                automation.setObject(formattedAutomation);
                const numReplaced = await automation.updateInDatabase();
                console.log(numReplaced);
                automation.startAutomation();

                res.send(automation.automationTask.nextInvocation());

        } else {
            // make new automation

            // TODO: CHECK IF NICKNAME IS DOUBLE
            const automation = new Automation(formattedAutomation);
            automation.getIdByName().then( (id) => {
                memoryAutomations[id] = automation;

                res.send(automation.automationTask.nextInvocation());
            })
        }
    })

    app.post("/api/v2/automations/start", (req,res) => {
        memoryAutomations[req.body.id].startAutomation();
        res.send("started");
    })

    app.post("/api/v2/automations/stop", (req,res) => {
        memoryAutomations[req.body.id].stopAutomation();
        res.send("stopped");
    })

    app.get("/api/v2/automations/get", async (req,res) => {
        database.getAllAutomations().then(automations => {
            res.send(automations);
        })
    })

    app.get("/api/v2/automations/get/:id", async (req,res) => {
        database.getAutomation(req.params.id).then(automation => {
            res.send(automation);
        })
    })

    app.post("/api/v2/automations/remove", async (req,res) => {
        try {
            database.removeAutomation(req.body.id).then(removed => {
                res.sendStatus(200);
            })
        } catch (e) {
            res.sendStatus(500);
            console.error("Error", removed);
        }
    })

// ======


// ===== REWORKED FUNCTIONS FOR QUEUE SYSTEM

    // sendData params: @Request { url: String, body: Object }
    function sendData(Request) {
        return new Promise(async (resolve, reject) => {
            try {
                const data = await mqttNetwork.sendRequest(Request.url, Request.body);
                resolve(data);
            } catch(e) {
                reject(e);
            }
        })
    }

// ======

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

console.log("Loaded main module");
console.log("====");