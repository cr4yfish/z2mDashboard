console.log("loading Database module")

const Datastore = require("@seald-io/nedb")
// databases:

var db = {}

db.scenes = new Datastore({ filename: "./database/scenes.db", autoload: true})
db.scenes.loadDatabase();

// scene functions:

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



db.mirror = new Datastore({
    filename: "./database/mirror.db", autoload: true,
})
db.mirror.loadDatabase();


// mirror functions

// inserts new mirror, removes old
const makeNewMirror = function(state) {
    return new Promise((resolve, reject) => {

        db.mirror.remove({}, function(err, removedDocs) {
            if(!err) {
                console.log("Removed docs:", removedDocs);
                //resolve(removedDocs);
            } else {
                console.log("ERROR IN DATABASE:", err);
                reject(err);
            }
            
        })

        db.mirror.insert(state, function(err, savedDocs) {
            if(err) {
                console.error(state, err);
            }
            resolve(savedDocs);
        })
    })
}


// retrieves all mirrors, or mirror by timestam, if param set
const getMirror = function() {
    return new Promise((resolve, reject) => {

        // only searches all if no timeStamp param has been given
        let findObj = { };

        db.mirror.find(findObj, function(err, docs) {
            if(err) {
                console.err(err);
            }
            resolve(docs);
        })
    })
}

exports.makeNewMirror = makeNewMirror;
exports.getMirror = getMirror;

db.devices = new Datastore({
    filename: "./database/devices.db", autoload: true,
})
db.devices.loadDatabase();

const makeNewDevices = function(devices, groups) {
    return new Promise((resolve, reject) => {

        db.devices.insert(devices, function(err, docs) {
            if(!err) {
                console.log(docs);
            } else {
                console.log(err);
            }
        })
    })
}

console.log("Database module loaded")
console.log("==========")