(function whereAmI() {
    const anchors = document.querySelectorAll("#menu a");
    anchors.forEach(function(anchor) {
        if(anchor.text == document.title) {
            anchor.classList.add("active");
        }
    })
})();

(function addInputEventListeners() {
    const inputs = document.querySelectorAll("input");

    inputs.forEach(input => {
        if(input.id != "versionSettingsInput") {
            input.addEventListener("focus", (e) => {
                e.target.parentNode.style.border = "solid 1px var(--themeBG)";
            });
            input.addEventListener("blur", (e) => {
                e.target.parentNode.style.border = "solid 1px #202020";
            });
        }
    })
})();

const HOST = 'http://localhost:30000';
//const HOST = 'http://192.168.0.100:30000';

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

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

async function makeNotice(header, str, state) {
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
        bannerBody.setAttribute("class", `banner banner-${bannerClass}`);
        bannerBody.setAttribute("id", "banner");
        bannerBody.setAttribute("onclick", "removeNotice()");
    document.getElementsByTagName("body")[0].appendChild(bannerBody);

        const bannerHeader = document.createElement("span");
            bannerHeader.setAttribute("class", "bannerHeader");
            bannerHeader.textContent = header;
        bannerBody.appendChild(bannerHeader);

            const bannerHeaderTimes = document.createElement("i");
                bannerHeaderTimes.setAttribute("class", "fa fa-times");
            bannerHeader.appendChild(bannerHeaderTimes);

        const bannerContent = document.createElement("div");
            bannerContent.setAttribute("class", "bannerContent");
            bannerContent.innerHTML = str;
        bannerBody.appendChild(bannerContent);

    const numberOfBanners = document.querySelectorAll(".banner").length;
    bannerBody.style.transform = `translateY(calc(75px * ${numberOfBanners - 1}))`;

    await sleep(2000);
    removeNotice();
    
}

async function removeNotice() {
    const banner = document.getElementById("banner");
    banner.style.transform = "translateY(-150%)";
    banner.style.opacity = "0";
    await sleep(2010);
    banner.remove();
}

function hideObject() {
    this.remove();
}

// debugging convenience
const lastUsedParent = document.querySelector("#lastUsed .swiper-wrapper")
const lightSliderParent = document.getElementById("groups");
const sceneParent = document.querySelector("#scenes .swiper-wrapper");