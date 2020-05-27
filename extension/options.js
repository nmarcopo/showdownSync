let clearBackupsText = document.getElementById("clearBackupsText");
let clearAllBackupsButton = document.getElementById("clearAllBackupsButton");
let forceUpdateCheckButton = document.getElementById("forceUpdateCheckButton");
let forceUpdateCheckText = document.getElementById("forceUpdateCheckText");

function clearAllBackups() {
    chrome.storage.sync.clear(function () {
        clearBackupsText.innerText = "Backups have been cleared.";
        clearAllBackupsButton.classList.add("disabled")
    });
}

function getNumBackups() {
    chrome.storage.sync.get(null, function (syncedTeams) {
        let numTeams = Object.keys(syncedTeams).length;
        if (numTeams === 0) {
            return;
        }
        clearBackupsText.innerText = "You have " + numTeams + " teams backed up.";
        clearAllBackupsButton.classList.remove("disabled");
    });
}

function forceUpdateCheck() {
    // Check to make sure that the button isn't disabled
    if (this.classList.contains("disabled")) {
        return;
    }
    console.log("Forced check for updates...");
    chrome.runtime.requestUpdateCheck(function (status) {
        console.log("Update status: " + status);
        if (status == "update_available") {
            forceUpdateCheckText.innerText = "Update is available to version " + status.version + ". Please reload the extension!";
        } else if (status == "no_update") {
            forceUpdateCheckText.innerText = "No update found.";
        } else if (status == "throttled") {
            forceUpdateCheckText.innerText = "Too many checks for updates - please wait for a few minutes and try again."
        } else {
            forceUpdateCheckText.innerText = "Some other response came from the server, check the logs!";
            console.error(status);
        }
    });

    this.classList.add("disabled");
    this.classList.remove("btn-primary");
    this.classList.add("btn-secondary");
}

getNumBackups();
clearAllBackupsButton.addEventListener("click", function () {
    // Check to make sure that the button isn't disabled
    if (this.classList.contains("disabled")) {
        return;
    }
    clearAllBackups();
}, false);

forceUpdateCheckText.innerText = "Current version: " + chrome.runtime.getManifest().version;
forceUpdateCheckButton.addEventListener("click", forceUpdateCheck, false);