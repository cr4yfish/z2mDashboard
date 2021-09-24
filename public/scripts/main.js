(function whereAmI() {
    const anchors = document.querySelectorAll("#menu a");
    console.log(anchors)
    anchors.forEach(function(anchor) {
        if(anchor.text == document.title) {
            anchor.classList.add("active");
        }
    })
})();


function openMenu() {
    document.getElementById("menu").style.width = "250px";
    document.getElementById("menuOpener").style.opacity = "0";

}

function closeMenu() {
    document.getElementById("menu").style.width = "0";
    document.getElementById("menuOpener").style.opacity = "1";
}


const HOST = 'http://localhost:30000'
//const HOST = 'http://192.168.0.100:30000'

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

function toggleLightState(friendlyName) {

    const url = `${HOST}/set/${friendlyName}/state/toggle`;

    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    }

    fetch(url, options)
    .then(function (response) {
        console.log(response);
    })
}



function getGroups() {
    const url = `${HOST}/getGroups`;
    fetch(url)
    .then(response => response.json())

    .then(function(groups) {
        console.log(groups);

        groups.forEach(function(group) {
            const parent = document.getElementById("lightSwitches");

            let lightcard = document.createElement("div");
                lightcard.setAttribute("id", group);
                lightcard.setAttribute("class", "card light-card");

                    let sliderContainer = document.createElement("div");
                    sliderContainer.setAttribute("id", group);
                        sliderContainer.setAttribute("class", "lightSlider");
                    lightcard.appendChild(sliderContainer);

                        let cardBody = document.createElement("div");
                            cardBody.setAttribute("class", "card-body");
                        sliderContainer.appendChild(cardBody);

                            let label = document.createElement("label");
                                label.textContent = group;
                            cardBody.appendChild(label);

            parent.prepend(lightcard);
        })
    })
    .then(function () {
        makeSliders();
    })
}

function saveCurrentScene() {
    //
}