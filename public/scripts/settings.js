setRipple();

function sendSettings() {
    const newIp = document.getElementById("ipSettingsInput").value;
    const newPort = document.getElementById("portSettingsInput").value;
    const newVersion = document.getElementById("versionSettingsInput").value;

    console.log(newIp, newPort);

    const object = {
        "ip": newIp,
        "port": newPort,
        "version": newVersion,
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
    })
}

function refreshSettings() {
    let ipInput = document.getElementById("ipSettingsInput");
    let portInput = document.getElementById("portSettingsInput");
    let versionInput = document.getElementById("versionSettingsInput");

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