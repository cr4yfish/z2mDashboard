console.log("Database module loaded")
console.log("==========")

const Datastore = require("@seald-io/nedb")
const crypto = require("crypto")
// databases:

var db = {}

db.scenes = new Datastore({ filename: "./database/scenes.db", autoload: true})
db.scenes.loadDatabase();



// functions:

// Saves current light config as a scene for the room
const saveCurrentToScene = function(name, group, bri = 254) {
    console.log("saving current scene to database:");
    return new Promise((resolve, reject) => {

        // 2. get group to link to
        const doc = 
        {
            "id": Math.floor(Math.random() * 200),
            "sceneName": name,
            "group": group,
            "bri": bri
        }

        // 3. post document in db
        db.scenes.insert(doc, function(err, doc) {
            if(!err) {
                console.log("===== DONE ====");
                resolve(doc)
            } else {
                console(err);
                reject(err);
            }
        })
    })
}

// gets all scenes, returns array with all scenes
const getAllScenes = function() {
    console.log("returning all scenes")
    let returnDoc;

    return new Promise((resolve, reject) => {
        db.scenes.find({}, function(err, docs) {
            if(!err) {
                console.log("===== DONE ====");
                resolve(docs);
            } else {
                console(err);
                reject(err);
            }
        })
    })
}

exports.getAllScenes = getAllScenes;
exports.saveCurrentToScene = saveCurrentToScene;