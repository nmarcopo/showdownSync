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

// interface TeamListState {
//     team_composition: string;
//     team_status: Status;
// }

export class TeamList extends React.Component<TeamListProps> {
    render() {
        return (
            <div className="docs-example">
                {/* <H6>{this.props.team_list_type}</H6> */}
                <Team team_name={this.props.team_list_type + " test team"} team_format="gen8" />
                <Team team_name={this.props.team_list_type + " test team2"} team_format="gen8" />
            </div>
        );
    }
}
