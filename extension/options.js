let clearBackupsText = document.getElementById("clearBackupsText");
let clearAllBackupsButton = document.getElementById("clearAllBackupsButton");

function clearAllBackups(){
    chrome.storage.sync.clear(function(){
        clearBackupsText.innerText = "Backups have been cleared.";
        clearAllBackupsButton.classList.add("disabled")
    });
}

function getNumBackups(){
    chrome.storage.sync.get(null, function (syncedTeams) {
        let numTeams = Object.keys(syncedTeams).length;
        if(numTeams === 0){
            return;
        }
        clearBackupsText.innerText = "You have " + numTeams + " teams backed up.";
        clearAllBackupsButton.classList.remove("disabled");
    });
}

getNumBackups();
clearAllBackupsButton.addEventListener("click", function(){
    // Check to make sure that the button isn't disabled
    if(this.classList.contains("disabled")){
        return;
    }
    clearAllBackups();
}, false);