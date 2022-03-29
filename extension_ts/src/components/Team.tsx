import React from "react";

import { Card, H4, H6 } from "@blueprintjs/core";

enum Status {
    NOT_BACKED_UP,
    BACKED_UP_AND_AVAILABLE,
    BACKED_UP_AND_NOT_AVAILABLE,
}

export interface TeamProps {
    team_format: string;
    team_name: string;
}

interface TeamState {
    team_composition: string;
    team_status: Status;
}

export class Team extends React.Component<TeamProps> {
    render() {
        return (
            <div>
                <Card>
                    <H4>Team: {this.props.team_name}</H4>
                    <H6>Format: {this.props.team_format}</H6>
                </Card>
            </div>
        );
    }
}
