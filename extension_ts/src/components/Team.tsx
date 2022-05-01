import React from "react";

import { Button, ButtonGroup, Card, H4, H6, Tag } from "@blueprintjs/core";

enum Status {
    NOT_BACKED_UP,
    BACKED_UP_AND_AVAILABLE,
    BACKED_UP_AND_NOT_AVAILABLE,
}

export interface TeamProps {
    team: ShowdownTeamJson;
}

interface TeamState {
    team_composition: string;
    team_status: Status;
    interactive: boolean;
}

export interface ShowdownTeamJson {
    capacity: number,
    folder: string,
    format: string,
    iconCache: string,
    name: string,
    team: string,
}

export class Team extends React.Component<TeamProps, TeamState> {
    public state: TeamState = {
        team_composition: "bulba, charmander",
        team_status: Status.NOT_BACKED_UP,
        interactive: true,
        // Iconcache should probably be it's own state here so the component can get updated when iconcache is loaded
    }

    async getIcons(team: ShowdownTeamJson) {
        const [{ result }] = await chrome.scripting.executeScript({
            func: () => (window.Storage as any).getTeamIcons(team),
            target: {
                tabId:
                    (await chrome.tabs.query({ active: true, currentWindow: true }))[0].id!
            },
            world: 'MAIN',
        });
        return result;
    }

    render() {
        return (
            <li>
                <Card interactive={this.state.interactive} className="team-card" >
                    {/* <H4>Team: {this.props.team_name}</H4> */}
                    <small>
                        <Tag className="team-format-tag">{this.props.team.format}</Tag>
                        {this.props.team.name}
                    </small>
                    <span dangerouslySetInnerHTML={{ __html: this.props.team.iconCache }} />
                    <ButtonGroup>
                        <Button>Backup</Button>
                    </ButtonGroup>
                </Card>
            </li>
        );
    }
}
