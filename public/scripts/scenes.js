
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
                button.setAttribute("onclick", "colorOverlay(this)")
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

    // set brightness
    url = `${HOST}/set/${group}/brightness/${bri}`;
    fetch(url)
    .then(function (response) {
        console.log(response);
    })
}

function saveCurrentScene(buttonE) {
    console.log("saving current scene");

    const sceneName = document.getElementById("sceneNameInput").value;
    const sceneGroup = buttonE.dataset.friendlyname;
    console.log(sceneName, sceneGroup);
    

    // get brightness
    let url = `${HOST}/getData/${sceneGroup}`
    fetch(url)
    .then(res => res.json())
    .then(function (response) {
        console.log(response)
        const brightness = response.brightness;

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

        console.log("=== DONE ===")

        response.forEach(function(scene) {
            console.log("=== MAKING SCENE BOX ===")
            let parent = document.getElementById(scene.group).querySelector(".sceneBoxContainer");


            console.log(scene.sceneName, scene.id)

                let box = document.createElement("div");
                    box.setAttribute("class", "sceneBox")
                    box.setAttribute("onclick", `setScene("${scene.group}", "${scene.id}")`)
                    box.setAttribute("anim", "ripple")
                
                    let label = document.createElement("h3");
                        label.textContent = scene.sceneName;
                    box.appendChild(label);

                parent.appendChild(box);

            console.log("=== DONE ===")
        })
    })
}

function colorOverlay(e) {
    document.getElementById("sceneFinishBtn").setAttribute("data-friendlyname", e.dataset.friendlyname)

    document.getElementById("colorOverlay").style.display = "block"
    document.getElementById("sceneSaver").style.display = "flex"

} 

function closeOverlay() {
    document.getElementById("colorOverlay").style.display = "none"
    document.getElementById("sceneSaver").style.display = "none"

    // clear input
    document.getElementById("sceneNameInput").value = "";

    try {
        document.getElementById("menu").style.width = "0";
        document.getElementById("menuOpener").style.opacity = "1";
    } catch (e) {
        console.log(e);
    }
}

