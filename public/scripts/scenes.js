
function getGroups() {
    const url = `${HOST}/getGroups`;
    fetch(url)
    .then(response => response.json())

    .then(function(groups) {

        groups.forEach(function(group) {
            
            let parent = document.getElementById("groups");

            let container = document.createElement("fieldset");
                container.setAttribute("class", "groupContainer");
                container.setAttribute("id", group);
            parent.appendChild(container);

            let header = document.createElement("legend")
                header.textContent = group;
            container.appendChild(header);

            let wrapper = document.createElement("div")
            wrapper.setAttribute("class", "sceneBoxContainer")
            container.appendChild(wrapper);

            let button = document.createElement("button")
                button.setAttribute("class", "btn btn-primary")
                button.setAttribute("anim", "ripple")
                button.setAttribute("onclick", "sceneOverlay(this)")
                button.setAttribute("data-friendlyname", group);
                button.textContent = "save current"
            container.appendChild(button);

        })
    })
    .then(function () {
        getScenes()
        setRipple();
    })
}


function setScene(group, sceneId, bri=254) {
    // set scene
    let url = `${HOST}/scene/${group}/${sceneId}`;

    fetch(url)
    .then(function (response) {
        console.log(response);
    })
}

function saveCurrentScene(buttonE) {
    let sceneName = document.getElementById("sceneNameInput").value.replace("/","&");
    // replace "/", otherwise API will get it wrong
    let sceneGroup = buttonE.dataset.friendlyname;
    

    // get brightness
    let url = `${HOST}/getData/${sceneGroup}`
    fetch(url)
    .then(res => res.json())
    .then(function (response) {
        let brightness = response.brightness;
        
        if(brightness == undefined) {
            brightness = 253;
        }

        // save scene
        url = `${HOST}/saveScene/${sceneName}/${sceneGroup}/${brightness}`

        const options = {
            method: "POST"
        }
    
        fetch(url, options)
        .then(function(response) {
            closeOverlay();
            dashboardScene();
        })

    })
}

function getScenes() {
    return new Promise((resolve, reject) => {
        const url = `${HOST}/getScenes`
        fetch(url)
        .then(response => response.json())
        .then(function(response) {
                localStorage.setItem("scenes", JSON.stringify(response));
                let oldItems = document.querySelectorAll(".sceneBox")
    
                for(let i = oldItems.length-1; i >= 0; i--) {
                    oldItems[i].remove();
                }
            resolve(response);
        })
    })
}

function makeSceneBox(parent, scene) {
        const randomColor = arrayOfRandomColors[Math.floor(Math.random() * arrayOfRandomColors.length)];
            
        let box = document.createElement("div");
            box.setAttribute("class", "lightBox sceneBox swiper-slide");
            box.setAttribute("onclick", `setScene("${scene.group}", "${scene.id}")`);
            box.setAttribute("anim", "ripple");
            box.style.backgroundColor = `${randomColor}`;

            if(lightOrDark(randomColor) == "light") {
                box.style.color = "black"
            } else {
                box.style.color = "white"
            }

            let icon = document.createElement("i");
                icon.setAttribute("class", "fas fa-play")
            box.appendChild(icon);

            let label = document.createElement("span");
                label.textContent = scene.sceneName;
            box.appendChild(label);

        parent.appendChild(box);

}

// makes scenes for group screen
function groupScene() {
    getScenes().then(function(scenes){
        scenes.forEach(function(scene) {
            let parent = document.getElementById(scene.group).querySelector(".sceneBoxContainer");
            makeSceneBox(parent);
        })
    }) 
}

// makes scenes for home screen
function dashboardScene() {
    getScenes().then(function(scenes) {
        scenes.forEach(function(scene) {
            let parent = document.querySelector("#scenes .swiper-wrapper");
            makeSceneBox(parent, scene);
        })
    })
}

function sceneOverlay(e) {
    document.getElementById("sceneFinishBtn").setAttribute("data-friendlyname", e.dataset.friendlyname)

    document.getElementById("colorOverlay").style.display = "block"
    document.getElementById("sceneSaver").style.display = "flex";
} 

function closeSceneOverlay() {
    document.getElementById("colorOverlay").style.display = "none";
    document.getElementById("sceneSaver").style.display = "none";

    // clear input
    document.getElementById("sceneNameInput").value = "";

    try {
        document.getElementById("menu").style.width = "0";
        document.getElementById("menuOpener").style.opacity = "1";
    } catch (e) {
        console.log(e);
    }
}

