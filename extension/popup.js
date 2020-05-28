function getBootstrapElement(element_name, class_names) {
    let element = document.createElement(element_name);
    for (class_name of class_names){
        element.classList.add(class_name);
    }
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

// Avoids duplicated names in teams
// Hash from https://jsperf.com/hashcodelordvlad
function hashTeam(teamString) {
    // Remove the iconcache before hashing
    teamString = teamString.replace(/,"iconCache":"[^}]*"/g, '');

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

/*
FIXME: this function needs to be duplicated in both popup.js and options.js
because I can't share the function via an import. When I try to make popup.js
a module, the extension doesn't work correctly. Need to look into why this is
*/
function checkError(errorMessage) {
    console.error(errorMessage);
    if (errorMessage.includes("QUOTA_BYTES_PER_ITEM")) {
        alert("Error, the team is too large to store. Try storing a smaller team.");
    } else if (errorMessage.includes("QUOTA_BYTES")) {
        alert("Error, you've used up all of your storage space. Delete some teams from the restore tab and try again.");
    } else if (errorMessage.includes("MAX_ITEMS")) {
        alert("Error, you've stored more than 512 teams. Delete some if you want to store more!");
    } else if (errorMessage.includes("MAX_WRITE_OPERATIONS_PER_HOUR")) {
        alert("Error, you've backed up or removed too many teams this hour. Please wait an hour and try again.");
    } else if (errorMessage.includes("MAX_WRITE_OPERATIONS_PER_MINUTE")) {
        alert("Error, you've backed up or removed too many teams this minute. Please wait a minute and try again.");
    } else {
        alert("Check the logs - there's been some other error with your request.");
    }
}

function backup(card) {
    let teamJSON = card.querySelector("#teamJSON").innerText;
    let teamKey = hashTeam(teamJSON);
    chrome.storage.sync.set({
        [teamKey]: teamJSON
    }, function () {
        // Check to see if there were any errors
        if (chrome.runtime.lastError) {
            let errorMessage = chrome.runtime.lastError.message;
            checkError(errorMessage);
            return;
        }
        console.log("Saved key " + teamKey + " with value " + teamJSON);
    });

    // Make sure the restored list gets updated correctly
    restoreList();
    updateProgressBar();
}

function restoreToShowdown(card) {
    console.log("restoring...");
    let teamString = card.querySelector("#teamJSON").innerText;
    let code = "{let x = document.createElement('div'); x.setAttribute('id', 'teamData'); x.setAttribute('style', 'display: none;'); x.innerText = '";
    code = code.concat(teamString);
    code = code.concat("'; document.body.appendChild(x)}");
    chrome.tabs.executeScript(null, {
        // One liner to create a div with the info we want. Clean this up in
        // restoreTeams.js
        code: code
    }, function () {
        chrome.tabs.executeScript(null, {
            file: "restoreTeams.js"
        }, function () {
            loadTeamsInShowdown();
            disableDuplicates(); // Use this function to send the disabled one to the bottom        
        });
    });
}

function restoreList(init = false) {
    chrome.storage.sync.get(null, function (syncedTeams) {
        // Check if there's nothing in storage
        if (Object.keys(syncedTeams).length === 0 && syncedTeams.constructor === Object) {
            // still use displayTeams function so it can be filled with "no teams available"
            displayTeams("[restore]", "syncedTeams", true)
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

        displayTeams(teamString, "syncedTeams", true);

        // Now, disable backing up ones that are already backed up
        disableDuplicates(init)
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
            enableButton(availableTeam.querySelector("#actionButton"), "btn-secondary", "btn-primary", "Backup", backupOnClick);
            availableTeams.removeChild(availableTeam);
            availableTeams.insertBefore(availableTeam, availableTeams.firstChild);
            break;
        }
    }

    card.parentNode.removeChild(card);
    updateProgressBar();
}

function deleteFromSync(card) {
    let teamName = card.querySelector("#teamName").innerText;
    let confirmDelete = confirm("Are you sure you want to delete " + teamName + "?");
    if (!confirmDelete) {
        let deleteButton = card.querySelector("#deleteTeam");
        deleteButton.classList.remove("disabled");
        return;
    }
    let teamString = card.querySelector("#teamJSON").innerText;
    let teamKey = hashTeam(teamString).toString();

    console.log("deleting team id " + teamKey + "...");
    chrome.storage.sync.remove(teamKey, function () {
        // Check to see if there were any errors
        if (chrome.runtime.lastError) {
            let errorMessage = chrome.runtime.lastError;
            checkError(errorMessage);
            return;
        }
        console.log("removed team id " + teamKey);
    });

    deleteRemoteCard(teamKey, card);
}

function createNoTeamsAvailableCard(additionalMessage = "") {
    let card = getBootstrapElement("div", ["card"]);
    card.classList.add("mb-1");
    card.classList.add("text-center");

    let card_body = getBootstrapElement("div", ["card-body"]);
    card_body.classList.add("p-1");
    let card_title = getBootstrapElement("small", ["card-title"]);
    let message = "<strong>No teams available.</strong>";
    // We have another message to add to the message box
    if (additionalMessage !== "") {
        message = message.concat(" ").concat(additionalMessage);
    }
    card_title.innerHTML = message;

    card_body.appendChild(card_title);
    card.appendChild(card_body);
    return card;
}

function displayTeams(teamsString, teamslist, restore) {
    let teams = ""
    let teamList = document.getElementById(teamslist);
    // Clear the list first
    while (teamList.firstChild) {
        teamList.removeChild(teamList.lastChild);
    }
    // Give user "no teams available" message if no team was passed in
    if (teamsString === "[]") {
        teamList.appendChild(createNoTeamsAvailableCard());
        return;
    } else if (teamsString === "[restore]") {
        // We have no synced teams available. Add advice to no teams available
        teamList.appendChild(createNoTeamsAvailableCard("Are you connected to the correct email? If not, sign into Chrome using the correct email. See <a href=\"https://google.com\" target=\"blank\">our FAQs</a> for more help."));
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
        let card = getBootstrapElement("div", ["card"]);
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

        let card_body = getBootstrapElement("div", ["card-body"]);
        card_body.classList.add("p-1");
        let card_title = getBootstrapElement("small", ["card-title"]);
        card_title.setAttribute("id", "teamName");
        card_title.innerHTML = "[" + sanitize(team.format) + "] " + sanitize(team.folder) + (team.folder !== "" ? "/" : "") + "<strong>" + sanitize(team.name) + "</strong>";

        let card_text = getBootstrapElement("p", ["card-text"]);
        card_text.classList.add("d-flex");
        card_text.classList.add("justify-content-center");
        card_text.classList.add("m-1");
        if ("iconCache" in team && team.iconCache.localeCompare("") !== 0) {
            card_text.innerHTML = team.iconCache;
        } else {
            // Icons haven't been loaded yet. Load manually
            // let teamString = card.querySelector("#teamJSON").innerText;
            let code = "{let x = document.createElement('div'); x.setAttribute('id', 'teamData'); x.setAttribute('style', 'display: none;'); x.innerText = '";
            code = code.concat(team.team);
            code = code.concat("'; document.body.appendChild(x)}");
            chrome.tabs.executeScript(null, {
                // One liner to create a div with the info we want. Clean this up in
                // restoreTeams.js
                code: code
            }, function () {
                chrome.tabs.executeScript(null, {
                    file: "getIcons.js"
                }, function (ret) {
                    if (ret) {
                        // Remove the first and last quotes, and un-escape the rest of the quotations
                        team.iconCache = ret[0].substr(1).slice(0, -1).replace(/\\\"/g, "\"");
                        card_text.innerHTML = team.iconCache;
                    } else {
                        card_text.innerText = "Couldn't load team icons manually.";
                    }
                });
            });
        }

        // If the iconCache == "!", then we aren't guaranteed to have the most up-to-date
        // version of the team, i.e. editing may be in progress.
        // See https://github.com/smogon/pokemon-showdown-client/blob/4188f623107cc5a13639fad79082406ec4aca152/js/storage.js#L1048
        if (team.iconCache === "!") {
            button.classList.add("disabled");
            button.classList.add("btn-danger");
            button.innerText = "Can't Backup"

            card_text.innerText = "Can't get team. You probably are currently editing this team in the teambuilder, please finish your edits and return to the main teambuilder page!";
        }

        let card_details = getBootstrapElement("p", ["d-none"]);
        card_details.setAttribute("id", "teamJSON");
        delete team.iconCache;
        card_details.innerText = JSON.stringify(team)

        card_body.appendChild(card_title);
        card_body.appendChild(card_text);
        card_body.appendChild(buttonGroup);
        card.appendChild(card_body);
        card.appendChild(card_details)
        teamList.appendChild(card);
    }

}

function moveDisabledToBottom(list, query) {
    let disabledArray = [];
    let enabledArray = []
    for (let team of list.children) {
        let checkQuery = null;
        try {
            checkQuery = team.querySelector("#actionButton").classList.contains(query);
        } catch {
            // the team action button doesn't exist. we can continue
            continue;
        }
        if (checkQuery) {
            // FIXME: this is a really bad way to do this but the behavior is reversed
            // when checking for disabled and checking for needToRestore
            if (query === "needToRestore") {
                enabledArray.push(team);
            } else {
                disabledArray.push(team);
            }
        } else {
            if (query === "needToRestore") {
                disabledArray.push(team);
            } else {
                enabledArray.push(team);
            }
        }
    }
    let listArray = enabledArray.concat(disabledArray);
    let newList = list.cloneNode(false);
    if (listArray.length === 0 || listArray[0] === undefined) {
        // We have no elements in the list. Push the "No teams available" card
        listArray = [];
        listArray.push(createNoTeamsAvailableCard());
    }
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

function backupOnClick() {
    console.log("clicked backup")
    // Check to make sure that the button isn't disabled
    if (this.classList.contains("disabled")) {
        return;
    }
    this.classList.add("disabled");
    disableButtonsWhileWaiting();
    // Send button's card to function
    backup(this.parentElement.parentElement.parentElement);
    disableDuplicates();
    enableButtonsAfterWaiting();
}

function deleteOnClick() {
    console.log("clicked delete")
    // Check to make sure that the button isn't disabled
    if (this.classList.contains("disabled")) {
        return;
    }
    this.classList.add("disabled");
    disableButtonsWhileWaiting();
    deleteFromSync(this.parentElement.parentElement.parentElement);
    disableDuplicates();
    enableButtonsAfterWaiting();
}

function restoreOnClick() {
    console.log("clicked restore");
    // Check to make sure that the button isn't disabled
    if (this.classList.contains("disabled")) {
        return;
    }
    this.classList.add("disabled");
    let card = this.parentElement.parentElement.parentElement;
    disableButton(card.querySelector("#actionButton"), "btn-warning", "btn-secondary", "Already Loaded");
    disableButtonsWhileWaiting();
    // Send the button's card to the function
    restoreToShowdown(card);
    enableButtonsAfterWaiting();
}

function enableButton(button, old_color, new_color, new_text, onClick) {
    button.classList.remove("disabled");
    button.classList.remove(old_color);
    button.classList.add(new_color);
    button.innerText = new_text;
    // Store team in chrome sync when backup button clicked
    button.addEventListener("click", onClick, false);
}

function disableButtonsWhileWaiting() {
    let allButtonElements = document.querySelectorAll("button:not(.disabled)");
    for (button of allButtonElements) {
        button.classList.add("disabled");
        button.classList.add("needToRestore");
    }
}

function enableButtonsAfterWaiting() {
    let allButtonElements = document.querySelectorAll("button.needToRestore");
    for (button of allButtonElements) {
        button.classList.remove("disabled");
        button.classList.remove("needToRestore");
    }
}

function startButtonListeners() {
    // assign the buttons their onclicks
    // Restore team to showdown from chrome sync when restore button clicked
    let restoreButtonQuery = document.querySelectorAll('button.btn-warning');
    for (let i = 0; i < restoreButtonQuery.length; i++) {
        restoreButtonQuery[i].addEventListener("click", restoreOnClick, false);
    }

    // Delete team from backup when restore button clicked
    let deleteButtonQuery = document.querySelectorAll('button.btn-danger');
    for (let i = 0; i < deleteButtonQuery.length; i++) {
        deleteButtonQuery[i].addEventListener("click", deleteOnClick, false);
    }

    // Store team in chrome sync when backup button clicked
    let backupButtonQuery = document.querySelectorAll('button.btn-primary');
    for (let i = 0; i < backupButtonQuery.length; i++) {
        backupButtonQuery[i].addEventListener("click", backupOnClick, false);
    }
}

function disableDuplicates(init = false) {
    let availableTeams = document.getElementById("localTeams");
    let restoreTeams = document.getElementById("syncedTeams");

    // Go through each combination and see if there's a match
    for (let availableTeam of availableTeams.children) {
        let availableTeamHash = null;
        try {
            availableTeamHash = hashTeam(availableTeam.querySelector("#teamJSON").innerText);
        } catch {
            break;
        }
        for (let restoreTeam of restoreTeams.children) {
            let restoreTeamHash = null;
            try {
                restoreTeamHash = hashTeam(restoreTeam.querySelector("#teamJSON").innerText);
            } catch {
                break;
            }
            if (availableTeamHash === restoreTeamHash) {
                // Disable buttons and change their color
                disableButton(availableTeam.querySelector("#actionButton"), "btn-primary", "btn-secondary", "Backed Up");
                disableButton(restoreTeam.querySelector("#actionButton"), "btn-warning", "btn-secondary", "Already Loaded")
                break;
            }
        }
    }

    let query = "needToRestore";
    if (init) {
        query = "disabled";
    }
    availableTeams.parentNode.replaceChild(moveDisabledToBottom(availableTeams, query), availableTeams)
    restoreTeams.parentNode.replaceChild(moveDisabledToBottom(restoreTeams, query), restoreTeams)

    startButtonListeners();
    search();
}

// Runs when extension is loaded
// Check for Showdown teams
function loadTeamsInShowdown() {
    chrome.tabs.executeScript(null, {
        file: "getAvailableTeams.js"
    }, function (ret) {
        document.getElementById("searchLocalTeams").value = localStorage.getItem("localSearchTerm");
        displayTeams(ret[0], "localTeams");
        restoreList("init");
        startButtonListeners();
        // disableDuplicates();
    });
}

function updateProgressBar() {
    let progressBarDiv = document.getElementById("storageProgress");
    let storagePercentageDiv = document.getElementById("storagePercentageLabel");
    let byteLimit = 100000;
    chrome.storage.sync.getBytesInUse(null, function (bytesInUse) {
        let bytePercentage = Math.round((byteLimit - bytesInUse) / byteLimit * 100);
        progressBarDiv.setAttribute("style", "width: " + bytePercentage + "%");
        storagePercentageDiv.innerText = bytePercentage + "%";
        storagePercentageDiv.setAttribute("title", bytesInUse + " bytes in use");
    });
}

// Send message to background.js to let it know to send email over
chrome.runtime.sendMessage({
    msg: "openedExtension"
});

// Check messages sent from background.js for email
chrome.runtime.onMessage.addListener(
    function (request, _sender, sendResponse) {
        console.log(request);
        let emailSyncLabel = document.getElementById("emailSyncLabel");
        if (request.msg === "email") {
            emailSyncLabel.innerText = request.content;
        }
    }
);

// Main execution
loadTeamsInShowdown();
updateProgressBar();