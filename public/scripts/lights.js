

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// refresh time should be 1second for each group
let refreshTime = 0;

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

    })
}

function getDataFromBridge(friendlyName) {
    
    const url = `${HOST}/getData/${friendlyName}`;
    console.log("Getting data from bridge from:", url);
    fetch(url)
    .then(res => res.json())

    .then(function (response) {

        return response;
    })

}

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
                slider.style.boxShadow = `0px 0px 30px ${color.hexString}`
    
            } else {
                // light is off or not reachable
                sliderColor.style.background = "#333333";
            }
    
            // change color of label
            let label = idELe.querySelector(`label`)
    
            if(lightOrDark(color.hexString) == "light") {
                label.style.color = "black"
            } else {
                label.style.color = "white"
            }
    
        }


        // send data to backend
        const url = `${HOST}/set/${friendlyName}/color/${colorString}`;

        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        }

        fetch(url, options)
        .then(function (response) {

   
        })
    })
})();


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

function getGroups() {
    const url = `${HOST}/getGroups`;
    fetch(url)
    .then(response => response.json())

    .then(function(groups) {
        console.log(groups);
        groups.forEach(async function(group) {
            refreshTime++
            const parent = document.getElementById("groups");
            const randomColor = arrayOfRandomColors[Math.floor(Math.random() * arrayOfRandomColors.length)];

            parent.appendChild(makeLightSlider(group, { state: true, color: randomColor, openGroup: true }));

            await makeSlider(group);
            
        })
    })
    // make lights
    .then(function() {
        console.log("Gettings devices data")

        let url = `${HOST}/getData/bridge&devices`
        fetch(url)
        .then(data => data.json())

        .then(function(data) {
            console.log(data);

            // sort out lights

            let lights = [];

            data.forEach(function(item) {
                try {
                    if (item.definition.exposes[0].type == "light") {
                        lights.push(item);
                    }
                }
                catch (e) {
                    //console.log(e);
                }
            })

            console.log(lights);

            const parent = document.querySelector("#lastUsed .swiper-wrapper");

            lights.forEach(function(light) {

                parent.appendChild(makeLightBox(light));
                
              
            })

        })

        // finish setup
        .then(function () {
            makeSwiper();
            //makeSliders();
            setRipple();
            dashboardScene()
            serviceWorker();
        })
    })
}


function openGroup(friendlyName) {
    console.log("Opening group screen", friendlyName);
    const GroupScreen = document.getElementById("GroupScreen");
    GroupScreen.style.display = "flex";
    GroupScreen.querySelector(".GroupScreenTitle h2").textContent = friendlyName;
    GroupScreen.querySelector(".saveSceneBtn").dataset.friendlyname = friendlyName;

    const devices = document.getElementById("GroupScreenLights");
    const scenes = document.querySelector("#GroupScreenScenes .swiper-wrapper");

    // foo data -> true, makes random data
    getGroupData(friendlyName).then(function(group) {

        /*
        const exampleData = {
            friendly_name: "Name",
            members: [{
                endpoint: 11,
                ieee_address: "0x32322",
            }],
            scenes: [{
                id: 30,
                name: "scene name",
            }],
        }
        */

        console.group("Open group algorithm");
        console.log(group);
        group.members.forEach(member => {
            const randomColor = arrayOfRandomColors[Math.floor(Math.random() * arrayOfRandomColors.length)];

            devices.appendChild(makeLightSlider(member.ieee_address, {state: true, color: randomColor, openGroup: false}));

            makeSlider(member.ieee_address);
        })

        group.scenes.forEach(scene => {
            const randomColor = arrayOfRandomColors[Math.floor(Math.random() * arrayOfRandomColors.length)];
            
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
        console.groupEnd();
    })

    .then(function() {
        //makeSliders();
        makeSwiper();
    })

}

function closeGroup() {
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

// returns LightBox (can also make a scene box), needs friendlyName, default actions is toggle Light state, default icon is lightbulb
function makeLightBox(deviceObj, options = {icon: "fa-lightbulb", action: "toggleLightState(this.id)",  state: true}) {
    console.group("MakeLightBox");

    console.log(deviceObj, options);

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
  
    console.groupEnd();
    return lightBox;
}

function stopProp() {
    this.event.stopPropagation();
}

// returns LightSlider, needs options for toggling etc, icon is optional
function makeLightSlider(friendlyName, options = {} ,icon = "") {
 
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

function getGroupData(groupFriendlyName, fooData = false) {
    return new Promise((resolve, reject) => {
        console.log("Getting group data:", groupFriendlyName);

        const url = `${HOST}/getData/bridge&groups`;
        
        if(!fooData) {
            fetch(url).then(res => res.json())
            .then(function(res) {
                let Group = { };

                console.log(res);
                res.forEach(function(group) {
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
        } else {
            // random
            var randomNumber = getRandomNumber();
            Group = {
                friendlyName: arrayOfRandomNames[randomNumber],
                scenes: [],
                members: [],
            }
            
            for(i = 0; i < 7; i++) {

                randomNumber = getRandomNumber();
                Group.scenes.push({
                    name: arrayOfRandomNames[randomNumber],
                    scene_id: getRandomNumber(50),
                })

                randomNumber = getRandomNumber();
                Group.members.push({
                    friendly_name: arrayOfRandomNames[randomNumber],
                })
            }

            resolve(Group);
        }
        
    })
}

function makeSwiper() {
    const swiper = new Swiper('.swiper', {
        direction: "horizontal",
        loop: false,
    });
}

function refreshData(element = "all") {
    // make array of friendly names that are present
    // for every name, make a fetch call to /getData/:friendlyname
    // read brightness and color data and update sliders and colors
    console.log("refreshData")
    let elements;
    let nameArray = [];


    if(element == "all") {
        elements = document.querySelectorAll(".lightSlider");
        elements.forEach(function(element) {
            nameArray.push(element.id)
        })
    } else {
        // only single element
        elements = document.querySelector(`#${element}`).id;
        nameArray.push(elements);
    }

    for(let i = 0; i < nameArray.length; i++) {
        console.group("REFRESH DATA FOR:", nameArray[i])
        let group = nameArray[i];
        let url = `${HOST}/getData/${group}`;
        console.log("refreshing for", group, "data from", url);
        fetch(url)
        .then(res => res.json())
        .then(function(response) {
            console.log("resonse:");
            console.log(response);
            let brightness = response.brightness;
            let color = response.color;
            // update corresponding slider
            console.log("got brightness", typeof brightness, brightness, "for", group)
            let slider = document.querySelector(`#${group} .lightSlider`);
    
            slider.noUiSlider.set([0,brightness.toString()]);

            // change color of slider
            let sliderColor = slider.querySelector(".noUi-connect");
                if(color != undefined) {
                    //sliderColor.style.background = xyBriToRgb(color.x, color.y, brightness);
                    //sliderColor.style.boxShadow = `0px 0px 30px ${xyBriToRgb(color.x, color.y, brightness)}`

                } 
                 else {
                    // light is off or not reachable
                    //sliderColor.style.background = "#ffffff";
                }

            // change color of label
            let label = document.querySelector(`#${group} label`)

            if(lightOrDark(document.getElementById(group).querySelector(".noUi-connect").style.background) == "light") {
                label.style.color = "black"
            } else {
                label.style.color = "white"
            }
                
            console.log("==== DONE =====")
            console.groupEnd();
        })
    }
}


async function serviceWorker() {
    console.log("service worker");
    //refreshData();
    //await sleep(refreshTime*1000*3);
    //serviceWorker()
}

function xyBriToRgb(x, y, bri)
{
    z = 1.0 - x - y;

    Y = bri / 255.0; // Brightness of lamp
    X = (Y / y) * x;
    Z = (Y / y) * z;
    r = X * 1.612 - Y * 0.203 - Z * 0.302;
    g = -X * 0.509 + Y * 1.412 + Z * 0.066;
    b = X * 0.026 - Y * 0.072 + Z * 0.962;
    r = r <= 0.0031308 ? 12.92 * r : (1.0 + 0.055) * Math.pow(r, (1.0 / 2.4)) - 0.055;
    g = g <= 0.0031308 ? 12.92 * g : (1.0 + 0.055) * Math.pow(g, (1.0 / 2.4)) - 0.055;
    b = b <= 0.0031308 ? 12.92 * b : (1.0 + 0.055) * Math.pow(b, (1.0 / 2.4)) - 0.055;
    maxValue = Math.max(r,g,b);
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

    return rgb;             
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


// DEBUGGING
const arrayOfRandomNames = ["Foo", "Bar", "HEllo", "TEst", "Random", "Light", "licht"];
const arrayOfRandomColors = ["#5a52a1", "#a15252", "#9552a1", "#52a175"];

function makeRandomBox() {
    const randomNumber = getRandomNumber();
    const randomColor = arrayOfRandomColors[Math.floor(Math.random() * arrayOfRandomColors.length)];
    lastUsedParent.appendChild(makeLightBox(arrayOfRandomNames[randomNumber], {color: randomColor}));
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