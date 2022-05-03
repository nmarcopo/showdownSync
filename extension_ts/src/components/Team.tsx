import React from "react";

import { Button, ButtonGroup, Card, Tag, UL } from "@blueprintjs/core";

enum Status {
    NOT_BACKED_UP,
    BACKED_UP_AND_AVAILABLE,
    BACKED_UP_AND_NOT_AVAILABLE,
    CURRENTLY_BEING_EDITED,
}

export interface TeamProps {
    team: ShowdownTeamJson;
}

interface TeamState {
    team_status: Status;
    interactive: boolean;
    iconCache: string;
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
        team_status: Status.NOT_BACKED_UP,
        interactive: true,
        iconCache: "Loading...",
        // Iconcache should probably be it's own state here so the component can get updated when iconcache is loaded
    }

    componentDidMount() {
        this.getIcons(this.props.team).then((response) => {
            this.setState({
                iconCache: response
            });
        });
    }

    async getIcons(team: ShowdownTeamJson) {
        console.log("team", JSON.stringify(team));
        // IconCache can be an exclamation point
        // Return iconcache if it's already defined in props
        if (this.props.team.iconCache.length > 1) {
            console.log("iconcache is defined in props", this.props.team.iconCache);
            return this.props.team.iconCache;
        }
        if (this.props.team.iconCache === "!") {
            console.warn("Team is being edited")
            this.setState({
                team_status: Status.CURRENTLY_BEING_EDITED,
            });
        }
        const [{ result }] = await chrome.scripting.executeScript({
            func: (team) => (window.Storage as any).getTeamIcons(team),
            args: [team],
            target: {
                tabId:
                    (await chrome.tabs.query({ active: true, currentWindow: true }))[0].id!
            },
            world: 'MAIN',
        });
        console.log("iconcache lookup:", result);
        return result;
    }

    render() {
        return (
            <li>
                <Card interactive={this.state.interactive} className="team-card" >
                    <UL className="bp4-list-unstyled">
                        <li>
                            <small>
                                <Tag className="team-format-tag">{this.props.team.format}</Tag>
                                {this.props.team.name}
                            </small>
                        </li>
                        {/* DangerouslySetInnerHTML is OK here since we know that this will be sent via iconCache, so no risk of XSS */}
                        <li>
                            <div className="team-icons" dangerouslySetInnerHTML={{ __html: this.state.iconCache }} />
                        </li>
                        <li>
                            <ButtonGroup>
                                <Button>Backup</Button>
                            </ButtonGroup>
                        </li>
                    </UL>
                </Card>
            </li>
        );
    }
}
