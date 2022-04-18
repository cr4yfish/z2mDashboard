// debug function
function makeDebugAutomation() {
    clearNewAutomationForm();
    const randomArray = ["foo", "bar", "test", "autoaton", "automasda", "asodjsajoda"];
    // title
    document.getElementById("automationName").value = randomArray[Math.floor(Math.random()*randomArray.length-1)]
    document.getElementById("automationTime").value = "12:00";
    saveAutomation();
}

// helper functions
function closeOverlay() {
    document.getElementById("colorOverlay").style.display = "none";
    try {
        document.getElementById("menu").style.width = "0";
        document.getElementById("menuOpener").style.opacity = "1";
    } catch (e) {
        console.log(e);
    }
}

function stopProp(ele) {
    console.log(ele);
    ele.stopPropagation();
}

function clearNewAutomation() {
    return new Promise((resolve,reject) => {
        const newAutomationWrapper = document.getElementById("newAutomation");
        try {
            newAutomationWrapper.querySelectorAll("input").forEach(input => {
                input.value = "";
            })
            resolve();
        } catch(e) {
            console.error(e);
            reject();
        }
    })
}

async function clearCurrentAutomations() {
    return new Promise((resolve,reject) => {
        let currentAutomations = document.querySelectorAll(".automationWrapper");
        console.log(currentAutomations);
        for(i = currentAutomations.length-1; i >= 0; i--) {
            currentAutomations[i].remove();
        }
        resolve();
    })
}

function closeNewAutomation() {
    document.getElementById("newAutomation").style.display = "none";
    clearNewAutomation();
}

function toggleTag(tag) {
    if(tag.dataset.active == "true") {
        // disable
        tag.dataset.active = "false";      
    } else {
        tag.dataset.active = "true";
    }
}

async function openAutomation(id) {
    const newAutomation = document.getElementById("newAutomation");
    newAutomation.querySelector(".title h1").textContent = "Edit Automation";
    const wrapper = newAutomation;

    getAutomation(id).then(automation => {
        console.log(automation);

        document.getElementById("automationName").value = automation.nickname;
        document.getElementById("automationTime").value = `${automation.time.hour}:${automation.time.minute}`;
        document.getElementById("automationActionSelect").value = automation.action;
        document.getElementById("automationSelectAffectedRooms").value = automation.rooms;
        
        if(automation.weekday) {
            document.getElementById("automationRepeat").querySelector(".tag[data-tag='weekday']").dataset.active = true;
        }
        if(automation.weekend) {
            document.getElementById("automationRepeat").querySelector(".tag[data-tag='weekend']").dataset.active = true;
        }
        if(automation.smoothStateChange) {
            document.getElementById("automationSmoothStateChange").value = true;
        }
       
        wrapper.style.display = "block";

        newAutomation.querySelector(".btn-primary").setAttribute("onclick", `saveAutomation('${id}')`)
    })
}


// automation internal stuff
function makeAutomations(automation) {

    const autoWrapper = document.createElement("div");
    autoWrapper.setAttribute("class", "automationWrapper")
    autoWrapper.setAttribute("id", automation._id);
    autoWrapper.setAttribute("onclick", "toggleAutomation(this)");
    if(automation.active) {
        autoWrapper.dataset.active = "true";
    } else {
        autoWrapper.dataset.active = "false";
    }

    const autoTitleWrapper = document.createElement("div");
        autoTitleWrapper.setAttribute("class", "autoTitleWrapper");
        const autoTitle = document.createElement("div");
            autoTitle.textContent = automation.nickname;
        autoTitle.setAttribute("class", "automationNickname");
        autoTitleWrapper.appendChild(autoTitle);

        const autoTime = document.createElement("div");
            autoTime.textContent = `${automation.time.hour}:${automation.time.minute}`;
        autoTitleWrapper.appendChild(autoTime);
    autoWrapper.appendChild(autoTitleWrapper);
    const tags = document.createElement("div");
        tags.setAttribute("class", "tagWrapper");

    const actionWrapper = document.createElement("div");
        actionWrapper.setAttribute("class", "actionWrapper");
    autoWrapper.appendChild(actionWrapper);

        const actionlabel = document.createElement("span");
            actionlabel.textContent = "Action";
        actionWrapper.appendChild(actionlabel);
        const action = document.createElement("span");
            action.textContent = automation.action;
        actionWrapper.appendChild(action);

    if(automation.smoothStateChange) {
        const smoothWrapper = document.createElement("div");
            smoothWrapper.setAttribute("class", "actionWrapper");
        autoWrapper.appendChild(smoothWrapper);

        const smoothLabel = document.createElement("span");
            smoothLabel.textContent = "Transition Speed";
        smoothWrapper.appendChild(smoothLabel);
        const smooth = document.createElement("span");
            smooth.textContent = `${automation.transitionSpeed}%p/s`;
        smoothWrapper.appendChild(smooth);
    }
        if(automation.weekday) {
            const weekdayTag = document.createElement("span");
                weekdayTag.textContent = "weekday";
                weekdayTag.setAttribute("class", "tag");
                if(automation.active) {
                    weekdayTag.dataset.active = true;
                }
            tags.appendChild(weekdayTag);
        }
        
        if(automation.weekend) {
            const weekendTag = document.createElement("span");
                weekendTag.textContent = "weekend";
                weekendTag.setAttribute("class", "tag");
                if(automation.active) {
                    weekendTag.dataset.active = true;
                }
            tags.appendChild(weekendTag);
        }
        
    autoWrapper.appendChild(tags);

document.getElementById("current_automations").append(autoWrapper);

const iconWrapper = document.createElement("div");
        iconWrapper.setAttribute("class", "iconWrapper");
    autoWrapper.appendChild(iconWrapper);
    
const editWrapper = document.createElement("div");
        editWrapper.setAttribute("class", "editWrapper");
        editWrapper.setAttribute("onclick", `openAutomation('${automation._id}'); event.stopPropagation();`);
    iconWrapper.appendChild(editWrapper);
        const editIcon = document.createElement("i");
            editIcon.setAttribute("class", "fa-solid fa-pen");
        editWrapper.appendChild(editIcon);

const removeWrapper = document.createElement("div");
        removeWrapper.setAttribute("class", "removeWrapper");
        removeWrapper.setAttribute("onclick", `removeAutomation('${automation._id}')`);
    iconWrapper.appendChild(removeWrapper);

        const trashIcon = document.createElement("i");
            trashIcon.setAttribute("class", "fa-solid fa-trash");
        removeWrapper.appendChild(trashIcon);
        removeWrapper.style.height = "0px";
        
    var hammertime = new Hammer(autoWrapper);
    hammertime.get('swipe').set({ direction: Hammer.DIRECTION_VERTICAL });
    hammertime.on("swipeup", function(ev) {
        if(removeWrapper.style.height == "0px") {
            removeWrapper.style.height = "43px";
            editWrapper.style.height = "43px";
        } else {
            removeWrapper.style.height = "0px";
            editWrapper.style.height = "0px";
        }
    })
    hammertime.on("swipedown", function(ev) {
        if(removeWrapper.style.height == "0px") {
            removeWrapper.style.height = "43px"; 
            editWrapper.style.height = "43px";
        } else {
            removeWrapper.style.height = "0px";
            editWrapper.style.height = "0px";

        }
    })
} 

async function getCurrentAutomations() {
    await clearCurrentAutomations();
    try {
        // Fill groups
        if(!document.getElementById("automationSelectAffectedRooms").querySelectorAll("option").length > 0) {
            const groups = localStorage.getItem("groups").split(",");
            groups.forEach(group => {
                const parent = document.getElementById("automationSelectAffectedRooms");
        
                const option = document.createElement("option");
                    option.textContent = group;
                    option.setAttribute("value", group);
                parent.appendChild(option);
            })
        }
    } catch (e) { console.error(e); }

    let diff;
    if(localStorage.hasOwnProperty("lastUpdated")) {
        const currentDate = new Date().getTime(),
        lastUpdated = parseInt(localStorage.getItem("lastUpdated"));
        diff = currentDate - lastUpdated;
    } else {
        diff = false;
    }

    const _LASTUPDATE_DIFF_IN_DAYS = 2;

    // updates localStorage if no cache was made or if
    // lastUpdate is longer than n days ago
    if(true) {
        const url = `${HOST}/api/v2/automations/get`;
        fetch(url).then(res => res.json()).then(res => {
            console.log(res);
    
            localStorage.setItem("automations", JSON.stringify(res));
            localStorage.setItem("lastUpdated", cleanTimeString(getTimeString()));
            res.forEach(automation => {
                makeAutomations(automation);
            })
        })
    } else {
        JSON.parse(localStorage.getItem("automations")).forEach(automation => {
            makeAutomations(automation);
        })
    }
}

async function getAutomation(id) {
    return new Promise((resolve,reject) => {
        const url = `${HOST}/api/v2/automations/get/${id}`;
        fetch(url).then(res => res.json()).then(res => {
            resolve(res[0]);
        })
    })
}

function removeAutomation(id) {
    const url = `${HOST}/api/v2/automations/remove`;
    const body = {
        id: id,
    }
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body),
    }
    try {
        fetch(url, options).then(res => {
            console.log(res);
            document.getElementById(id).remove();
            localStorage.removeItem("automations");
            localStorage.removeItem("lastUpdated");
            if(res.status != 200) {
                console.error("status is not 200");
                makeNotice("Warning", "The automation could not be removed", "negative");
            } else {
                makeNotice("Notice", "The automation has been removed");
            }
        })
    } catch(e) {
        console.error(e);
        makeNotice("Warning", "The automation could not be removed", "negative");
    }
}

function toggleAutomation(ele) {
    let endpoint, newState;
    if(ele.dataset.active == "true") {
        endpoint = "stop";
        newState = false;
    } else {
        endpoint = "start";
        newState = true;
    }

    const body = {
        id: ele.id,
        automationName: ele.querySelector(".automationNickname").textContent,
    }

    const options = {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
            "Content-Type": "application/json"
        }
    }

    const url = `${HOST}/api/v2/automations/${endpoint}`;
    fetch(url, options).then(res => {
        ele.dataset.active = newState;
        ele.querySelectorAll(".tag").forEach(tag => {
            tag.dataset.active = newState;
        })
    })
}

function clearNewAutomationForm() {
    const form = document.getElementById("newAutomation");
    const formEles = form.querySelectorAll(".toSave");
    formEles.forEach(ele => {
        try {
            ele.value = "";
        } catch(e) {
            console.error("Expected:", e);
        }
    })

    form.querySelector(".btn-primary").setAttribute("onclick", "saveAutomation();");
}

function newAutomation() {
    clearNewAutomationForm();
    document.getElementById("newAutomation").querySelector(".title h1").textContent = "New Automation";
    document.getElementById("newAutomation").style.display = "block";
}

function saveAutomation(id = "new") {

    let automationToSave = {};

    // inputs
    let inputs = document.querySelectorAll("#newAutomation .toSave");
    inputs.forEach(input => {
        automationToSave[input.id] = input.value;
    })

    // checkbox
    automationToSave["automationSmoothStateChange"] = document.getElementById("automationSmoothStateChange").checked;

    // exit when no nickname given
    if(automationToSave.automationName.length == 0) {
        alert("Please enter an automation Name");
        return;
    }

    // repeats
    const repeatTags = document.querySelectorAll("#automationRepeat .tag");
    repeatTags.forEach(tag => {
        let rawTag = tag.dataset.tag;

        isActive = false;
        if(tag.dataset.active == "true") {
            isActive = true;
        }
        automationToSave[rawTag] = isActive;
    })

    console.log("Automation to save:",automationToSave, id);

    
    automationToSave.scheduleTime = {
        "hourTenths": automationToSave.automationTime[0],
        "hourSingle": automationToSave.automationTime[1],
        "minuteTenths": automationToSave.automationTime[3],
        "minuteSingle": automationToSave.automationTime[4],
    }

    if(id.length == 0) {
        automationToSave._id = id;
    }

    const body = automationToSave;
    
    const options = {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
            "Content-Type": "application/json"
        }
    }
    let url = `${HOST}/api/v2/automations/set`;
    url += `/${id}`;

    fetch(url, options)
    .then(res => {
        console.log(res);
        makeNotice("Automation saved", "Your new Automation has been saved");
        document.getElementById("newAutomation").style.display = "none";
        localStorage.removeItem("automations");
        localStorage.removeItem("lastUpdated");
        getCurrentAutomations();
    })    
}


// TIME UTILS

// returns normalized timestrings -> 0h 0min 0sec
function cleanTimeString(str) {
    var date = new Date(str);

    let hours = date.getHours() * 3600000;
    let minutes = date.getMinutes() * 60000;
    let seconds = date.getSeconds() * 1000;

    str = str - (hours+minutes+seconds) + 1000;
    //console.log(new Date(str));
    return str;
}

function getTimeString() {
    return new Date().getTime();
}

function getOneDayInMs() {
    return 86400000;
}