
function getGroups() {
    const url = `${HOST}/getGroups`;
    fetch(url)
    .then(response => response.json())

    .then(function(groups) {
        console.log(groups);

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
    console.log(`Settings scene: ${group}, ${sceneId}`)

    // set scene
    let url = `${HOST}/scene/${group}/${sceneId}`;

    fetch(url)
    .then(function (response) {
        console.log(response);
    })

    /* set brightness
    url = `${HOST}/set/${group}/brightness/${bri}`;
    fetch(url)
    .then(function (response) {
        console.log(response);
    })*/
}

function saveCurrentScene(buttonE) {
    console.log("saving current scene");

    let sceneName = document.getElementById("sceneNameInput").value.replace("/","&");
    // replace "/", otherwise API will get it wrong
    let sceneGroup = buttonE.dataset.friendlyname;
    console.log(sceneName, sceneGroup);
    

    // get brightness
    let url = `${HOST}/getData/${sceneGroup}`
    fetch(url)
    .then(res => res.json())
    .then(function (response) {
        console.log(response)
        let brightness = response.brightness;
        
        if(brightness == undefined) {
            brightness = 254;
        }

        // save scene
        url = `${HOST}/saveScene/${sceneName}/${sceneGroup}/${brightness}`

        const options = {
            method: "POST"
        }
    
        fetch(url, options)
        .then(function(response) {
            console.log(response);
            closeOverlay();
            getScenes();
        })

    })
}

function getScenes() {
    return new Promise((resolve, reject) => {
        const url = `${HOST}/getScenes`
        fetch(url)
        .then(response => response.json())
        .then(function(response) {
            console.log(response);
            
            console.log("=== REMOVING OLD SCENE BOXES ===")
    
                // remove old data
                console.log("sceneboxes:", document.querySelectorAll(".sceneBox").length)
    
                let oldItems = document.querySelectorAll(".sceneBox")
    
                for(let i = oldItems.length-1; i >= 0; i--) {
                    console.log(oldItems[i]);
                    oldItems[i].remove();
                }
            resolve(response);
            console.log("=== DONE ===")
        })
    })
}

function makeSceneBox(parent, scene) {
    console.log("=== MAKING SCENE BOX ===");

        let box = document.createElement("div");
            box.setAttribute("class", "lightBox sceneBox swiper-slide");
            box.setAttribute("onclick", `setScene("${scene.group}", "${scene.id}")`);
            box.setAttribute("anim", "ripple");

            let icon = document.createElement("i");
                icon.setAttribute("class", "fas fa-play")
            box.appendChild(icon);

            let label = document.createElement("span");
                label.textContent = scene.sceneName;
            box.appendChild(label);

        parent.appendChild(box);

    console.log("=== DONE ===");
}

function groupScene() {
    getScenes().then(function(scenes){
        scenes.forEach(function(scene) {
            let parent = document.getElementById(scene.group).querySelector(".sceneBoxContainer");
            makeSceneBox(parent);
        })
    }) 
}

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

