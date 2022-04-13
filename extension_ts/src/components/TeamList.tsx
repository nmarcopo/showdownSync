import React from "react";

import { Card, H4, H6 } from "@blueprintjs/core";

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
            <div>
                <Card title={this.props.team_list_type}>
                    Hello world! This is a {this.props.team_list_type}
                </Card>
            </div>
        );
    }
}
