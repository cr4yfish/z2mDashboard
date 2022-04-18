"use strict"; // express setup

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var mqtt = require("mqtt");

var path = require("path");

var express = require("express");

var app = express();

var fs = require("fs");

var jsonfile = require("jsonfile");

var cors = require("cors");

var _require = require("process"),
    config = _require.config;

var _require2 = require("os"),
    type = _require2.type;

var _require3 = require("express/lib/response"),
    send = _require3.send;

var _require4 = require("path"),
    resolve = _require4.resolve,
    format = _require4.format;

var _require5 = require("http"),
    request = _require5.request;

var _require6 = require("express/lib/application"),
    handle = _require6.handle;

app.set("view engine", "ejs"); //
// global vars
//
// POST request setup

app.use(express.urlencoded({
  extended: false
}));
app.use(express.json()); //
// Port setup

var _PORT = 30000;
app.listen(_PORT); //
// Cors setup

app.use(cors()); //
// cache setup

var cacheTime = 86400000 * 7; // 7 days
//
// expose public folder

app.use(express["static"](path.join(__dirname, "/public"), {
  maxAge: cacheTime
})); //
// init setup

var globals = require("./globals");

var groups = [];
var themeColor;
var configfile = path.join(__dirname, "configfile.json");
var loadedConfig;
var client;
jsonfile.readFile(configfile).then(function (obj) {
  // general settings stuff
  Queue.setRefreshTimer(obj.queue_refresh_timer);
  Queue.setQueueTimeout(obj.queue_timeout_time);
  themeColor = obj.theme_color; // mqtt stuff

  console.log("connecting to ".concat(obj.ip, ":").concat(obj.port));
  globals.setIPAddress("".concat(obj.ip, ":").concat(obj.port));
  client = mqtt.connect("mqtt://".concat(obj.ip, ":").concat(obj.port));
  client.subscribe("zigbee2mqtt", function (err, granted) {
    console.log(granted);
    client.unsubscribe("zigbee2mqtt");
    client.end();
  });
}); //
// custom libs

var database = require("./database");

var Queue = require("./queue");

var mqttNetwork = require("./mqttNetworkFunctions");

function refreshSettings() {
  jsonfile.readFile(configfile).then(function (obj) {
    // general settings stuff
    Queue.setRefreshTimer(obj.queue_refresh_timer);
    Queue.setQueueTimeout(obj.queue_timeout_time);
    themeColor = obj.theme_color;
  });
} // ==== CONFIG STUFF
// writes new data to configfile


app.post("/writeConfig", function (req, res) {
  jsonfile.writeFile(configfile, req.body, function (err) {
    if (!err) {
      try {
        refreshSettings();
        console.log("Writing config, send status");
        res.sendStatus(200).send();
      } catch (err) {
        console.log(err);
        res.sendStatus(500).send();
      }
    } else {
      console.log(err);
    }
  });
}); // returns data from configfile

app.get("/readConfig", function (req, res) {
  jsonfile.readFile(configfile, function (err, obj) {
    if (!err) {
      try {
        console.log("Sending object");
        res.send(obj);
      } catch (err) {
        console.log(err);
      }
    } else {
      console.log(err);
    }
  });
}); ///// --  FRONTEND APIs

app.get("/", function (req, res) {
  res.redirect("/home");
});
app.get("/home", function (req, res) {
  res.render("home.ejs", {
    themeColor: themeColor
  });
});
app.get("/scenes", function (req, res) {
  res.render("scenes.ejs", {
    themeColor: themeColor
  });
});
app.get("/automation", function (req, res) {
  res.render("automation.ejs", {
    themeColor: themeColor
  });
});
app.get("/settings", function (req, res) {
  res.render("settings.ejs", {
    themeColor: themeColor
  });
}); ///////
// ====== BACKEND APIs

app.post("/set/:name/:key/:value", function _callee(req, res) {
  var name, state, value, parsedValue, url, data, request;
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          console.log("== STATE CHANGE ".concat(req.params.name, " ").concat(req.params.key, " ").concat(req.params.value, " == "));
          name = req.params.name;

          if (req.params.key == "color") {
            // add "#"
            value = "#".concat(req.params.value);
          } else {
            value = req.params.value;
          }

          parsedValue = parseInt(value); // find out if the key is a number

          if (parsedValue.toString() == "NaN") {
            // value is a string
            state = "{\"".concat(req.params.key, "\": \"").concat(value, "\"}");
          } else {
            // value is a number
            state = "{\"".concat(req.params.key, "\": ").concat(value, "}");
          }

          url = "zigbee2mqtt/".concat(name, "/set");
          console.log(url, state);
          request = {
            url: url,
            body: state
          };
          _context.prev = 8;
          _context.next = 11;
          return regeneratorRuntime.awrap(Queue.insertNewRequest(request, "sendData"));

        case 11:
          data = _context.sent;
          _context.next = 17;
          break;

        case 14:
          _context.prev = 14;
          _context.t0 = _context["catch"](8);
          data = {
            "Error": _context.t0.reason,
            "Request": _context.t0.Request,
            "done": false
          };

        case 17:
          res.send(data);
          console.log("sentResponse");
          console.log("====== DONE =====");

        case 20:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[8, 14]]);
});
app.get("/getIndivData/:friendlyName/:attribute", function _callee2(req, res) {
  var Request, data;
  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          console.log("=== GETTING ".concat(req.params.friendlyName, " ").concat(req.params.attribute, " ==="));
          Request = {
            reqFriendlyName: req.params.friendlyName,
            reqAttribute: req.params.attribute,
            body: "",
            url: ""
          };
          Request.body = "{\"".concat(Request.reqAttribute, "\": \"\"}");
          Request.url = "zigbee2mqtt/".concat(Request.reqFriendlyName);
          _context2.prev = 4;
          _context2.next = 7;
          return regeneratorRuntime.awrap(getIndivData(Request));

        case 7:
          data = _context2.sent;

          if (data.hasOwnAttribute(Request.reqAttribute)) {
            _context2.next = 13;
            break;
          }

          console.log("Resending");
          _context2.next = 12;
          return regeneratorRuntime.awrap(getIndivData(Request));

        case 12:
          data = _context2.sent;

        case 13:
          res.send(data);
          _context2.next = 19;
          break;

        case 16:
          _context2.prev = 16;
          _context2.t0 = _context2["catch"](4);
          res.status(404).send();

        case 19:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[4, 16]]);
}); // will be deprecated when Queue system rolls out

app.post("/getDataForMultipleLights", function _callee3(req, res) {
  var reqArray, resArray, currentReq, data;
  return regeneratorRuntime.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          console.log("Getting data for multiple lights");
          reqArray = req.body, resArray = [];
          console.log(reqArray);

        case 3:
          if (!(reqArray.length != 0)) {
            _context3.next = 23;
            break;
          }

          console.log(resArray);
          _context3.prev = 5;
          currentReq = reqArray[reqArray.length - 1];
          currentReq.body = currentReq.body.replace(/'/g, '"');
          console.log(currentReq.body, _typeof(currentReq.body));
          _context3.next = 11;
          return regeneratorRuntime.awrap(getIndivData(currentReq));

        case 11:
          data = _context3.sent;
          resArray.push(data);
          reqArray.pop();
          _context3.next = 19;
          break;

        case 16:
          _context3.prev = 16;
          _context3.t0 = _context3["catch"](5);
          console.log(_context3.t0);

        case 19:
          _context3.next = 21;
          return regeneratorRuntime.awrap(sleep(1000));

        case 21:
          _context3.next = 3;
          break;

        case 23:
          res.send(resArray);

        case 24:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[5, 16]]);
}); // get groups

app.get("/getGroups", function (req, res) {
  console.log("Getting groups");
  client = mqtt.connect("mqtt://".concat(globals.getIPAddress()));
  client.on("connect", function () {
    if (groups.length > 0) {
      console.log("using cache");

      try {
        console.log("sending groups");
        res.send(groups);
      } catch (err) {
        console.log(err);
      }

      console.log("====== DONE =======");
    } else {
      var url = "zigbee2mqtt/bridge/groups";
      client.subscribe(url, function (err, granted) {
        client.on("message", function (topic, buffer, packet) {
          var message = buffer.toString();
          console.log("connected to", topic); // make array of friendly names

          var friendlyNames = function friendlyNames() {
            var nameArray = []; // clean message to Array with objects

            var messageArray = function messageArray() {
              message.replace("[", "").replace("]", "");
              return JSON.parse(message);
            }; // get friendly_names out and return them in a new array


            messageArray().forEach(function (group) {
              // dont insert default bind group
              if (group.friendly_name != "default_bind_group") {
                nameArray.push(group.friendly_name);
              }
            });
            return nameArray;
          };

          var names = friendlyNames();
          console.log(names);

          try {
            console.log("Sending names");
            res.send(names);
          } catch (err) {
            console.log(err);
          }

          groups = names;
          console.log("====== DONE =======");
          client.unsubscribe(url);
          client.end();
        });
      });
    }
  });
}); // gets data from bridge

app.get("/getData/:topic", function _callee4(req, res) {
  var topicsArray, request, data;
  return regeneratorRuntime.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          console.log("Getting data from topic");
          topicsArray = req.params.topic.split("&").join().replaceAll(",", "/"); //console.log(topicsArray);

          request = {
            topic: topicsArray,
            url: "zigbee2mqtt/".concat(topicsArray)
          };
          _context4.prev = 3;
          _context4.next = 6;
          return regeneratorRuntime.awrap(Queue.insertNewRequest(request, "getData"));

        case 6:
          data = _context4.sent;
          res.send(data);
          _context4.next = 15;
          break;

        case 10:
          _context4.prev = 10;
          _context4.t0 = _context4["catch"](3);
          console.log("Error at getData/", topicsArray, "Err or not granted");
          console.log(_context4.t0);
          res.status(500).send();

        case 15:
        case "end":
          return _context4.stop();
      }
    }
  }, null, null, [[3, 10]]);
}); // new API

app.post("/api/v2/queue", function _callee5(req, res) {
  var data;
  return regeneratorRuntime.async(function _callee5$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          _context5.prev = 0;
          _context5.next = 3;
          return regeneratorRuntime.awrap(Queue.insertNewRequest(req.body.request, req.body.type));

        case 3:
          data = _context5.sent;
          _context5.next = 9;
          break;

        case 6:
          _context5.prev = 6;
          _context5.t0 = _context5["catch"](0);
          data = {
            "Error": _context5.t0.reason,
            "Request": _context5.t0.Request,
            "done": false
          };

        case 9:
          res.send(data);

        case 10:
        case "end":
          return _context5.stop();
      }
    }
  }, null, null, [[0, 6]]);
}); // ==== MIRROR
// make new mirror

app.get("/refreshMirror", function (req, res) {
  console.log("Refreshing cached data...");
  console.log("Connecting to MQTT broker...");
  client = mqtt.connect("mqtt://".concat(globals.getIPAddress));
  client.on("connect", function () {
    var topic = "bridge/devices";
    var url = "zigbee2mqtt/".concat(topic);
    console.log("Connected, getting data...");
    client.subscribe(url, function (err, granted) {
      if (granted == undefined || err) {
        console.log("Could not subscribe to topic!", url, err);
      } else {
        client.on("message", function (resTopic, buffer, packer) {
          var message = JSON.parse(buffer.toString());
          console.log("Got message, connection fully established.");
          client.unsubscribe(topic);
          client.end();

          try {
            database.makeNewMirror(message).then(function (dataRes) {
              console.log("sending response");
              res.sendStatus(200).send();
            });
          } catch (err) {
            console.log("ERROR AT DATABASE CALL");
            res.send(err);
          }
        });
      }
    });
  });
}); // return mirror

app.get("/getMirror", function (req, res) {
  console.log("Getting mirror...");
  database.getMirror().then(function (databaseRes) {
    console.log("Got", databaseRes);
    console.log("Sending mirror");
    res.send(databaseRes);
  });
}); //
// ===== SCENES
// save scene

app.post("/saveScene/:name/:group/:bri", function (req, res) {
  console.log("saving scene...");
  database.saveCurrentToScene(req.params.name, req.params.group, req.params.bri).then(function _callee6(returnDoc) {
    var url, doc;
    return regeneratorRuntime.async(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            url = "zigbee2mqtt/".concat(returnDoc.group, "/set");
            doc = "{\"scene_store\": ".concat(returnDoc.id, "}");
            console.log("Sending scene", url, doc);
            _context6.next = 5;
            return regeneratorRuntime.awrap(mqttNetwork.sendRequest(url, doc));

          case 5:
            res.status(200).send({
              doc: doc
            });
            console.log("===== DONE ====");

          case 7:
          case "end":
            return _context6.stop();
        }
      }
    });
  });
}); // return scenes

app.get("/getScenes", function (req, res) {
  database.getAllScenes().then(function (returnDocs) {
    //console.log(returnDocs)
    try {
      console.log("Sending scenes");
      res.send(returnDocs);
    } catch (err) {
      console.log(err);
    }
  });
}); // execute scene

app.get("/scene/:groupName/:sceneId", function _callee7(req, res) {
  var url, state;
  return regeneratorRuntime.async(function _callee7$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          console.log("=== EXEC SCENE", req.params.groupName, req.params.sceneId, "===");
          url = "zigbee2mqtt/".concat(req.params.groupName, "/set");
          state = "{\"scene_recall\": ".concat(req.params.sceneId, "}"); // set scene

          _context7.prev = 3;
          _context7.next = 6;
          return regeneratorRuntime.awrap(mqttNetwork.sendRequest(url, state));

        case 6:
          res.status(200);
          _context7.next = 13;
          break;

        case 9:
          _context7.prev = 9;
          _context7.t0 = _context7["catch"](3);
          console.log(_context7.t0);
          res.status(500);

        case 13:
          res.send();
          console.log("=== DONE ===");

        case 15:
        case "end":
          return _context7.stop();
      }
    }
  }, null, null, [[3, 9]]);
}); // ======= UPDATE
// updates program

app.get("/update", function (req, res) {
  console.log("Sending update ok");
  res.status(200).send();
});
app.post("/updateProgram", function (req, res) {
  var _require7 = require('child_process'),
      exec = _require7.exec;

  exec('./update.sh', function (err, stdout, stderr) {
    if (err) {
      //some err occurred
      console.error(err);
      console.log("Sending 500 err");
      res.status(500).send();
    } else {
      // the *entire* stdout and stderr (buffered)
      console.log("stdout: ".concat(stdout));
      console.log("stderr: ".concat(stderr));
      console.log("Sending 200 ok");
      res.status(200).send();
    }
  });
}); // ===== AUTOMATIONS

var _require8 = require("./automations"),
    Automation = _require8.Automation; // holds array of automations. Get one by inserting the id


var memoryAutomations = {};

(function refreshAutomations() {
  var automations;
  return regeneratorRuntime.async(function refreshAutomations$(_context8) {
    while (1) {
      switch (_context8.prev = _context8.next) {
        case 0:
          _context8.next = 2;
          return regeneratorRuntime.awrap(database.getAllAutomations());

        case 2:
          automations = _context8.sent;
          automations.forEach(function (automation) {
            console.log("Got automation:\n".concat(automation.nickname, " with id: ").concat(automation._id, "\n*******"));
            memoryAutomations[automation._id] = new Automation(automation, false);
          });

        case 4:
        case "end":
          return _context8.stop();
      }
    }
  });
})();

app.post("/api/v2/automations/set/:id", function _callee8(req, res) {
  var newAutomation, formattedAutomation, automation, numReplaced, _automation;

  return regeneratorRuntime.async(function _callee8$(_context9) {
    while (1) {
      switch (_context9.prev = _context9.next) {
        case 0:
          newAutomation = req.body;
          console.log("new automation:", newAutomation);
          formattedAutomation = {
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
            transitionSpeed: newAutomation.automationTransitionSpeed
          }; // dumb repeat stuff
          // rework this!

          if (newAutomation.weekday) {
            formattedAutomation.weekday = true;
            formattedAutomation.dayStart = 1;
            formattedAutomation.dayEnd = 5;
          }

          if (newAutomation.weekend) {
            formattedAutomation.weekend = true;
            formattedAutomation.days = 6;
            formattedAutomation.dayEnd = 0;
          }

          if (newAutomation.weekday && newAutomation.weekend) {
            formattedAutomation.dayStart = 0;
            formattedAutomation.dayEnd = 6;
          }

          formattedAutomation.time = {
            minute: "".concat(formattedAutomation.time.minuteTenths).concat(formattedAutomation.time.minuteSingle),
            hour: "".concat(formattedAutomation.time.hourTenths).concat(formattedAutomation.time.hourSingle)
          };

          if (!(req.params.id != "new")) {
            _context9.next = 19;
            break;
          }

          // update old automation
          automation = memoryAutomations[req.params.id];
          automation.stopAutomation();
          automation.setObject(formattedAutomation);
          _context9.next = 13;
          return regeneratorRuntime.awrap(automation.updateInDatabase());

        case 13:
          numReplaced = _context9.sent;
          console.log(numReplaced);
          automation.startAutomation();
          res.send(automation.automationTask.nextInvocation());
          _context9.next = 21;
          break;

        case 19:
          // make new automation
          // TODO: CHECK IF NICKNAME IS DOUBLE
          _automation = new Automation(formattedAutomation);

          _automation.getIdByName().then(function (id) {
            memoryAutomations[id] = _automation;
            res.send(_automation.automationTask.nextInvocation());
          });

        case 21:
        case "end":
          return _context9.stop();
      }
    }
  });
});
app.post("/api/v2/automations/start", function (req, res) {
  memoryAutomations[req.body.id].startAutomation();
  res.send("started");
});
app.post("/api/v2/automations/stop", function (req, res) {
  memoryAutomations[req.body.id].stopAutomation();
  res.send("stopped");
});
app.get("/api/v2/automations/get", function _callee9(req, res) {
  return regeneratorRuntime.async(function _callee9$(_context10) {
    while (1) {
      switch (_context10.prev = _context10.next) {
        case 0:
          database.getAllAutomations().then(function (automations) {
            res.send(automations);
          });

        case 1:
        case "end":
          return _context10.stop();
      }
    }
  });
});
app.get("/api/v2/automations/get/:id", function _callee10(req, res) {
  return regeneratorRuntime.async(function _callee10$(_context11) {
    while (1) {
      switch (_context11.prev = _context11.next) {
        case 0:
          database.getAutomation(req.params.id).then(function (automation) {
            res.send(automation);
          });

        case 1:
        case "end":
          return _context11.stop();
      }
    }
  });
});
app.post("/api/v2/automations/remove", function _callee11(req, res) {
  return regeneratorRuntime.async(function _callee11$(_context12) {
    while (1) {
      switch (_context12.prev = _context12.next) {
        case 0:
          try {
            database.removeAutomation(req.body.id).then(function (removed) {
              res.sendStatus(200);
            });
          } catch (e) {
            res.sendStatus(500);
            console.error("Error", removed);
          }

        case 1:
        case "end":
          return _context12.stop();
      }
    }
  });
}); // ======
// ===== REWORKED FUNCTIONS FOR QUEUE SYSTEM
// sendData params: @Request { url: String, body: Object }

function sendData(Request) {
  return new Promise(function _callee12(resolve, reject) {
    var data;
    return regeneratorRuntime.async(function _callee12$(_context13) {
      while (1) {
        switch (_context13.prev = _context13.next) {
          case 0:
            _context13.prev = 0;
            _context13.next = 3;
            return regeneratorRuntime.awrap(mqttNetwork.sendRequest(Request.url, Request.body));

          case 3:
            data = _context13.sent;
            resolve(data);
            _context13.next = 10;
            break;

          case 7:
            _context13.prev = 7;
            _context13.t0 = _context13["catch"](0);
            reject(_context13.t0);

          case 10:
          case "end":
            return _context13.stop();
        }
      }
    }, null, null, [[0, 7]]);
  });
} // ======


function sleep(ms) {
  return new Promise(function (resolve) {
    return setTimeout(resolve, ms);
  });
}

console.log("Loaded main module");
console.log("====");