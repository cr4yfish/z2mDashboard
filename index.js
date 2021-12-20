"use strict"

// express setup

    const mqtt = require("mqtt")
    const path = require("path")
    const express = require("express");
    const app = express();
    const database = require("./database");
    const fs = require("fs");
    const jsonfile = require("jsonfile");
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


// expose public folder

    app.use(express.static(path.join(__dirname, "/public")));

//

// MQTT init setup

    const configfile = path.join(__dirname, "configfile.json");
    
    let _IPADDRESS;

    var loadedConfig;

    var client;

    var worker;

    jsonfile.readFile(configfile)
    .then(function(obj) {
        
        console.log(`connecting to ${obj.ip}:${obj.port}`);

        _IPADDRESS =`${obj.ip}:${obj.port}`; 

        client = mqtt.connect(`mqtt://${obj.ip}:${obj.port}`)


        client.subscribe("zigbee2mqtt", function(err, granted) {
            console.log(granted);
        })
    });



//

// writes new data to configfile
app.post("/writeConfig", (req,res) => {
    console.log("new write config request", req.body);

    jsonfile.writeFile(configfile, req.body, function (err) {
        if(!err) {
            try {
                res.sendStatus(200);
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


app.post("/set/:name/:key/:value", (req, res) => {
    console.log("state change request")
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

    client.publish(url, state , function(err, packet) {
        //console.log(err, packet);
        try {
            res.sendStatus(200);
        }
        catch (err) {
            console.log(err);
        }
    })
    console.log("====== DONE =====");
})


let groups = [];

// get groups
app.get("/getGroups", (req, res) => {
    console.log("Getting groups");

    if(groups.length > 0) {
        console.log("using cache");
        try {
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
                    res.send(names);
                }
                catch (err) {
                    console.log(err);
                }
                groups = names;
                console.log("====== DONE =======");
                //client.end();
                client.unsubscribe(url);
            })
        })
    }
})

// gets data from bridge
app.get("/getData/:topic", (req, res) => {
    console.log("Getting data from topic");
    let topicsArray = req.params.topic.split("&");
    //console.log(topicsArray);

    const topic = topicsArray.join().replace(",", "/");

    worker = mqtt.connect(`mqtt://${_IPADDRESS}`);

    worker.on("connect", function() {
        const url = `zigbee2mqtt/${topic}`;
        console.log(`Getting data from ${url}`);
    
        worker.subscribe(url, function(err, granted) {   
            
            if(granted == undefined || err) {
                console.log("Error at getData/", topic, "Err or not granted");
                console.log(err);
            }
    
            worker.on("message", function(resTopic, buffer, packet) {
                let message = JSON.parse(buffer.toString());
                console.log("connected to", topic);

                worker.unsubscribe(topic);

                try {
                    res.send(message);
                    console.log("Sent message");
                }
                catch (err) {
                    console.log("Error at getData/", topic, "message could not be sent");
                    console.log(err);
                }
                
                //worker.end();
                console.log("====== DONE =======");
            })
        })
    })
})

app.get("/refreshMirror", function(req,res) {
  console.log("Refreshing cached data...");

  console.log("Connecting to MQTT broker...");

  worker = mqtt.connect(`mqtt://${_IPADDRESS}`);
  worker.on("connect", function() {
    const topic = "bridge/devices";
    const url = `zigbee2mqtt/${topic}`;
    console.log("Connected, getting data...");

    worker.subscribe(url, function(err, granted) {
        if(granted == undefiend || err) {
            console.log("Could not subscribe to topic!", url, err);
        } else {
            worker.on("message", function(resTopic, buffer, packer) {
                let message = JSON.parse(buffer.toString());
                console.log("Got message, connection fully established.");

                worker.unsubscribe(topic);

                try {
                    database.makeNewMirror(message).then(function(dataRes) {
                        console.log(dataRes);
                        res.sendStatus(200);
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
        client.publish(url, doc, res.sendStatus(200));
        console.log("===== DONE ====")
    })
})

// returns scenes
app.get("/getScenes", (req, res) => {
    database.getAllScenes()
    .then(function(returnDocs) {
        //console.log(returnDocs)
        try {
            res.send(returnDocs);
        }
        catch (err) {
            console.log(err);
        }
    })
})


// executes scene
app.get("/scene/:groupName/:sceneId", (req, res) => {
    console.log("executing scene")
    let url = `zigbee2mqtt/${req.params.groupName}/set`

    let msg = `{"scene_recall": ${req.params.sceneId}}`

    // set scene
    client.publish(url, msg, function(err, packet) {
        //console.log(err, packet); 
        try {
            res.sendStatus(200);
        }
        catch (err) {
            console.log(err);
        }
        console.log("======== DONE ========")
    })
})

// updates program
app.get("/update", (req, res) => {
    res.sendStatus(200);
})

app.post("/updateProgram", function(req, res) {
    const { exec } = require('child_process');
    exec('./update.sh', (err, stdout, stderr) => {
    if (err) {
        //some err occurred
        console.error(err)
        res.sendStatus(500);
    } else {
    // the *entire* stdout and stderr (buffered)
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
    res.sendStatus(200);
    }
    });
})

