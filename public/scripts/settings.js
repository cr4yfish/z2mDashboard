setRipple();

function sendSettings() {
    const newIp = document.getElementById("ipSettingsInput").value;
    const newPort = document.getElementById("portSettingsInput").value;

    console.log(newIp, newPort);

    const object = {
        "ip": newIp,
        "port": newPort
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
    })
}

