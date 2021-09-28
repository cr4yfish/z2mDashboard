
// light sliders
function makeSliders(set) {
    let lightSliders = document.querySelectorAll(".lightSlider");

    lightSliders.forEach(function (light) {
        //var slider = document.getElementById("slider");
    
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
    
    
        light.noUiSlider.on("end", function( values, handle) {
            let value = parseInt(values[1])
            console.log(light.getAttribute("id"))
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


//