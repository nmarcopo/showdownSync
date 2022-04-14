import React from "react";

import { Button, ButtonGroup, Card, H4, H6, Tag } from "@blueprintjs/core";

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
    interactive: boolean;
}

export class Team extends React.Component<TeamProps, TeamState> {
    public state: TeamState = {
        team_composition: "bulba, charmander",
        team_status: Status.NOT_BACKED_UP,
        interactive: true,
    }

    render() {
        return (
            <Card interactive={this.state.interactive} className="team-card" >
                {/* <H4>Team: {this.props.team_name}</H4> */}
                <small>
                    <Tag className="team-format-tag">{this.props.team_format}</Tag>
                    {this.props.team_name}
                </small>
                <ButtonGroup>
                    <Button>Backup</Button>
                </ButtonGroup>
            </Card>
        );
    }
}
