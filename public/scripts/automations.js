function closeOverlay() {
    document.getElementById("colorOverlay").style.display = "none";
    try {
        document.getElementById("menu").style.width = "0";
        document.getElementById("menuOpener").style.opacity = "1";
    } catch (e) {
        console.log(e);
    }
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

const removeWrapper = document.createElement("div");
        removeWrapper.setAttribute("class", "removeWrapper");
        removeWrapper.setAttribute("onclick", `removeAutomation('${automation._id}')`);
        const icon = document.createElement("i");
            icon.setAttribute("class", "fa-solid fa-trash");
        removeWrapper.appendChild(icon);
        removeWrapper.style.height = "0px";
        autoWrapper.appendChild(removeWrapper);

    var hammertime = new Hammer(autoWrapper);
    hammertime.get('swipe').set({ direction: Hammer.DIRECTION_VERTICAL });
    hammertime.on("swipeup", function(ev) {
        if(removeWrapper.style.height == "0px") {
            removeWrapper.style.height = "43px";
        } else {
            removeWrapper.style.height = "0px";
        }
    })
    hammertime.on("swipedown", function(ev) {
        if(removeWrapper.style.height == "0px") {
            removeWrapper.style.height = "43px"; 
        } else {
            removeWrapper.style.height = "0px";
        }
    
})

} 

async function getCurrentAutomations() {
    await clearCurrentAutomations();

    // Fill groups
    const groups = localStorage.getItem("groups").split(",");
    groups.forEach(group => {
        const parent = document.getElementById("automationSelectAffectedRooms");

        const option = document.createElement("option");
            option.textContent = group;
            option.setAttribute("value", group);
        parent.appendChild(option);
    })

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
    fetch(url, options).then(res => {
        console.log(res);
        document.getElementById(id).remove();
        localStorage.removeItem("automations");
        localStorage.removeItem("lastUpdated");
    })
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

function newAutomation() {
    document.getElementById("newAutomation").style.display = "block";
}

function closeNewAutomation() {
    document.getElementById("newAutomation").style.display = "none";
}

function saveAutomation() {

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

    console.log("Automation to save:",automationToSave);

    
    automationToSave.scheduleTime = {
        "hourTenths": automationToSave.automationTime[0],
        "hourSingle": automationToSave.automationTime[1],
        "minuteTenths": automationToSave.automationTime[3],
        "minuteSingle": automationToSave.automationTime[4],
    }

    const body = automationToSave;
    
    const options = {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
            "Content-Type": "application/json"
        }
    }

    fetch(`${HOST}/api/v2/automations/set`, options).then(res => res.json())
    .then(res => {
        console.log(res);
        makeNotice("Automation saved", "Your new Automation has been saved");
        document.getElementById("newAutomation").style.display = "none";
        localStorage.removeItem("automations");
        localStorage.removeItem("lastUpdated");
        getCurrentAutomations();
    })    
}

function toggleTag(tag) {
    if(tag.dataset.active == "true") {
        // disable
        tag.dataset.active = "false";      
    } else {
        tag.dataset.active = "true";
    }
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