setRipple();

function closeOverlay() {
    document.getElementById("colorOverlay").style.display = "none";
    try {
        document.getElementById("menu").style.width = "0";
        document.getElementById("menuOpener").style.opacity = "1";
    } catch (e) {
        console.log(e);
    }
}

function fillColors() {
    console.log("settings colors");
    const colorArray = document.querySelectorAll(".themeColorOption");
    colorArray.forEach(colorEle => {
        const color = colorEle.dataset.primary;
        colorEle.style.backgroundColor = color;

        if(colorEle.dataset.activecolor == "true") {
            colorEle.style.boxShadow = `0 0 10px ${color}`;
        } else {
            colorEle.style.boxShadow = "none";
        }
        
        if(color == "#FFFF") {
            colorEle.style.border = "solid 1px black";
        } else {
            colorEle.style.border = "none";
        }
    })
}

function setActiveColor(colorEle) {
    document.querySelectorAll(".themeColorOption").forEach(ele => { ele.dataset.activecolor = "false" });
    colorEle.dataset.activecolor = "true";

    fillColors();

    // change css
    let rootVars = document.documentElement.style;
    rootVars.setProperty("--themeColor", colorEle.dataset.primary);
    rootVars.setProperty("--themeBG", colorEle.dataset.bg);
}

function sendSettings() {
    const newIp = document.getElementById("ipSettingsInput").value;
    const newPort = document.getElementById("portSettingsInput").value;
    const newVersion = document.getElementById("versionSettingsInput").value;
    const newRefreshTime = document.getElementById("queue_refresh_timer").value;
    const newTimeoutTime = document.getElementById("queue_timeout_time").value;

    const newThemeColorPrimary = document.querySelector("[data-activecolor='true']").dataset.primary;
    const newThemeColorBackground = document.querySelector("[data-activecolor='true']").dataset.bg;

    console.log(newIp, newPort);

    const object = {
        "ip": newIp,
        "port": newPort,
        "version": newVersion,
        "queue_timeout_time": newTimeoutTime,
        "queue_refresh_timer": newRefreshTime,
        "theme_color": {
            "primary": newThemeColorPrimary,
            "background": newThemeColorBackground
        },
    }

    const url = `${HOST}/writeConfig`;
    const options = {
        method: "POST",
        body: JSON.stringify(object),
        headers: {
            "Content-Type": "application/json"
        }
    }

    fetch(url, options)
    .then(function (response) {
        console.log(response);

        if(response.status == 200) {
            makeNotice("Sent settings", "Settings have been successfully synced with server.", "positive");
        } else {
            makeNotice("Exception","Could not sync settings with server! Error Code:", response.status, "negative");
        }
    })
}

function refreshSettings() {
    let ipInput = document.getElementById("ipSettingsInput");
    let portInput = document.getElementById("portSettingsInput");
    let versionInput = document.getElementById("versionSettingsInput");
    let queueRefreshTime = document.getElementById("queue_refresh_timer");
    let queueTimeoutTime = document.getElementById("queue_timeout_time");
    let themeColorArray = document.querySelectorAll(".themeColorOption");

    const url = `${HOST}/readConfig`;
    const options = {
        method: "GET",
    }

    fetch(url, options)
    .then(response => response.json())
    .then(function(res) {
        console.log(res);

        ipInput.value = res.ip;
        portInput.value = res.port;
        versionInput.value = res.version;
        queueRefreshTime.value = parseInt(res.queue_refresh_timer);
        queueTimeoutTime.value = parseInt(res.queue_timeout_time);

        themeColorArray.forEach(themeColorEle => {
            if(themeColorEle.dataset.primary == res.theme_color.primary) {
                // make active
                themeColorEle.dataset.activecolor = "true";
            } else {
                themeColorEle.dataset.activecolor = "false";
            }
        })

        fillColors();

    })
}

function checkUpdates() {
    const updateHosterUrl = "cr4yfish.digital:8443/updateService/z2m";

    fetch(url).then(res => res.json())
    .then(function(res) {
        console.log(res);

        try {
            const currentVersion = parseInt(document.getElementById("versionSettingsInput").value);
            if(res.version > currentVersion) {
                makeNotice(`New version ${res.version} is available. <u onclick="update();">Download now?</u>`)
            }
        }
        catch(e) {
            console.error(e);
        }
    })
}

function update() {
    return new Promise((resolve, reject) => {
        resolve(true);
        setVersion("23");
    })
}

function setVersion(ver) {
    const versionEle = document.getElementById("versionSettingsInput").textContent;

    versionEle = ver;
}

function selectThemeColor() {
    const active = document.querySelector(".themeColorOption .selected");

    active.style.boxShadow = `0 0 10px ${active.style.backgroundColor}`; 
}