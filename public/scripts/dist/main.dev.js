"use strict";

(function whereAmI() {
  var anchors = document.querySelectorAll("#menu a");
  anchors.forEach(function (anchor) {
    if (anchor.text == document.title) {
      anchor.classList.add("active");
    }
  });
})();

(function addInputEventListeners() {
  var inputs = document.querySelectorAll("input");
  inputs.forEach(function (input) {
    if (input.id != "versionSettingsInput") {
      input.addEventListener("focus", function (e) {
        e.target.parentNode.style.border = "solid 1px var(--themeBG)";
      });
      input.addEventListener("blur", function (e) {
        e.target.parentNode.style.border = "solid 1px #202020";
      });
    }
  });
})();

var HOST = 'http://localhost:30000'; //const HOST = 'http://192.168.0.100:30000';

function sleep(ms) {
  return new Promise(function (resolve) {
    return setTimeout(resolve, ms);
  });
}

var LocalStorageHandler = {
  array: [],
  get: function get() {
    return this.array;
  },
  add: function add(newItem) {
    if (!this.array.includes(newItem)) {
      this.array.push(newItem);
    }
  },
  clear: function clear() {
    LocalStorageHandler.refresh();
    this.array.forEach(function (item) {
      localStorage.removeItem(item);
    });
    makeNotice('Notice', 'Your local cache has been cleared. Please refresh the tab to make changes visible.');
  },
  refresh: function refresh() {
    var _this = this;

    Object.keys(localStorage).forEach(function (key) {
      if (!localStorage.hasOwnProperty(key)) {
        _this.add(key);
      }
    });
  }
};

function openMenu() {
  document.getElementById("menu").style.width = "250px";
  document.getElementById("menuOpener").style.opacity = "0";

  try {
    document.getElementById("colorOverlay").style.display = "block";
  } catch (e) {
    console.log(e);
  }
}

function closeMenu() {
  document.getElementById("menu").style.width = "0";
  document.getElementById("menuOpener").style.opacity = "1";

  try {
    document.getElementById("colorOverlay").style.display = "none";
  } catch (e) {
    console.log(e);
  }
}

function makeNotice() {
  var header,
      str,
      state,
      bannerClass,
      iconName,
      bannerBody,
      bannerHeader,
      bannerHeaderTimes,
      bannerContent,
      numberOfBanners,
      _args = arguments;
  return regeneratorRuntime.async(function makeNotice$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          header = _args.length > 0 && _args[0] !== undefined ? _args[0] : "Notice";
          str = _args.length > 1 && _args[1] !== undefined ? _args[1] : "";
          state = _args.length > 2 && _args[2] !== undefined ? _args[2] : "positive";
          bannerClass = state; // switch state of banner

          iconName = "check";

          if (state === "negative") {
            iconName = "times";
          }

          bannerBody = document.createElement("div");
          bannerBody.setAttribute("class", "banner banner-".concat(bannerClass));
          bannerBody.setAttribute("id", "banner");
          bannerBody.setAttribute("onclick", "removeNotice()");
          document.getElementsByTagName("body")[0].appendChild(bannerBody);
          bannerHeader = document.createElement("span");
          bannerHeader.setAttribute("class", "bannerHeader");
          bannerHeader.textContent = header;
          bannerBody.appendChild(bannerHeader);
          bannerHeaderTimes = document.createElement("i");
          bannerHeaderTimes.setAttribute("class", "fa fa-times");
          bannerHeader.appendChild(bannerHeaderTimes);
          bannerContent = document.createElement("div");
          bannerContent.setAttribute("class", "bannerContent");
          bannerContent.innerHTML = "<i class=\"fa fa-".concat(iconName, "\"></i> ");
          bannerContent.innerHTML += str;
          bannerBody.appendChild(bannerContent);
          numberOfBanners = document.querySelectorAll(".banner").length;
          bannerBody.style.transform = "translateY(calc(75px * ".concat(numberOfBanners - 1, "))");
          _context.next = 27;
          return regeneratorRuntime.awrap(sleep(2000));

        case 27:
          removeNotice();

        case 28:
        case "end":
          return _context.stop();
      }
    }
  });
}

function removeNotice() {
  var banner;
  return regeneratorRuntime.async(function removeNotice$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          banner = document.getElementById("banner");
          banner.style.transform = "translateY(-150%)";
          banner.style.opacity = "0";
          _context2.next = 5;
          return regeneratorRuntime.awrap(sleep(2010));

        case 5:
          banner.remove();

        case 6:
        case "end":
          return _context2.stop();
      }
    }
  });
}

function hideObject() {
  this.remove();
} // debugging convenience


var lastUsedParent = document.querySelector("#lastUsed .swiper-wrapper");
var lightSliderParent = document.getElementById("groups");
var sceneParent = document.querySelector("#scenes .swiper-wrapper");