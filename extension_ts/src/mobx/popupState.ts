import { observable } from 'mobx'
import { ShowdownTeamJson, getShowdownTeamJsonKey } from '../components/Team'

class StorageState {
    @observable localTeams: { [key: string]: ShowdownTeamJson } = {};
    @observable cloudTeams: { [key: string]: ShowdownTeamJson } = {};

    constructor() {
        this.loadLocalTeams();
        this.loadLocalTeams();
    }

    async loadLocalTeams() {
        chrome.scripting.executeScript({
            func: () => (window.Storage as any).teams,
            target: {
                tabId:
                    (await chrome.tabs.query({ active: true, currentWindow: true }))[0].id!
            },
            world: 'MAIN',
        }).then((results) => {
            console.log("teams response:", results);
            // results is an array of InjectionResult objects
            let teams_array = results[0].result as ShowdownTeamJson[];
            // Parse through results and put in the the localTeams object
            teams_array.map((team) => {
                this.localTeams[getShowdownTeamJsonKey(team)] = team;
            });
        }).catch((error) => {
            console.error("Error getting teams:", error);
        });
    }

    async loadCloudTeams() {
    }
}

export const popupStore = new StorageState();