function getBootstrapElement(element_name, class_name) {
    let element = document.createElement(element_name);
    element.classList.add(class_name);
    return element;
}

// Sanitize function from here: https://stackoverflow.com/a/48226843/10665534
function sanitize(string) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        "/": '&#x2F;',
    };
    const reg = /[&<>"'/]/ig;
    return string.replace(reg, (match) => (map[match]));
}

function showTeams(searchTerm) {
    var videos = document.getElementsByClassName("card");
    Array.from(videos).forEach(element => {
        if (!element.children[0].children[0].innerText.toLowerCase().includes(searchTerm.toLowerCase())) {
            // if the search result is not in one of the strings of videos, hide it
            element.classList.add("d-none");
        } else {
            // if it is, show it
            element.classList.remove("d-none");
        }
    });
    localStorage.setItem("localSearchTerm", searchTerm);
}

function search() {
    let searchbox = document.getElementById("searchLocalTeams");
    showTeams(searchbox.value)
    searchbox.onkeyup = function () {
        showTeams(searchbox.value);
    }
}

// Avoids with duplicated names in teams
// Hash from https://jsperf.com/hashcodelordvlad
function hashTeam(teamString) {
    let hash = 0,
        i, char;
    if (teamString.length == 0) return hash;
    for (i = 0, l = teamString.length; i < l; i++) {
        char = teamString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

function backup(card) {
    let teamJSON = card.querySelector("#teamJSON").innerText;
    let teamKey = hashTeam(teamJSON);
    chrome.storage.sync.set({
        [teamKey]: teamJSON
    }, function () {
        console.log("Saved key " + teamKey + " with value " + teamJSON)
    });

    // Make sure the restored list gets updated correctly
    restoreList();
    updateProgressBar();
}

function restoreToShowdown(card) {
    console.log("restoring...");
    let teamString = card.querySelector("#teamJSON").innerText;
    let code = "{let x = document.createElement('div'); x.setAttribute('id', 'teamData'); x.innerText = '";
    code = code.concat(teamString);
    code = code.concat("'; document.body.appendChild(x)}");
    chrome.tabs.executeScript(null, {
        // One liner to create a div with the info we want. Clean this up in
        // restoreTeams.js
        code: code
    }, function () {
        chrome.tabs.executeScript(null, {
            file: "restoreTeams.js"
        });
    });
    disableButton(card.querySelector("#actionButton"), "btn-warning", "btn-secondary", "Already Loaded");
    disableDuplicates(); // Use this function to send the disabled one to the bottom
}

function restoreList() {
    chrome.storage.sync.get(null, function (syncedTeams) {
        // Check if there's nothing in storage
        if (Object.keys(syncedTeams).length === 0 && syncedTeams.constructor === Object) {
            // still use displayTeams function so it can be filled with "no teams available"
            displayTeams("[]", "syncedTeams", true)
            return;
        }

        // Parse storage if there is stuff
        let teamString = "[";
        for (let [, val] of Object.entries(syncedTeams)) {
            teamString = teamString.concat(val);
            teamString = teamString.concat(",");
        }
        teamString = teamString.slice(0, -1); // Get rid of trailing comma
        teamString = teamString.concat("]");

        // Clear out the restore list before displaying new ones
        document.getElementById("syncedTeams").innerHTML = "";
        displayTeams(teamString, "syncedTeams", true);

        // Now, disable backing up ones that are already backed up
        disableDuplicates();
    });
}

function deleteRemoteCard(teamKey, card) {
    // Re-enable the button in "backup"
    let availableTeams = document.getElementById("localTeams");

    // Go through each combination and see if there's a match
    for (let availableTeam of availableTeams.children) {
        let availableTeamKey = hashTeam(availableTeam.querySelector("#teamJSON").innerText).toString();
        if (availableTeamKey === teamKey) {
            // Enable button and change its color
            enableButton(availableTeam.querySelector("#actionButton"), "btn-secondary", "btn-primary", "Backup");
            break;
        }
    }

    card.parentNode.removeChild(card);
    availableTeams.parentNode.replaceChild(moveDisabledToBottom(availableTeams), availableTeams)
    startButtonListeners();
    updateProgressBar();
}

function deleteFromSync(card) {
    chrome.storage.sync.get(null, function (items) {
        console.log(items);
    });

    let teamName = card.querySelector("#teamName").innerText;
    let confirmDelete = confirm("Are you sure you want to delete " + teamName + "?");
    if (!confirmDelete) {
        return;
    }
    let teamString = card.querySelector("#teamJSON").innerText;
    let teamKey = hashTeam(teamString).toString();

    console.log("deleting team id " + teamKey + "...");
    chrome.storage.sync.remove(teamKey, function () {
        console.log("removed team id " + teamKey);
    });

    deleteRemoteCard(teamKey, card);
}

function displayTeams(teamsString, teamslist, restore) {
    let teams = ""
    let teamList = document.getElementById(teamslist);
    // Give user "no teams available" message if no team was passed in
    if (teamsString === "[]") {
        let card = getBootstrapElement("div", "card");
        card.classList.add("mb-1");
        card.classList.add("text-center");

        let card_body = getBootstrapElement("div", "card-body");
        card_body.classList.add("p-1");
        let card_title = getBootstrapElement("small", "card-title");
        card_title.innerHTML = "<strong>No teams available.</strong>";

        card_body.appendChild(card_title);
        card.appendChild(card_body);
        teamList.appendChild(card);
        return;
    }

    try {
        teams = JSON.parse(teamsString);
    } catch (error) {
        console.error("Teams are corrupted and we can't parse the JSON. Here are the teams:")
        console.error(teamsString)
        alert("Your teams are corrupted. Check the logs on this extension for details. Try clearing your saved teams in the options menu to fix this.")
        throw new Error("Teams cannot be parsed")
    }
    for (team of teams) {
        let card = getBootstrapElement("div", "card");
        card.classList.add("mb-1");
        card.classList.add("text-center");

        let buttonGroup = document.createElement("div");
        buttonGroup.classList.add("btn-group");
        buttonGroup.classList.add("m-1");

        let button = document.createElement("button");
        button.type = "button";
        button.classList.add("btn");
        if (!restore) {
            button.classList.add("btn-primary");
            button.innerText = "Backup";
            button.setAttribute("id", "actionButton");
        } else {
            button.classList.add("btn-warning");
            button.innerText = "Restore";
            button.setAttribute("id", "actionButton");
        }

        buttonGroup.appendChild(button);

        if (restore) {
            let deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.setAttribute("id", "deleteTeam");
            deleteButton.classList.add("btn");
            deleteButton.classList.add("btn-danger");
            deleteButton.innerText = "Delete Backup";
            buttonGroup.appendChild(deleteButton);
        }

        let card_body = getBootstrapElement("div", "card-body");
        card_body.classList.add("p-1");
        let card_title = getBootstrapElement("small", "card-title");
        card_title.setAttribute("id", "teamName");
        card_title.innerHTML = "[" + sanitize(team.format) + "] " + sanitize(team.folder) + (team.folder !== "" ? "/" : "") + "<strong>" + sanitize(team.name) + "</strong>";

        let card_text = getBootstrapElement("p", "card-text");
        card_text.classList.add("d-flex");
        card_text.classList.add("justify-content-center");
        card_text.classList.add("m-1");
        if ("iconCache" in team) {
            card_text.innerHTML = team.iconCache;
        } else {
            card_text.innerText = "Can't get Pokemon icons, try refreshing."
        }

        let card_details = getBootstrapElement("p", "d-none");
        card_details.setAttribute("id", "teamJSON");
        console.log(team);
        // Need to make sure that iconCache is the last element in the array
        // so that the restore regex works.
        let teamKeys = Object.keys(team);
        teamKeys.splice(Object.keys(teamKeys).indexOf("iconCache"), 1);
        teamKeys.push("iconCache");
        card_details.innerText = JSON.stringify(team, teamKeys);
        console.log(card_details.innerText);

        card_body.appendChild(card_title);
        card_body.appendChild(card_text);
        card_body.appendChild(buttonGroup);
        card.appendChild(card_body);
        card.appendChild(card_details)
        teamList.appendChild(card);
    }
}

function moveDisabledToBottom(list) {
    let listArray = [];
    for (let team of list.children) {
        if (team.querySelector("#actionButton").classList.contains("disabled")) {
            listArray.push(team);
        } else {
            listArray.unshift(team);
        }
    }
    let newList = list.cloneNode(false);
    for (team of listArray) {
        newList.appendChild(team)
    }
    return newList
}

function disableButton(button, old_color, new_color, new_text) {
    button.classList.add("disabled");
    button.classList.remove(old_color);
    button.classList.add(new_color);
    button.innerText = new_text;
}

function enableButton(button, old_color, new_color, new_text) {
    button.classList.remove("disabled");
    button.classList.remove(old_color);
    button.classList.add(new_color);
    button.innerText = new_text;
}

function startButtonListeners() {
    // Now that this is all done, we can assign the buttons their onclicks
    // Restore team to showdown from chrome sync when restore button clicked
    let restoreButtonQuery = document.querySelectorAll('button.btn-warning');
    for (let i = 0; i < restoreButtonQuery.length; i++) {
        restoreButtonQuery[i].addEventListener("click", function () {
            console.log("clicked restore")
            // Check to make sure that the button isn't disabled
            if (this.classList.contains("disabled")) {
                return;
            }
            // Send the button's card to the function
            restoreToShowdown(this.parentElement.parentElement.parentElement);
        }, false);
    }

    // Delete team from backup when restore button clicked
    let deleteButtonQuery = document.querySelectorAll('button.btn-danger');
    for (let i = 0; i < deleteButtonQuery.length; i++) {
        deleteButtonQuery[i].addEventListener("click", function () {
            console.log("clicked delete")
            // Check to make sure that the button isn't disabled
            if (this.classList.contains("disabled")) {
                return;
            }
            deleteFromSync(this.parentElement.parentElement.parentElement);
        }, false);
    }

    // Store team in chrome sync when backup button clicked
    let backupButtonQuery = document.querySelectorAll('button.btn-primary');
    for (let i = 0; i < backupButtonQuery.length; i++) {
        backupButtonQuery[i].addEventListener("click", function () {
            console.log("clicked backup")
            // Check to make sure that the button isn't disabled
            if (this.classList.contains("disabled")) {
                return;
            }
            // Send button's card to function
            backup(this.parentElement.parentElement.parentElement);
        }, false);
    }
}

function disableDuplicates() {
    let availableTeams = document.getElementById("localTeams");
    let restoreTeams = document.getElementById("syncedTeams");

    // Go through each combination and see if there's a match
    for (let availableTeam of availableTeams.children) {
        let availableTeamText = availableTeam.querySelector("#teamJSON").innerText;
        for (let restoreTeam of restoreTeams.children) {
            let restoreTeamText = restoreTeam.querySelector("#teamJSON").innerText;
            if (availableTeamText === restoreTeamText) {
                // Disable buttons and change their color
                disableButton(availableTeam.querySelector("#actionButton"), "btn-primary", "btn-secondary", "Backed Up");
                disableButton(restoreTeam.querySelector("#actionButton"), "btn-warning", "btn-secondary", "Already Loaded")
                break;
            }
        }
    }

    availableTeams.parentNode.replaceChild(moveDisabledToBottom(availableTeams), availableTeams)
    restoreTeams.parentNode.replaceChild(moveDisabledToBottom(restoreTeams), restoreTeams)

    startButtonListeners();
    search();
}

// Runs when extension is loaded
// Check for Showdown teams
chrome.tabs.executeScript(null, {
    file: "getAvailableTeams.js"
}, function (ret) {
    document.getElementById("searchLocalTeams").value = localStorage.getItem("localSearchTerm");
    displayTeams(ret[0], "localTeams");
    restoreList();
});

function updateProgressBar() {
    let progressBarDiv = document.getElementById("storageProgress");
    let storagePercentageDiv = document.getElementById("storagePercentageLabel");
    let byteLimit = 100000;
    chrome.storage.sync.getBytesInUse(null, function (bytesInUse) {
        let bytePercentage = Math.round((byteLimit - bytesInUse) / byteLimit * 100);
        progressBarDiv.setAttribute("style", "width: " + bytePercentage + "%");
        storagePercentageDiv.innerText = bytePercentage + "%";
    });
}
updateProgressBar();