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
//const HOST = 'http://localhost:30000'
const HOST = 'http://192.168.0.100:30000'

