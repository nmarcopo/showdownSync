function getBootstrapElement(element_name, class_name) {
    let element = document.createElement(element_name);
    element.classList.add(class_name);
    return element;
}

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
        if (!element.children[0].children[0].innerText.includes(searchTerm)) {
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

function backup(card) {
    let teamName = card.children[0].children[0].innerText;
    let teamJSON = card.children[2].innerText;
    chrome.storage.sync.set({
        [teamName]: teamJSON
    }, function () {
        console.log("Saved key " + teamName + " with value " + teamJSON)
    });

    card.children[1].classList.add("disabled")
    card.children[1].classList.remove("btn-primary");
    card.children[1].classList.add("btn-secondary");
    card.children[1].innerText = "Backed Up";

    // Make sure the restored list gets updated correctly
    restoreList();
}

function restoreToShowdown(card) {
    console.log("restoring...");
    let teamString = card.children[2].innerText;
    let code = "{let x = document.createElement('div'); x.setAttribute('id', 'teamData'); x.innerText = '";
    code = code.concat(teamString);
    code = code.concat("'; document.body.appendChild(x)}");
    chrome.tabs.executeScript(null, {
        // One liner to create a div with the info we want. Clean this up in
        // restoreTeams.js
        code: code
        // code: "console.warn(\"it works\")"
    }, function () {
        chrome.tabs.executeScript(null, {
            file: "restoreTeams.js"
        });
    });
}

function restoreList() {
    chrome.storage.sync.get(null, function (syncedTeams) {
        // Check if there's nothing in storage
        if (Object.keys(syncedTeams).length === 0 && syncedTeams.constructor === Object) {
            return;
        }
        console.log(syncedTeams);

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

function displayTeams(teamsString, teamslist, restore) {
    console.log(teamsString)
    let teams = ""
    try {
        teams = JSON.parse(teamsString);
    } catch (error) {
        console.error("Teams are corrupted and we can't parse the JSON. Here are the teams:")
        console.error(teamsString)
        alert("Your teams are corrupted. Check the logs for details. Try clearing your saved teams in the options menu to fix this.")
        throw new Error("Teams cannot be parsed")
    }
    let teamList = document.getElementById(teamslist);
    for (team of teams) {
        let card = getBootstrapElement("div", "card");
        card.classList.add("mb-1");

        let button = document.createElement("button");
        button.type = "button";
        button.classList.add("btn");
        if (!restore) {
            button.classList.add("btn-primary");
            button.innerText = "Backup";
        } else {
            button.classList.add("btn-warning");
            button.innerText = "Restore";
        }

        let card_body = getBootstrapElement("div", "card-body");
        card_body.classList.add("p-1");
        let card_title = getBootstrapElement("small", "card-title");
        card_title.innerHTML = "[" + sanitize(team.format) + "] " + sanitize(team.folder) + (team.folder !== "" ? "/" : "") + "<strong>" + sanitize(team.name) + "</strong>";

        let card_text = getBootstrapElement("p", "card-text");
        if ("iconCache" in team) {
            card_text.innerHTML = team.iconCache;
        } else {
            card_text.innerText = "Can't get Pokemon icons, try refreshing."
        }

        let card_details = getBootstrapElement("p", "d-none");
        // card_details.innerText = team.format + "]" + team.folder + (team.folder !== "" ? "/" : "") + team.name + team.team
        card_details.innerText = JSON.stringify(team)

        card_body.appendChild(card_title);
        card_body.appendChild(card_text);
        card.appendChild(card_body);
        card.appendChild(button);
        card.appendChild(card_details)
        teamList.appendChild(card);
    }
}

function moveDisabledToBottom(list) {
    let listArray = [];
    for (let team of list.children) {
        if(team.children[1].classList.contains("disabled")){
            listArray.push(team);
        }else{
            listArray.unshift(team);
        }
    }
    let newList = list.cloneNode(false);
    for(team of listArray){
        newList.appendChild(team)
    }
    return newList
}

function disableDuplicates() {
    let availableTeams = document.getElementById("localTeams");
    let restoreTeams = document.getElementById("syncedTeams");

    // Go through each combination and see if there's a match
    for (let availableTeam of availableTeams.children) {
        let availableTeamText = availableTeam.children[2].innerText;
        for (let restoreTeam of restoreTeams.children) {
            let restoreTeamText = restoreTeam.children[2].innerText;
            if (availableTeamText === restoreTeamText) {
                // Disable buttons and change their color
                availableTeam.children[1].classList.add("disabled");
                availableTeam.children[1].classList.remove("btn-primary");
                availableTeam.children[1].classList.add("btn-secondary");
                availableTeam.children[1].innerText = "Backed Up";
                

                restoreTeam.children[1].classList.add("disabled");
                restoreTeam.children[1].classList.remove("btn-warning");
                restoreTeam.children[1].classList.add("btn-secondary");
                restoreTeam.children[1].innerText = "Already Loaded";
                break;
            }
        }
    }

    availableTeams.parentNode.replaceChild(moveDisabledToBottom(availableTeams), availableTeams)
    restoreTeams.parentNode.replaceChild(moveDisabledToBottom(restoreTeams), restoreTeams)

    // Now that this is all done, we can assign the buttons their onclicks
    // Restore team to showdown from chrome sync when restore button clicked
    let restoreButtonQuery = document.querySelectorAll('button.btn-warning');
    for (let i = 0; i < restoreButtonQuery.length; i++) {
        restoreButtonQuery[i].addEventListener("click", function () {
            restoreToShowdown(this.parentElement);
        }, false);
    }
}

// Runs when extension is loaded
// Check for Showdown teams
chrome.tabs.executeScript(null, {
    // ReturnValues is a function from retrieveValue.js
    file: "getAvailableTeams.js"
}, function (ret) {
    document.getElementById("searchLocalTeams").value = localStorage.getItem("localSearchTerm");
    displayTeams(ret[0], "localTeams");
    restoreList();

    search();

    // Store team in chrome sync when backup button clicked
    let backupButtonQuery = document.querySelectorAll('button.btn-primary');
    for (let i = 0; i < backupButtonQuery.length; i++) {
        backupButtonQuery[i].addEventListener("click", function () {
            backup(this.parentElement);
        }, false);
    }
});