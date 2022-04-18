"use strict";

console.log("loading Database module");

var Datastore = require("@seald-io/nedb"); // databases:


var db = {};
db.scenes = new Datastore({
  filename: "./database/scenes.db",
  autoload: true
});
db.scenes.loadDatabase(); // scene functions:
// Saves current light config as a scene for the room

var saveCurrentToScene = function saveCurrentToScene(name, group) {
  var bri = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 254;
  console.log("saving current scene to database:");
  return new Promise(function (resolve, reject) {
    // 2. get group to link to
    var doc = {
      "id": Math.floor(Math.random() * 200),
      "sceneName": name,
      "group": group,
      "bri": bri
    }; // 3. post document in db

    db.scenes.insert(doc, function (err, doc) {
      if (!err) {
        console.log("===== DONE ====");
        resolve(doc);
      } else {
        console(err);
        reject(err);
      }
    });
  });
}; // gets all scenes, returns array with all scenes


var getAllScenes = function getAllScenes() {
  console.log("returning all scenes");
  var returnDoc;
  return new Promise(function (resolve, reject) {
    db.scenes.find({}, function (err, docs) {
      if (!err) {
        console.log("===== DONE ====");
        resolve(docs);
      } else {
        console(err);
        reject(err);
      }
    });
  });
};

exports.getAllScenes = getAllScenes;
exports.saveCurrentToScene = saveCurrentToScene;
db.mirror = new Datastore({
  filename: "./database/mirror.db",
  autoload: true
});
db.mirror.loadDatabase(); // mirror functions
// inserts new mirror, removes old

var makeNewMirror = function makeNewMirror(state) {
  return new Promise(function (resolve, reject) {
    db.mirror.remove({}, function (err, removedDocs) {
      if (!err) {
        console.log("Removed docs:", removedDocs); //resolve(removedDocs);
      } else {
        console.log("ERROR IN DATABASE:", err);
        reject(err);
      }
    });
    db.mirror.insert(state, function (err, savedDocs) {
      if (err) {
        console.error(state, err);
      }

      resolve(savedDocs);
    });
  });
}; // retrieves all mirrors, or mirror by timestam, if param set


var getMirror = function getMirror() {
  return new Promise(function (resolve, reject) {
    // only searches all if no timeStamp param has been given
    var findObj = {};
    db.mirror.find(findObj, function (err, docs) {
      if (err) {
        console.err(err);
      }

      resolve(docs);
    });
  });
};

exports.makeNewMirror = makeNewMirror;
exports.getMirror = getMirror;
db.devices = new Datastore({
  filename: "./database/devices.db",
  autoload: true
});
db.devices.loadDatabase();

var makeNewDevices = function makeNewDevices(devices, groups) {
  return new Promise(function (resolve, reject) {
    db.devices.insert(devices, function (err, docs) {
      if (!err) {
        console.log(docs);
      } else {
        console.log(err);
      }
    });
  });
};

db.automations = new Datastore({
  filename: "./database/automations.db",
  autoload: true
});
db.automations.loadDatabase();

var makeNewAutomation = function makeNewAutomation(automation) {
  return new Promise(function (resolve, reject) {
    db.automations.insert(automation, function (err, doc) {
      if (!err) {
        db.automations.compactDatafile();
        resolve(doc._id);
      } else {
        reject(err, doc);
      }
    });
  });
};

var getAllAutomations = function getAllAutomations() {
  return new Promise(function (resolve, reject) {
    db.automations.find({}, function (err, docs) {
      if (!err) {
        resolve(docs);
      } else {
        reject(err, docs);
      }
    });
  });
};

var getAutomation = function getAutomation(id) {
  return new Promise(function (resolve, reject) {
    db.automations.find({
      _id: id
    }, function (err, docs) {
      if (!err) {
        resolve(docs);
      } else {
        reject(err, docs);
      }
    });
  });
};

var getIdByName = function getIdByName(name) {
  return new Promise(function (resolve, reject) {
    db.automations.find({
      nickname: name
    }, function (err, docs) {
      if (!err) {
        if (docs.length > 0) {
          resolve(docs[0]._id);
        } else {
          resolve([{
            _id: ""
          }]);
        }

        ;
      } else {
        reject(err, docs);
      }
    });
  });
}; // replaced document by given id


var updateAutomation = function updateAutomation(newState) {
  return new Promise(function _callee(resolve, reject) {
    var _ref, numReplaced;

    return regeneratorRuntime.async(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return regeneratorRuntime.awrap(db.automations.updateAsync({
              _id: newState.id
            }, newState));

          case 2:
            _ref = _context.sent;
            numReplaced = _ref.numReplaced;
            db.automations.compactDatafile();
            resolve(numReplaced);

          case 6:
          case "end":
            return _context.stop();
        }
      }
    });
  });
}; // remove automation


var removeAutomation = function removeAutomation(id) {
  return new Promise(function (resolve, reject) {
    db.automations.remove({
      _id: id
    }, function (err, numRemoved) {
      if (!err) {
        db.automations.compactDatafile();
        resolve(numRemoved);
      } else {
        reject(err);
      }
    });
  });
};

exports.makeNewAutomation = makeNewAutomation;
exports.getAllAutomations = getAllAutomations;
exports.getAutomation = getAutomation;
exports.updateAutomation = updateAutomation;
exports.removeAutomation = removeAutomation;
exports.getIdByName = getIdByName;
console.log("Database module loaded");
console.log("==========");