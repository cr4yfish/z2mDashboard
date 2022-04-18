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

const LocalStorageHandler = {
    array: [],

    get: function() {
        return this.array;
    },

    add: function(newItem) {
        if(!this.array.includes(newItem)) {
            this.array.push(newItem);
        }
    },

    clear: function () {
        LocalStorageHandler.refresh();
        this.array.forEach(function (item) {
            localStorage.removeItem(item);
        });
        makeNotice('Notice', 
                    'Your local cache has been cleared. Please refresh the tab to make changes visible.');
    },

    refresh: function() {
        Object.keys(localStorage).forEach(key => {
            if(!localStorage.hasOwnProperty(key)) {
                this.add(key);
            }
        })
    }
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

async function makeNotice(header = "Notice", str = "", state = "positive") {
    let bannerClass = state;

    // switch state of banner
    let iconName = "check";
    if(state === "negative") {
        iconName = "times";
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
            bannerContent.innerHTML = `<i class="fa fa-${iconName}"></i> `
            bannerContent.innerHTML += str;
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