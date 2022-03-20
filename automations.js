const schedule = require("node-schedule");
let database = require("./database");
let Queue = require("./queue");

class Automation {
    time; rooms; action; request; nickname; active;
    weekday; weekend; scheduleRule; dayStart; dayEnd;
    automationTask; smoothStateChange; transitionSpeed;
    
    // constructor
        constructor(reqAutomation, makeDatabaseEntry = true) {
            this.nickname = reqAutomation.nickname;
            this.time = reqAutomation.time;
            this.rooms = reqAutomation.rooms;
            this.action = reqAutomation.action;
            this.weekday = reqAutomation.weekday;
            this.weekend = reqAutomation.weekend;
            this.dayStart = reqAutomation.dayStart;
            this.dayEnd = reqAutomation.dayEnd;
            this.smoothStateChange = reqAutomation.smoothStateChange;
            this.transitionSpeed = reqAutomation.transitionSpeed;
            this.makeRule();
            this.request = {
                url: `zigbee2mqtt/${this.rooms}/set`,
                body: `{\"state\": \"${this.action}\"}`,
            };
            this.makeRequest();
            this.active = true;
            if(makeDatabaseEntry) {
                this.saveInDatabase();
            };
            let that = this;
            this.automationTask = schedule.scheduleJob(this.scheduleRule, async function() {
                try {
                    console.log("Performing job");
                    await Queue.insertNewRequest(that.request, "sendData");
                } catch(e) {
                    console.error(e);
                }
                
            });
        }

    // utils
        getScheduleTime() { return time; }

        overwriteTime(newTime) {
            this.automationTask.stop();
            this.time = newTime;
            this.automationTask.start();
        }

        startAutomation() {
            this.active = true;
            this.automationTask.reschedule();
            this.update();
        }

        stopAutomation() {
            this.active = false;
            this.automationTask.cancel();
            this.update();
        }

        getName() {
            return this.nickname;
        }

        getObject() {
            return { 
                rooms: this.rooms, 
                time: this.time, 
                action: this.action, 
                nickname: this.nickname, 
                active: this.active,
                weekend: this.weekend,
                weekday: this.weekday,
                dayStart: this.dayStart,
                dayEnd: this.dayEnd,
                smoothStateChange: this.smoothStateChange,
                transitionSpeed: this.transitionSpeed,
            };
        }

        makeRule() {
            this.scheduleRule = new schedule.RecurrenceRule();
            this.scheduleRule.dayOfWeek = [0 , new schedule.Range(this.dayStart,this.dayEnd)];
            this.scheduleRule.minute = this.time.minute;
            this.scheduleRule.hour = this.time.hour;
            this.scheduleRule.tz = "Europe/Berlin";
        }

        saveInDatabase() {
            try {
                database.makeNewAutomation(this.getObject());
            } catch (e) {
                console.error(e);
            }
        }

        update() {
            try {
                database.updateAutomation(this.getObject());
            } catch(e) {
                console.error(e);
            }
        }

    // internal
        makeRequest() {
            let that = this, mod = "", defBright = 2;
            if(this.action == "off") {
                mod = "-";
                defBright = 99;
            }
            if(this.smoothStateChange) {
                this.request.body = `{\"state\": \"on",\"brightness\": \"${defBright}",\"brightness_move\": \"${mod}${this.transitionSpeed}"}`;
            }
        }

    // output
        getAutomationRequest = function() {
            return this.request;
        }
};

exports.Automation = Automation;