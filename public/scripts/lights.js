const LocalStorageHandler = {
    array: [],

    get: function() {
        return this.array;
    },

    add: function(newItem) {
        console.log("localstorageHandler", newItem);
        if(!this.array.includes(newItem)) {
            this.array.push(newItem);
        }
    },

    clear: function () {
        this.array.forEach(function (item) {
            localStorage.removeItem(item);
        })
    },

}

function toggleLightState(friendlyName) {
    console.log("toggling light state", friendlyName);

    const url = `${HOST}/set/${friendlyName}/state/toggle`,

        options = { method: "POST", headers: { "Content-Type": "application/json" } }

    fetch(url, options)
    .then(function (response) {} )
}

function toggleLightStateNew(friendlyName) {
    // get current state
    const lightState = document.getElementById(friendlyName);
    let newState, newColor = lightState.style.backgroundColor, alpha;

    switch(lightState.dataset.ison) {
        case "true":
            newState = false;
            alpha = 0.5;
            lightState.dataset.ison = false;
            break;
        case "false":
            newState = true;
            alpha = 1;
            lightState.dataset.ison = true;
            break;
        default:
            newState = true;
            alpha = 1;
            lightState.dataset.ison = true;
            break;
    }

    // convert to rgb, if necessary
    if(!newColor.includes("rgb")) {
        newColor = hexToRgb(oldColor);
        newColor = `${newColor.r} ${newColor.b} ${newColor.b} ${alpha}`;
    } else {
        let lastIndex = newColor.indexOf(")"), startIndex = newColor.indexOf("(");
        newColor = `rgba${newColor.substring(startIndex, lastIndex - 1)}, ${alpha})`;
    }

    lightState.style.backgroundColor = newColor;
    console.log(newColor);

    
    // send request to server
    const url = `${HOST}/api/v2/queue`;
    const options = {
        "method": "POST",
    }
    fetch(url, options).then(res => res.json()).then(res => {
        console.log(res);

        // update DOM state
        if(res.done == true) {
            // light has been successfully switched
            // change DOM props
            
            
            

        }
    })
}

function refreshState(friendlyName, state) {
    var slider = document.getElementById(`${friendlyName}`);

    if(state == "OFF") {
        slider.noUiSlider.set([null, 0]);
    }
}

function makeSwiper() {
    const swiper = new Swiper('.swiper', {
        direction: "horizontal",
        loop: false,
    });
}

// === HELPER FUNCs

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // needed for stacked onclicks()
    function stopProp() {
        this.event.stopPropagation();
    }

//



// ==== GROUPS

    function getGoupsNetwork() {
        return new Promise((resolve, reject) => {
            if(localStorage.hasOwnProperty("groups")) {
                resolve(localStorage.getItem("groups").split(","));
            } else {
                const url = `${HOST}/getGroups`;
                fetch(url)
                .then(response => response.json())
                .then(function(groups) {
                    localStorage.setItem("groups", groups);
                    LocalStorageHandler.add("groups");
                    resolve(groups);
                })
            }
        })
    }

    function getGroups() {
        console.log("getting groups from lights");
        getGoupsNetwork()
        .then(groups => {
            groups.forEach(async function(group) {
                const parent = document.getElementById("groups"),
                      randomColor = arrayOfRandomColors[Math.floor(Math.random() * arrayOfRandomColors.length)];

                parent.appendChild(makeLightSlider(group, { state: true, color: randomColor, openGroup: true }));
                await makeSlider(group);
                //await refreshData(group);
            })
        })
        // make lights
        .then(function() {
            console.log("Getting devices data")
            let lights = [];
            if(localStorage.hasOwnProperty("lights")) {
                // load lights from cache
                console.log("using cached data");
                lights = JSON.parse(localStorage.getItem("lights"));
                makeLights(lights);
            } else {
                console.log("getting new data");
                let url = `${HOST}/getData/bridge&devices`
                fetch(url)
                .then(data => data.json())
                .then(function(data) {
                    // sort out lights
                    data.response.forEach(function(item) {
                        try {
                            if (item.definition.exposes[0].type == "light") {
                                lights.push(item);
                            }
                        } catch (e) {
                            console.log(e);
                        }
                    })
                    localStorage.setItem("lights", JSON.stringify(lights));
                    LocalStorageHandler.add("lights");
                    console.log("done getting data");
                    makeLights(lights);
                })
            }
        })
    }

    function makeLights(lights) {
        const parent = document.querySelector("#lastUsed .swiper-wrapper");
        lights.forEach(async function(light) {
            parent.appendChild(makeLightBox(light));
            //await refreshData(light.friendly_name, "lightBox");
        })
        finishSetup();
    }

    function finishSetup() {
        console.log("settings things up");
        makeSwiper();
        setRipple();
        dashboardScene()
    }

    function openGroup(friendlyName) {
        console.log("Opening group screen", friendlyName);
        const GroupScreen = document.getElementById("GroupScreen");
        GroupScreen.style.display = "flex";
        GroupScreen.querySelector(".GroupScreenTitle h2").textContent = friendlyName;
        GroupScreen.querySelector(".saveSceneBtn").dataset.friendlyname = friendlyName;

        const devices = document.getElementById("GroupScreenLights"),
                scenes = document.querySelector("#GroupScreenScenes .swiper-wrapper");

        // foo data -> true, makes random data
        getGroupData(friendlyName).then(function(group) {
            console.log("Group:", group);

            // save group details in localStorage
            localStorage.setItem(group.friendlyName, JSON.stringify(group));
            LocalStorageHandler.add(group.friendlyName);

            // lights
            group.members.forEach(async member => {
                const randomColor = arrayOfRandomColors[Math.floor(Math.random() * arrayOfRandomColors.length)];
                let friendlyName = "";
                // get friendlyName from ieee address
                const lightsArray = JSON.parse(localStorage.getItem("lights"));
                lightsArray.forEach(light => {
                    if(light.ieee_address == member.ieee_address) {
                        friendlyName = light.friendly_name;
                    }
                })

                if(friendlyName.length > 0) {
                    devices.appendChild(makeLightSlider(friendlyName, {state: true, color: randomColor, openGroup: false}));
                    await makeSlider(friendlyName);
                    //await refreshData(member.friendlyName);
                }
            })

            // scenes
            console.log("SCEENES", group.scenes);
            group.scenes.forEach(scene => {
                
                const randomColor = arrayOfRandomColors[Math.floor(Math.random() * arrayOfRandomColors.length)];
                const scenesArray = JSON.parse(localStorage.getItem("scenes"));

                scenesArray.forEach(localScene => {
                    if(localScene.id == scene.id) {
                        console.log("scene hit ->", scene, localScene);
                        scene.name = localScene.sceneName;
                    }
                })

                scenes.appendChild(makeLightBox(
                    {friendly_name: scene.name}, 
                    {
                    color: randomColor,
                    icon: "fa-lightbulb",
                    action: `setScene('${friendlyName}', ${scene.id})`,
                    state: false,
                    }
                ));
            })
        })
        .then(function() {
            makeSwiper();
        })
    }

    function closeGroup() {
        console.log("close group");
        const GroupScreen = document.getElementById("GroupScreen");
        GroupScreen.style.display = "none";

        // clean screen
        let lights = document.getElementById("GroupScreenLights").childNodes;
        let scenes = document.querySelector("#GroupScreenScenes .swiper-wrapper").childNodes;

        for(let i = lights.length-1; i >= 0; i--) {
            lights[i].remove();
        }

        for(let i = scenes.length-1; i >= 0; i--) {
            scenes[i].remove();
        }
    }

//



// ========= DOM HANDLING

    // returns LightBox (can also make a scene box), needs friendlyName, default actions is toggle Light state, default icon is lightbulb
    function makeLightBox(deviceObj, options = {icon: "fa-lightbulb", action: "toggleLightState(this.id)",  state: true}) {
        console.log("MakeLightBox", deviceObj);

        let friendlyName = deviceObj.friendly_name;

        let lightBox = document.createElement("div");
            lightBox.setAttribute("class", "lightBox swiper-slide");
            lightBox.setAttribute("id", friendlyName);
        if(options.hasOwnProperty("color")) {
            lightBox.style.backgroundColor = options.color;
        }
        lightBox.setAttribute("onclick", `${options.action}`);

        lightBox.setAttribute("anim", "ripple");

        let lightLabel = document.createElement("span");
            lightLabel.setAttribute("class", "lightBoxLabel");
            lightLabel.textContent = friendlyName;
        lightBox.appendChild(lightLabel);

        let stateWrapper = document.createElement("div");
            stateWrapper.setAttribute("class", "lightBoxStateWrapper");
        lightBox.appendChild(stateWrapper);

            let iconEle = document.createElement("i");
                iconEle.setAttribute("class", `fas ${options.icon}`);
            stateWrapper.appendChild(iconEle);

            if(options.state) {
                let lightSettings = document.createElement("i");
                    lightSettings.setAttribute("class", "fas fa-ellipsis-v");
                    lightSettings.setAttribute("onclick", `stopProp(this); colorPicker('${friendlyName}')`);
                stateWrapper.appendChild(lightSettings);
            }
        return lightBox;
    }

    // returns LightSlider, needs options for toggling etc, icon is optional
    function makeLightSlider(friendlyName, options = {}, icon = "") {
        console.log("make light slider", friendlyName);
        let lightcard = document.createElement("div");
            lightcard.setAttribute("id", friendlyName);
            lightcard.setAttribute("class", "card light-card");

                let sliderContainer = document.createElement("div");
                    sliderContainer.setAttribute("id", friendlyName);
                    sliderContainer.setAttribute("class", "lightSlider");
                    if(options.hasOwnProperty("color")) {
                        //sliderContainer.style.backgroundColor = options.color;
                    }
                lightcard.appendChild(sliderContainer);

                    let cardBody = document.createElement("div");
                        cardBody.setAttribute("class", "card-body");
                    sliderContainer.appendChild(cardBody);

                        let label = document.createElement("label");
                            label.textContent = friendlyName;
                        cardBody.appendChild(label);

                        let extraStateDiv = document.createElement("div");
                            extraStateDiv.setAttribute("class", "extraStateDiv");
                        cardBody.appendChild(extraStateDiv);

                        // STATES:
                            // - ON/OFF
                            // - ColorPicker
                            // - openGroup

                            if(options.state) {
                                let state = document.createElement("i");
                                    state.setAttribute("class", "fas fa-power-off");
                                    state.setAttribute("onclick", `toggleLightState("${friendlyName}")`)
                                extraStateDiv.appendChild(state);
                            }

                            if(options.color) {
                                let color = document.createElement("i");
                                    color.setAttribute("class", "fas fa-eye-dropper")
                                    color.setAttribute("onclick", `colorPicker("${friendlyName}")`)
                                extraStateDiv.appendChild(color); 
                            }

                            if(options.openGroup) {
                                let openGroup = document.createElement("i");
                                    openGroup.setAttribute("class", "fas fa-external-link-square-alt");
                                    openGroup.setAttribute("onclick", `openGroup('${friendlyName}')`);
                                extraStateDiv.appendChild(openGroup);
                            }
        return lightcard;
    }

//




// ====== DATA HANDLING

    function getDataFromBridge(friendlyName) {
        const url = `${HOST}/getData/${friendlyName}`;
        console.log("Getting data from bridge from:", url);
        fetch(url)
        .then(res => res.json())
        .then(function (response) {
            return response;
        })
    }

    function getIndivData(friendlyName, attribute) {
        return new Promise((resolve, reject) => { 
            console.log("Get indiv data", friendlyName);
            // OLD const url = `${HOST}/getIndivData/${friendlyName}/${attribute}`;
            const body = {
                type: "getIndivData",
                request: {
                    friendlyName: friendlyName,
                    attribute: attribute, 
                }
            }
            const url = `${HOST}/api/v2/queue`;
            const options = {
                method: "POST",
                body: JSON.stringify(body),
            }

            fetch(url, options)
            .then(res => res.json())
            .then((res) => {
                if(!res.hasOwnProperty(attribute)) {
                    // didn't work, try again
                    getIndivData(friendlyName, attribute);
                } else {
                    resolve(res);
                }
            })
        })
    }

    function getMultipleData(friendlyNameArray, attribute) {
        return new Promise((resolve, reject) => {
            console.log("Getting multiple data for", friendlyNameArray, attribute);


            const body = [];

            friendlyNameArray.forEach(friendlyName => {
                body.push({
                    reqFriendlyName: friendlyName,
                    reqAttribute: attribute,
                    body: `{"${attribute}": ""}`,
                    url: `zigbee2mqtt/${friendlyName}`
                })
            })

            const url = `${HOST}/api/v2/queue`;
            let responseArr = [];

            friendlyNameArray.forEach(friendlyName => {
                const body = {
                    request: {
                        url: `zigbee2mqtt/${friendlyName}`,
                        reqFriendlyName: friendlyName,
                        reqAttribute: attribute,
                    },
                    type: "getData",
                }
                const options = {
                    body: JSON.stringify(body),
                    method: "POST",
                };

                fetch(url, options).then(res => res.json()).then(res => {
                    console.log(res);
                    responseArr.push(res);
                })
            })

            resolve(responseArr);
        })
    }

    function refreshData(element = "all", type = "slider") {
        return new Promise(async(resolve, reject)  => {
            console.log("refreshing Data", element);
    
            let elements, nameArray = [];
        
            if(element == "all") {
                elements = document.querySelectorAll(".lightSlider");
                elements.forEach(function(element) {
                    nameArray.push(element.id);
                })
            } else if(!element.includes("0x")) {
                // only single element
                nameArray.push(element);
            }
        
            for(let i = 0; i < nameArray.length; i++) {
                let light = nameArray[i], rgbColor = await getColorOfFriendlyName(light);
        
                await changeColorOfSlider(light, rgbColor, type);
                
            }
        })
    }

    function getGroupData(groupFriendlyName, fooData = false) {
        return new Promise((resolve, reject) => {
            console.log("Getting group data:", groupFriendlyName);
            if(localStorage.hasOwnProperty(groupFriendlyName)) {
                resolve(JSON.parse(localStorage.getItem(groupFriendlyName)));
            } else {
                const url = `${HOST}/getData/bridge&groups`;
                fetch(url).then(res => res.json())
                .then(function(res) {
                    let Group = { };
                    res.response.forEach(function(group) {
                        if(group.friendly_name == groupFriendlyName) {
                            Group = {
                                friendlyName: group.friendly_name,
                                scenes: group.scenes,
                                members: group.members,
                            }
                        }
                    })
                    resolve(Group);
                })
            }
        })
    }

//




// ========= COLOR

    (function colorPickerSetup() {
        let picker = new iro.ColorPicker("#picker", {
            layout: [      
                {
                    component: iro.ui.Wheel,
                    options: {
                    }
                },
                {
                    component: iro.ui.Slider,
                    options: {
                        sliderType: "kelvin"
                    }
                }
            ]
        })

        picker.on("input:end", function(color) {
            console.log("input end");
            // get id
            const friendlyName = document.getElementById("colorPickerLightName").textContent;
            const colorString = color.hexString.replace("#","");

            // change color of slider
            let idELe = document.getElementById(`${friendlyName}`);
                let slider = idELe.querySelector(`.lightSlider`);
                let sliderColor = idELe.querySelector(`.noUi-connects`);

            if(sliderColor != undefined) {
                if(color != undefined) {
                    sliderColor.style.background = `${color.hexString}`;
                    slider.style.boxShadow = `0px 0px 30px ${color.hexString}`;
                } else {
                    // light is off or not reachable
                    sliderColor.style.background = "#333333";
                }
        
                // change color of label
                let label = idELe.querySelector(`label`);
        
                if(lightOrDark(color.hexString) == "light") {
                    label.style.color = "black";
                } else {
                    label.style.color = "white";
                }
            }

            // send data to backend
            const url = `${HOST}/set/${friendlyName}/color/${colorString}`;
            const options = { method: "POST", headers: {  "Content-Type": "application/json" } }

            fetch(url, options)
            .then(function (response) {
            })
        })
    })();

    // OVERLAY
        function colorOverlay(id) {
            document.getElementById("colorOverlay").style.display = "block";
        } 

        function colorPicker(id) {
            document.getElementById("colorPicker").style.display = "flex";
            document.getElementById("colorPickerLightName").textContent = id;
            colorOverlay();
        }

        function closeOverlay() {
            document.getElementById("colorOverlay").style.display = "none";
            document.getElementById("colorPicker").style.display = "none";
            document.getElementById("sceneSaver").style.display = "none";
            try {
                document.getElementById("menu").style.width = "0";
                document.getElementById("menuOpener").style.opacity = "1";
            } catch (e) {
                console.log(e);
            }
        }
    //

    function changeColorOfSlider(friendlyName, color, type = "slider") {
        return new Promise((resolve, reject) => {
            console.log("Change color of slider", friendlyName);
            let idELe = document.getElementById(`${friendlyName}`);
            let colorEle; 

            if(type == "slider") {
                colorEle = idELe.querySelector(`.noUi-connects`);
            } else {
                colorEle = idELe;
            }
        
            // change color of slider
                if(color != undefined) {
                    colorEle.style.background = `${color}`;
                    colorEle.style.boxShadow = `0px 0px 30px ${color})}`
                } 
                else {
                    // light is off or not reachable
                    colorEle.style.background = "#333333";
                }

            // change color of label
            let label;
        
            if(type == "slider") {
                label = document.querySelector(`#${friendlyName} label`);
            } else {
                label = document.getElementById(`${friendlyName}`);
            }
            
            if(lightOrDark(color) == "light") {
                label.style.color = "black"
            } else {
                label.style.color = "white"
            }
            resolve();
        })
    }

    function getColorOfFriendlyName(friendlyName) {
        return new Promise(async (resolve, reject) => {
            console.log("get color of friendly name", friendlyName);
            let colorObj = await getIndivData(friendlyName, "color");
            colorObj = colorObj.color;
            let rgbColor = await xyBriToRgb(colorObj.x, colorObj.y, 254);
            resolve(rgbColor);
        })
    }

    function xyBriToRgb(x, y, bri) {
        return new Promise((resolve, reject) => {
            z = 1.0 - x - y;

            var Y = bri / 255.0; // Brightness of lamp
            var X = (Y / y) * x;
            var Z = (Y / y) * z;
            var r = X * 1.612 - Y * 0.203 - Z * 0.302;
            var g = -X * 0.509 + Y * 1.412 + Z * 0.066;
            var b = X * 0.026 - Y * 0.072 + Z * 0.962;
            var r = r <= 0.0031308 ? 12.92 * r : (1.0 + 0.055) * Math.pow(r, (1.0 / 2.4)) - 0.055;
            var g = g <= 0.0031308 ? 12.92 * g : (1.0 + 0.055) * Math.pow(g, (1.0 / 2.4)) - 0.055;
            var b = b <= 0.0031308 ? 12.92 * b : (1.0 + 0.055) * Math.pow(b, (1.0 / 2.4)) - 0.055;
            var maxValue = Math.max(r,g,b);
            r /= maxValue;
            g /= maxValue;
            b /= maxValue;
            r = r * 255;   if (r < 0) { r = 255 };
            g = g * 255;   if (g < 0) { g = 255 };
            b = b * 255;   if (b < 0) { b = 255 };
            r = Math.round(r).toString(16);
            g = Math.round(g).toString(16);
            b = Math.round(b).toString(16);
            if (r.length < 2)
                r="0"+r;        
            if (g.length < 2)
                g="0"+g;        
            if (b.length < 2)
                b="0"+r;        
            rgb = "#"+r+g+b;
        
            resolve(rgb);
        })
    }

    function invertColor(inColor) {
        let color = inColor;
        color.replace("#", "")
        color = parseInt(color, 16)
        color = 0xFFFFFF ^ color;
        color.toString(16)
        color = ("000000" + color).slice(-6);
        color = "#" + color;
        return color
    }

    function hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : null;
    }
    // borrowed from awik.io
    function lightOrDark(color) {

        // Variables for red, green, blue values
        var r, g, b, hsp;
        
        // Check the format of the color, HEX or RGB?
        if (color.match(/^rgb/)) {

            // If RGB --> store the red, green, blue values in separate variables
            color = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);
            
            r = color[1];
            g = color[2];
            b = color[3];
        } 
        else {
            
            // If hex --> Convert it to RGB: http://gist.github.com/983661
            color = +("0x" + color.slice(1).replace( 
            color.length < 5 && /./g, '$&$&'));

            r = color >> 16;
            g = color >> 8 & 255;
            b = color & 255;
        }
        
        // HSP (Highly Sensitive Poo) equation from http://alienryderflex.com/hsp.html
        hsp = Math.sqrt(
        0.299 * (r * r) +
        0.587 * (g * g) +
        0.114 * (b * b)
        );

        // Using the HSP value, determine whether the color is light or dark
        if (hsp>127.5) {

            return 'light';
        } 
        else {

            return 'dark';
        }
    }

//



// ========== DEBUGGING

    const arrayOfRandomNames = ["Foo", "Bar", "HEllo", "TEst", "Random", "Light", "licht"];
    const arrayOfRandomColors = ["#5a52a1", "#a15252", "#9552a1", "#52a175"];

    function makeRandomBox() {
        const randomNumber = getRandomNumber();
        const randomColor = arrayOfRandomColors[Math.floor(Math.random() * arrayOfRandomColors.length)];
        lastUsedParent.appendChild(makeLightBox( { friendly_name: arrayOfRandomNames[randomNumber] }, {color: randomColor}));
    }

    function makeRandomSlider() {
        const randomNumber = getRandomNumber();
        const randomColor = arrayOfRandomColors[Math.floor(Math.random() * arrayOfRandomColors.length)];

        lightSliderParent.appendChild(makeLightSlider(arrayOfRandomNames[randomNumber], {state: true, openGroup: true, color: randomColor}));
    }

    function makeRandomScene() {
        const randomNumber = getRandomNumber();
        const randomColor = arrayOfRandomColors[Math.floor(Math.random() * arrayOfRandomColors.length)];
        sceneParent.appendChild(makeLightBox(arrayOfRandomNames[randomNumber], {color: randomColor, state: false}));
    }

    function getRandomNumber(top = arrayOfRandomNames.length) {
        return Math.floor(Math.random() * top);
    }

// 