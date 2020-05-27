let clearBackupsText = document.getElementById("clearBackupsText");
let clearAllBackupsButton = document.getElementById("clearAllBackupsButton");
let forceUpdateCheckButton = document.getElementById("forceUpdateCheckButton");
let forceUpdateCheckText = document.getElementById("forceUpdateCheckText");

/*
FIXME: this function needs to be duplicated in both popup.js and options.js
because I can't share the function via an import. When I try to make popup.js
a module, the extension doesn't work correctly. Need to look into why this is
*/
function checkError(errorMessage){
    console.error(errorMessage);
    if(errorMessage.includes("QUOTA_BYTES_PER_ITEM")){
        alert("Error, the team is too large to store. Try storing a smaller team.");
    }else if(errorMessage.includes("QUOTA_BYTES")){
        alert("Error, you've used up all of your storage space. Delete some teams from the restore tab and try again.");
    }else if(errorMessage.includes("MAX_ITEMS")){
        alert("Error, you've stored more than 512 teams. Delete some if you want to store more!");
    }else if(errorMessage.includes("MAX_WRITE_OPERATIONS_PER_HOUR")){
        alert("Error, you've backed up or removed too many teams this hour. Please wait an hour and try again.");
    }else if(errorMessage.includes("MAX_WRITE_OPERATIONS_PER_MINUTE")){
        alert("Error, you've backed up or removed too many teams this minute. Please wait a minute and try again.");
    }else{
        alert("Check the logs - there's been some other error with your request.");
    }
}

function clearAllBackups() {
    chrome.storage.sync.clear(function () {
        // Check to see if there were any errors
        if (chrome.runtime.lastError) {
            let errorMessage = chrome.runtime.lastError;
            checkError(errorMessage);
            return;
        }
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