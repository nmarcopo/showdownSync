import React from "react";

import { Card, H4, H6 } from "@blueprintjs/core";
import { Team } from "./Team";

export enum TeamListType {
    AVAILABLE_TEAMS = "Available Teams",
    RESTORE_TEAMS = "Restore Teams"
};

export interface TeamListProps {
    team_list_type: TeamListType;
}

interface ShowdownTeamJson {
    capacity: number,
    folder: string,
    format: string,
    iconCache: string,
    name: string,
    team: string,
}

interface TeamListState {
    teams_data: ShowdownTeamJson[] | undefined;
    // team_status: Status;
}

export class TeamList extends React.Component<TeamListProps, TeamListState> {
    public state: TeamListState = {
        teams_data: undefined,
    };


    componentDidMount() {
        this.getTeams().then((response) => {
            console.log("response", response);
            this.setState({
                teams_data: response
            });
            console.log("state", this.state.teams_data);
        })
    }

    async getTeams() {
        const [{ result }] = await chrome.scripting.executeScript({
            func: () => (window.Storage as any).teams,
            target: {
                tabId:
                    (await chrome.tabs.query({ active: true, currentWindow: true }))[0].id!
            },
            world: 'MAIN',
        });
        return result;
    }

    render() {
        let teamsDisplay;
        if (this.state.teams_data !== undefined) {
            console.log("state is defined!");
            teamsDisplay = this.state.teams_data.map(team =>
                <Team team_format={team.format} team_name={team.name} />
            );
            console.log("teamsDisplay", teamsDisplay)
        } else {
            console.log("State is undefined");
            teamsDisplay = <H4>There's no teams data!</H4>
        }

        return (
            <div className="docs-example">
                <ul>
                    {teamsDisplay}
                </ul>
            </div>
        );
    }
}
