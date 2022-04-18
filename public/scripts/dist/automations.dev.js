"use strict";

// debug function
function makeDebugAutomation() {
  clearNewAutomationForm();
  var randomArray = ["foo", "bar", "test", "autoaton", "automasda", "asodjsajoda"]; // title

  document.getElementById("automationName").value = randomArray[Math.floor(Math.random() * randomArray.length - 1)];
  document.getElementById("automationTime").value = "12:00";
  saveAutomation();
} // helper functions


function closeOverlay() {
  document.getElementById("colorOverlay").style.display = "none";

  try {
    document.getElementById("menu").style.width = "0";
    document.getElementById("menuOpener").style.opacity = "1";
  } catch (e) {
    console.log(e);
  }
}

function stopProp(ele) {
  console.log(ele);
  ele.stopPropagation();
}

function clearNewAutomation() {
  return new Promise(function (resolve, reject) {
    var newAutomationWrapper = document.getElementById("newAutomation");

    try {
      newAutomationWrapper.querySelectorAll("input").forEach(function (input) {
        input.value = "";
      });
      resolve();
    } catch (e) {
      console.error(e);
      reject();
    }
  });
}

function clearCurrentAutomations() {
  return regeneratorRuntime.async(function clearCurrentAutomations$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          return _context.abrupt("return", new Promise(function (resolve, reject) {
            var currentAutomations = document.querySelectorAll(".automationWrapper");
            console.log(currentAutomations);

            for (i = currentAutomations.length - 1; i >= 0; i--) {
              currentAutomations[i].remove();
            }

            resolve();
          }));

        case 1:
        case "end":
          return _context.stop();
      }
    }
  });
}

function closeNewAutomation() {
  document.getElementById("newAutomation").style.display = "none";
  clearNewAutomation();
}

function toggleTag(tag) {
  if (tag.dataset.active == "true") {
    // disable
    tag.dataset.active = "false";
  } else {
    tag.dataset.active = "true";
  }
}

function openAutomation(id) {
  var newAutomation, wrapper;
  return regeneratorRuntime.async(function openAutomation$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          newAutomation = document.getElementById("newAutomation");
          newAutomation.querySelector(".title h1").textContent = "Edit Automation";
          wrapper = newAutomation;
          getAutomation(id).then(function (automation) {
            console.log(automation);
            document.getElementById("automationName").value = automation.nickname;
            document.getElementById("automationTime").value = "".concat(automation.time.hour, ":").concat(automation.time.minute);
            document.getElementById("automationActionSelect").value = automation.action;
            document.getElementById("automationSelectAffectedRooms").value = automation.rooms;

            if (automation.weekday) {
              document.getElementById("automationRepeat").querySelector(".tag[data-tag='weekday']").dataset.active = true;
            }

            if (automation.weekend) {
              document.getElementById("automationRepeat").querySelector(".tag[data-tag='weekend']").dataset.active = true;
            }

            if (automation.smoothStateChange) {
              document.getElementById("automationSmoothStateChange").value = true;
            }

            wrapper.style.display = "block";
            newAutomation.querySelector(".btn-primary").setAttribute("onclick", "saveAutomation('".concat(id, "')"));
          });

        case 4:
        case "end":
          return _context2.stop();
      }
    }
  });
} // automation internal stuff


function makeAutomations(automation) {
  var autoWrapper = document.createElement("div");
  autoWrapper.setAttribute("class", "automationWrapper");
  autoWrapper.setAttribute("id", automation._id);
  autoWrapper.setAttribute("onclick", "toggleAutomation(this)");

  if (automation.active) {
    autoWrapper.dataset.active = "true";
  } else {
    autoWrapper.dataset.active = "false";
  }

  var autoTitleWrapper = document.createElement("div");
  autoTitleWrapper.setAttribute("class", "autoTitleWrapper");
  var autoTitle = document.createElement("div");
  autoTitle.textContent = automation.nickname;
  autoTitle.setAttribute("class", "automationNickname");
  autoTitleWrapper.appendChild(autoTitle);
  var autoTime = document.createElement("div");
  autoTime.textContent = "".concat(automation.time.hour, ":").concat(automation.time.minute);
  autoTitleWrapper.appendChild(autoTime);
  autoWrapper.appendChild(autoTitleWrapper);
  var tags = document.createElement("div");
  tags.setAttribute("class", "tagWrapper");
  var actionWrapper = document.createElement("div");
  actionWrapper.setAttribute("class", "actionWrapper");
  autoWrapper.appendChild(actionWrapper);
  var actionlabel = document.createElement("span");
  actionlabel.textContent = "Action";
  actionWrapper.appendChild(actionlabel);
  var action = document.createElement("span");
  action.textContent = automation.action;
  actionWrapper.appendChild(action);

  if (automation.smoothStateChange) {
    var smoothWrapper = document.createElement("div");
    smoothWrapper.setAttribute("class", "actionWrapper");
    autoWrapper.appendChild(smoothWrapper);
    var smoothLabel = document.createElement("span");
    smoothLabel.textContent = "Transition Speed";
    smoothWrapper.appendChild(smoothLabel);
    var smooth = document.createElement("span");
    smooth.textContent = "".concat(automation.transitionSpeed, "%p/s");
    smoothWrapper.appendChild(smooth);
  }

  if (automation.weekday) {
    var weekdayTag = document.createElement("span");
    weekdayTag.textContent = "weekday";
    weekdayTag.setAttribute("class", "tag");

    if (automation.active) {
      weekdayTag.dataset.active = true;
    }

    tags.appendChild(weekdayTag);
  }

  if (automation.weekend) {
    var weekendTag = document.createElement("span");
    weekendTag.textContent = "weekend";
    weekendTag.setAttribute("class", "tag");

    if (automation.active) {
      weekendTag.dataset.active = true;
    }

    tags.appendChild(weekendTag);
  }

  autoWrapper.appendChild(tags);
  document.getElementById("current_automations").append(autoWrapper);
  var iconWrapper = document.createElement("div");
  iconWrapper.setAttribute("class", "iconWrapper");
  autoWrapper.appendChild(iconWrapper);
  var editWrapper = document.createElement("div");
  editWrapper.setAttribute("class", "editWrapper");
  editWrapper.setAttribute("onclick", "openAutomation('".concat(automation._id, "'); event.stopPropagation();"));
  iconWrapper.appendChild(editWrapper);
  var editIcon = document.createElement("i");
  editIcon.setAttribute("class", "fa-solid fa-pen");
  editWrapper.appendChild(editIcon);
  var removeWrapper = document.createElement("div");
  removeWrapper.setAttribute("class", "removeWrapper");
  removeWrapper.setAttribute("onclick", "removeAutomation('".concat(automation._id, "')"));
  iconWrapper.appendChild(removeWrapper);
  var trashIcon = document.createElement("i");
  trashIcon.setAttribute("class", "fa-solid fa-trash");
  removeWrapper.appendChild(trashIcon);
  removeWrapper.style.height = "0px";
  var hammertime = new Hammer(autoWrapper);
  hammertime.get('swipe').set({
    direction: Hammer.DIRECTION_VERTICAL
  });
  hammertime.on("swipeup", function (ev) {
    if (removeWrapper.style.height == "0px") {
      removeWrapper.style.height = "43px";
      editWrapper.style.height = "43px";
    } else {
      removeWrapper.style.height = "0px";
      editWrapper.style.height = "0px";
    }
  });
  hammertime.on("swipedown", function (ev) {
    if (removeWrapper.style.height == "0px") {
      removeWrapper.style.height = "43px";
      editWrapper.style.height = "43px";
    } else {
      removeWrapper.style.height = "0px";
      editWrapper.style.height = "0px";
    }
  });
}

function getCurrentAutomations() {
  var groups, diff, currentDate, lastUpdated, _LASTUPDATE_DIFF_IN_DAYS, url;

  return regeneratorRuntime.async(function getCurrentAutomations$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.next = 2;
          return regeneratorRuntime.awrap(clearCurrentAutomations());

        case 2:
          try {
            // Fill groups
            if (!document.getElementById("automationSelectAffectedRooms").querySelectorAll("option").length > 0) {
              groups = localStorage.getItem("groups").split(",");
              groups.forEach(function (group) {
                var parent = document.getElementById("automationSelectAffectedRooms");
                var option = document.createElement("option");
                option.textContent = group;
                option.setAttribute("value", group);
                parent.appendChild(option);
              });
            }
          } catch (e) {
            console.error(e);
          }

          if (localStorage.hasOwnProperty("lastUpdated")) {
            currentDate = new Date().getTime(), lastUpdated = parseInt(localStorage.getItem("lastUpdated"));
            diff = currentDate - lastUpdated;
          } else {
            diff = false;
          }

          _LASTUPDATE_DIFF_IN_DAYS = 2; // updates localStorage if no cache was made or if
          // lastUpdate is longer than n days ago

          if (true) {
            url = "".concat(HOST, "/api/v2/automations/get");
            fetch(url).then(function (res) {
              return res.json();
            }).then(function (res) {
              console.log(res);
              localStorage.setItem("automations", JSON.stringify(res));
              localStorage.setItem("lastUpdated", cleanTimeString(getTimeString()));
              res.forEach(function (automation) {
                makeAutomations(automation);
              });
            });
          } else {
            JSON.parse(localStorage.getItem("automations")).forEach(function (automation) {
              makeAutomations(automation);
            });
          }

        case 6:
        case "end":
          return _context3.stop();
      }
    }
  });
}

function getAutomation(id) {
  return regeneratorRuntime.async(function getAutomation$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          return _context4.abrupt("return", new Promise(function (resolve, reject) {
            var url = "".concat(HOST, "/api/v2/automations/get/").concat(id);
            fetch(url).then(function (res) {
              return res.json();
            }).then(function (res) {
              resolve(res[0]);
            });
          }));

        case 1:
        case "end":
          return _context4.stop();
      }
    }
  });
}

function removeAutomation(id) {
  var url = "".concat(HOST, "/api/v2/automations/remove");
  var body = {
    id: id
  };
  var options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  };

  try {
    fetch(url, options).then(function (res) {
      console.log(res);
      document.getElementById(id).remove();
      localStorage.removeItem("automations");
      localStorage.removeItem("lastUpdated");

      if (res.status != 200) {
        console.error("status is not 200");
        makeNotice("Warning", "The automation could not be removed", "negative");
      } else {
        makeNotice("Notice", "The automation has been removed");
      }
    });
  } catch (e) {
    console.error(e);
    makeNotice("Warning", "The automation could not be removed", "negative");
  }
}

function toggleAutomation(ele) {
  var endpoint, newState;

  if (ele.dataset.active == "true") {
    endpoint = "stop";
    newState = false;
  } else {
    endpoint = "start";
    newState = true;
  }

  var body = {
    id: ele.id,
    automationName: ele.querySelector(".automationNickname").textContent
  };
  var options = {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json"
    }
  };
  var url = "".concat(HOST, "/api/v2/automations/").concat(endpoint);
  fetch(url, options).then(function (res) {
    ele.dataset.active = newState;
    ele.querySelectorAll(".tag").forEach(function (tag) {
      tag.dataset.active = newState;
    });
  });
}

function clearNewAutomationForm() {
  var form = document.getElementById("newAutomation");
  var formEles = form.querySelectorAll(".toSave");
  formEles.forEach(function (ele) {
    try {
      ele.value = "";
    } catch (e) {
      console.error("Expected:", e);
    }
  });
  form.querySelector(".btn-primary").setAttribute("onclick", "saveAutomation();");
}

function newAutomation() {
  clearNewAutomationForm();
  document.getElementById("newAutomation").querySelector(".title h1").textContent = "New Automation";
  document.getElementById("newAutomation").style.display = "block";
}

function saveAutomation() {
  var id = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "new";
  var automationToSave = {}; // inputs

  var inputs = document.querySelectorAll("#newAutomation .toSave");
  inputs.forEach(function (input) {
    automationToSave[input.id] = input.value;
  }); // checkbox

  automationToSave["automationSmoothStateChange"] = document.getElementById("automationSmoothStateChange").checked; // exit when no nickname given

  if (automationToSave.automationName.length == 0) {
    alert("Please enter an automation Name");
    return;
  } // repeats


  var repeatTags = document.querySelectorAll("#automationRepeat .tag");
  repeatTags.forEach(function (tag) {
    var rawTag = tag.dataset.tag;
    isActive = false;

    if (tag.dataset.active == "true") {
      isActive = true;
    }

    automationToSave[rawTag] = isActive;
  });
  console.log("Automation to save:", automationToSave, id);
  automationToSave.scheduleTime = {
    "hourTenths": automationToSave.automationTime[0],
    "hourSingle": automationToSave.automationTime[1],
    "minuteTenths": automationToSave.automationTime[3],
    "minuteSingle": automationToSave.automationTime[4]
  };

  if (id.length == 0) {
    automationToSave._id = id;
  }

  var body = automationToSave;
  var options = {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json"
    }
  };
  var url = "".concat(HOST, "/api/v2/automations/set");
  url += "/".concat(id);
  fetch(url, options).then(function (res) {
    console.log(res);
    makeNotice("Automation saved", "Your new Automation has been saved");
    document.getElementById("newAutomation").style.display = "none";
    localStorage.removeItem("automations");
    localStorage.removeItem("lastUpdated");
    getCurrentAutomations();
  });
} // TIME UTILS
// returns normalized timestrings -> 0h 0min 0sec


function cleanTimeString(str) {
  var date = new Date(str);
  var hours = date.getHours() * 3600000;
  var minutes = date.getMinutes() * 60000;
  var seconds = date.getSeconds() * 1000;
  str = str - (hours + minutes + seconds) + 1000; //console.log(new Date(str));

  return str;
}

function getTimeString() {
  return new Date().getTime();
}

function getOneDayInMs() {
  return 86400000;
}