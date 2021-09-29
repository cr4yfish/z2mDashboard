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

        // send data to backend
            // get id
            const friendlyName = document.getElementById("colorPickerLightName").textContent;
            const colorString = color.hexString.replace("#","");

        const url = `${HOST}/set/${friendlyName}/color/${colorString}`;

        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        }

        fetch(url, options)
        .then(function (response) {

            let slider = document.querySelector(`#${friendlyName} .lightSlider`);

            // change color of slider
            let sliderColor = slider.querySelector(".noUi-connect");

                if(color != undefined) {
                    sliderColor.style.background = `${color.hexString}`;
                    //sliderColor.style.boxShadow = `0px 0px 30px ${color.hexString}`

                } else {
                    // light is off or not reachable
                    sliderColor.style.background = "#ffffff3a";
                }

                // change color of label
                let label = document.querySelector(`#${friendlyName} label`)

                if(lightOrDark(color.hexString) == "light") {
                    label.style.color = "black"
                } else {
                    label.style.color = "white"
                }
        })
    })
})();


function colorOverlay(id) {
        document.getElementById("colorOverlay").style.display = "block"
        document.getElementById("colorPicker").style.display = "flex"
        document.getElementById("colorPickerLightName").textContent = id;
} 

function closeOverlay() {
    document.getElementById("colorOverlay").style.display = "none"
    document.getElementById("colorPicker").style.display = "none"

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

        groups.forEach(function(group) {
            refreshTime++
            const parent = document.getElementById("lightSwitches");
 
            let lightcard = document.createElement("div");
                lightcard.setAttribute("id", group);
                lightcard.setAttribute("class", "card light-card");
                lightcard.setAttribute("onclick", "colorOverlay(this.id);")
                lightcard.setAttribute("anim", "ripple");

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
        setRipple();
        serviceWorker();
    })
}

async function refreshData(element = "all") {
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
        let group = nameArray[i]
        let url = `${HOST}/getData/${group}`
        console.log("refreshing for", group, "data from", url)
        fetch(url)
        .then(res => res.json())
        .then(async function(response) {
            let brightness = response.brightness;
            let color = response.color;
            // update corresponding slider
            console.log("got brightness", typeof brightness, brightness, "for", group)
            let slider = document.querySelector(`#${group} .lightSlider`);
    
            slider.noUiSlider.set([0,brightness.toString()]);

            // change color of slider
            let sliderColor = slider.querySelector(".noUi-connect");
                if(color != undefined) {
                    sliderColor.style.background = xyBriToRgb(color.x, color.y, brightness);
                    //sliderColor.style.boxShadow = `0px 0px 30px ${xyBriToRgb(color.x, color.y, brightness)}`

                } 
                 else {
                    // light is off or not reachable
                    sliderColor.style.background = "#ffffff";
                }

            // change color of label
            let label = document.querySelector(`#${group} label`)

            if(lightOrDark(document.getElementById(group).querySelector(".noUi-connect").style.background) == "light") {
                label.style.color = "black"
            } else {
                label.style.color = "white"
            }
                
                
            console.log("==== DONE =====")
        })
        await sleep(250);
    }
}


async function serviceWorker() {
    console.log("service worker");
    refreshData();
    await sleep(refreshTime*1000*3);
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