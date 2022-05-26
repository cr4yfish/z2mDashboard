
// light sliders
function makeSliders(set) {
    let lightSliders = document.querySelectorAll(".lightSlider");

    lightSliders.forEach(function (light) {
        noUiSlider.create(light, {
            start: [0, 254],
            step: 1,
            connect: true,
            behaviour: "tap-drag",
            range: {
                'min': 0,
                'max': 254
            }
        });
    
        var origins = light.getElementsByClassName('noUi-origin');
        origins[0].setAttribute('disabled', true);
    
        light.noUiSlider.on("change", function( values, handle) {
            let value = parseInt(values[1])
            //let url = HOST+"/set/"+ light.getAttribute("id") +"/"+value+"/brightness";
            let url = `${HOST}/set/${light.getAttribute("id")}/brightness/${value}`;
    
            const options = {
                method: "POST"
            }
            fetch(url, options)

            .then(function(res) {
                //refreshData(light.id);
            })
        })
    })
}

function makeSlider(friendlyName) {
    return new Promise(async (resolve, reject) => {
        let light = document.getElementById(friendlyName);
        console.log("creating noUi slider", friendlyName);
        noUiSlider.create(light, {
            start: [0, 254],
            step: 1,
            connect: true,
            behaviour: "drag",
            range: {
                'min': 0,
                'max': 254
            }
        });
    
        var origins = light.getElementsByClassName('noUi-origin');
        origins[0].setAttribute('disabled', true);
        await makeEvenListener(light);
        resolve();
    })
}

function makeEvenListener(light) {
    return new Promise((resolve, reject) => {
        light.noUiSlider.on("change", function( values, handle) {
            console.log("Changing brightness for", light, light.getAttribute("id"));
            let value = parseInt(values[1])
            //let url = HOST+"/set/"+ light.getAttribute("id") +"/"+value+"/brightness";
            let url = `${HOST}/set/${light.getAttribute("id")}/brightness/${value}`;
    
            const options = {
                method: "POST"
            }
            fetch(url, options)

            .then(function(res) {
                //refreshData(light.id);
            })
        })

        resolve();
    })
}

//