import React from "react";

import { H4, UL } from "@blueprintjs/core";
import { Team } from "./Team";
import { popupStore } from "../mobx/popupState";

export enum TeamListType {
    LOCAL = "Available Teams",
    CLOUD = "Restore Teams"
};

export interface TeamListProps {
    team_list_type: TeamListType;
}

export class TeamList extends React.Component<TeamListProps> {
    render() {
        let teamsDisplay;
        let teams_from_popup_store;
        
        if (this.props.team_list_type as TeamListType === TeamListType.LOCAL) {
            teams_from_popup_store = popupStore.localTeams;
        } else if (this.props.team_list_type as TeamListType === TeamListType.CLOUD) {
            teams_from_popup_store = popupStore.cloudTeams;
        } else {
            throw new Error(`Unknown team list type: ${this.props.team_list_type.toString()}`);
        }

        if (Object.values(teams_from_popup_store).length === 0) {
            console.log("State is undefined");
            teamsDisplay = <H4>No teams data!</H4>
        } else {
            teamsDisplay = Object.values(teams_from_popup_store).map(team =>
                <Team team={team} team_list_type={TeamListType.LOCAL} />
            );
        }
        console.log("teamsDisplay", teamsDisplay)

    return(
            <div className = "docs-example" >
            <UL className="bp4-list-unstyled">
                {teamsDisplay}
            </UL>
            </div>
        );
    }
}
