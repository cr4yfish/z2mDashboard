(function whereAmI() {
    const anchors = document.querySelectorAll("#menu a");
    anchors.forEach(function(anchor) {
        if(anchor.text == document.title) {
            anchor.classList.add("active");
        }
    })
})();


function openMenu() {
    document.getElementById("menu").style.width = "250px";
    document.getElementById("menuOpener").style.opacity = "0";
    try {
        document.getElementById("colorOverlay").style.display = "block"
    } catch (e) {
        console.log(e);
    }

}

function closeMenu() {
    document.getElementById("menu").style.width = "0";
    document.getElementById("menuOpener").style.opacity = "1";
    try {
        document.getElementById("colorOverlay").style.display = "none"
    } catch (e) {
        console.log(e);
    }
}

const HOST = 'http://1922.168.0.1:30000'
//const HOST = 'http://192.168.1.105:30000'


function makeNotice(str, state) {
    let bgColor = "#B3DFB2";
    let iconColor = "#3B533B";
    let bannerClass = "positive";

    // switch state of banner
    switch(state) {
        case "negative":
            bgColor = "#DFB2B2";
            iconColor = "#6C4F4F";
            bannerClass = "negative";
            break;
        case "info": 

            break;
    }

    const bannerBody = document.createElement("div");
        bannerBody.setAttribute("class", `banner ${bannerClass}`);
        bannerBody.setAttribute("id", "banner");
        bannerBody.setAttribute("onclick", "hideObject(this)");
    document.getElementsByTagName("body")[0].appendChild(bannerBody);

        const bannerHeader = document.createElement("span");
            bannerHeader.setAttribute("class", "bannerHeader");
        bannerBody.appendChild(bannerHeader);

        const bannerContent = document.createElement("div");
            bannerContent.setAttribute("class", "bannerContent");
            bannerContent.innerHTML = str;
        bannerBody.appendChild(bannerContent);

}

function hideObject() {
    this.remove();
}

// debugging convinience

const lastUsedParent = document.querySelector("#lastUsed .swiper-wrapper")
const lightSliderParent = document.getElementById("groups");
const sceneParent = document.querySelector("#scenes .swiper-wrapper");