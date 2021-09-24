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

    var loadedConfig;

    var client;

    jsonfile.readFile(configfile)
    .then(function(obj) {
        
        console.log(`connecting to ${obj.ip}:${obj.port}`);
        client = mqtt.connect(`mqtt://${obj.ip}:${obj.port}`)


        client.subscribe("zigbee2mqtt", function(err, granted) {
            console.log(granted);
        })
    });

//

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


// turn a lamp on or off
app.post("/set/:name/:key/:value", (req, res) => {
    console.log("state change request")
    let name = req.params.name;
    let state;

    let parsedValue = parseInt(req.params.value);

    // find out if the key is a number
    if(parsedValue.toString() == "NaN") 
    {
       // value is a string
       state = `{"${req.params.key}": "${req.params.value}"}`
     
    } 
    else 
    {
        // value is a number
        state = `{"${req.params.key}": ${req.params.value}}`
    }
    
    let url = `zigbee2mqtt/${name}/set`

    console.log(url, state);

    client.publish(url, state, res.sendStatus(200))
    console.log("====== DONE =====");
})


let groups = [];

// get groups
app.get("/getGroups", (req, res) => {
    console.log("Gettings groups");

    if(groups.length > 0) {
        console.log("using cache");
        res.send(groups)
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
                res.send(names);
                groups = names;
                console.log("====== DONE =======");
                //client.end();
            })
        })
    }
})

// writes new data to configfile
app.post("/writeConfig", (req,res) => {
    console.log("new write config request", req.body);

    jsonfile.writeFile(configfile, req.body, function (err) {
        if(!err) {
            res.sendStatus(200);
        } else {
            res.send(err);
        }
    }) 
})

// returns data from configfile
app.get("/readConfig", (req,res) => {
    jsonfile.readFile(configfile, (err, obj) => {
        if(!err) {
            res.send(obj)
        } else {
            res.send(err);
        }
    })
})


// saves current setup to scenes db
app.get("/saveScene/:name/:group", (req,res) => {
    database.saveCurrentToScene(req.params.name, req.params.group)
    .then(function(returnDoc) {
        console.log(returnDoc);

        // send scene doc to mqtt
        // {"scene_store": SCENE_ID}
        const url = `zigbee2mqtt/${doc.group}/set`
        let doc = `{"scene_store": ${doc.scene-id}}`
        client.publish(url, doc, res.sendStatus(200));
    })
})