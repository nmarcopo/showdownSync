import React from "react";

import { Card, H4, H6 } from "@blueprintjs/core";
import { Team } from "./Team";

import { getCurrentTab } from "../background";
// import { returnValues } from "../scripts/injection";

export enum TeamListType {
    AVAILABLE_TEAMS = "Available Teams",
    RESTORE_TEAMS = "Restore Teams"
};

export interface TeamListProps {
    team_list_type: TeamListType;
}

// interface TeamListState {
//     team_composition: string;
//     team_status: Status;
// }

export class TeamList extends React.Component<TeamListProps> {
    componentDidMount() {
        this.getTeams();
    }

    injectionScript() {
        console.log("injection script");
        // console.log(window.localStorage);
        // chrome.runtime.sendMessage({
        //     type: "getLocalStorage",
        // });
        console.log("window.localStorage: ", window.localStorage);
        return window.localStorage;
    }

    getTeams() {
        return getCurrentTab().then((tab) => {
            if (tab.id) {
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: () => localStorage.getItem("showdown_teams"),
                    // func: () => (window as any).room.update(),
                    // For the restore script: https://stackoverflow.com/a/30740935
                }, (results) => {
                    // results = results[0];
                    console.log("results: ", results.at(0)?.result);
                    return results.at(0)?.result;
                });
            } else {
                console.error("Error: No tab id. Tab: ", tab)
                return ""
            }
        }).catch((err) => {
            console.error(err)
            return ""
        });
    }

    _getTeamsHelper(teams: string) {

    }

    Teams = async (props: TeamListProps) => {
        switch (props.team_list_type) {
            case (TeamListType.AVAILABLE_TEAMS): {
                let teams: string | undefined = await this.getTeams();
                if (teams !== undefined) {
                    return this._getTeamsHelper(teams);
                }
            }
            case (TeamListType.RESTORE_TEAMS): {

            }
            default: {
                console.error("Error: team list type is:", props.team_list_type)
            }
        }
    }

    render() {
        return (
            <div className="docs-example">
                {/* {this.getTeams()} */}
                {/* <H6>{this.props.team_list_type}</H6> */}

                <Team team_name={this.props.team_list_type + " test team"} team_format="gen8"
                />
                <Team team_name={this.props.team_list_type + " test team2"} team_format="gen8" />
            </div>
        );
    }
}
