const wakeTimeEle = document.getElementById("wakeTime");
let timeout = null;
wakeTimeEle.addEventListener("input", function(e) {
    clearTimeout(timeout)
    
    timeout = setTimeout(function() {

    }, 3000);
});

function sendWakeTime() {
    
    let wakeTime = wakeTimeEle.value;
    const body = {
        "hourTenths": wakeTime[0],
        "hourSingle": wakeTime[1],
        "minuteTenths": wakeTime[3],
        "minuteSingle": wakeTime[4],
    }
    
    const options = {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
            "Content-Type": "application/json"
        }
    }

    fetch(`${HOST}/api/v2/automations/set/WakeTime`, options).then(res => res.json())
    .then(res => {
        alert(`WakeTime is ${res.wakeTime}`);
    })
}

function startWakeTime() {
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    }

    fetch(`${HOST}/api/v2/automations/start`, options)
    .then(res => {
        makeNotice("Automation started", "Your automation has been started");
    })
}

function stopWakeTime() {
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    }

    fetch(`${HOST}/api/v2/automations/stop`, options)
    .then(res => {
        makeNotice("Automation stopped", "Your automation has been stopped");
    })
}
