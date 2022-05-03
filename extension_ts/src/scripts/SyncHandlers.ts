import { ShowdownTeamJson } from "../components/Team";

interface ShowdownTeamSyncData {
    key: string;
    data: string;
}

export class SyncHandlers {
    create_sync_data(team: ShowdownTeamJson) {
        // remove the iconCache from the team to save space
        let team_object = JSON.parse(JSON.stringify(team));
        team_object.iconCache = "";

        let team_sync_data: ShowdownTeamSyncData = {
            key: team_object.format + team_object.name,
            data: JSON.stringify(team_object)
        };
        return team_sync_data;
    }

    backup_team = (team: ShowdownTeamJson) => {
        let team_sync_data = this.create_sync_data(team);
        chrome.storage.sync.set({
            [team_sync_data.key]: team_sync_data.data
        }, () => {
            // Check to see if there were any errors
            if (chrome.runtime.lastError) {
                let errorMessage = chrome.runtime.lastError.message;
                if (errorMessage !== undefined) {
                    this.check_error(errorMessage);
                }
            }
            console.log("Saved key " + team_sync_data.key + " with value " + team_sync_data.data);
        });
    }

    check_error(errorMessage: string) {
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
}