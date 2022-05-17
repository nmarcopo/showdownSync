import { Button, ButtonGroup, Card, Tag, UL } from "@blueprintjs/core";
import React from "react";
import { popupStore } from "../mobx/popupState";
import { SyncHandlers } from "../scripts/SyncHandlers";
import { TeamListType } from "./TeamList";


// TODO: We can derive these now from the mobx store
enum Status {
    NOT_BACKED_UP,
    BACKED_UP_AND_AVAILABLE,
    BACKED_UP_AND_OUTDATED,
    BACKED_UP_AND_NOT_AVAILABLE,
    CURRENTLY_BEING_EDITED,
}

export interface TeamProps {
    team: ShowdownTeamJson;
    team_list_type: TeamListType; // Which team list the team should be assigned to
}

interface TeamState {
    team_status: Status;
    interactive: boolean;
    iconCache: string;
    syncHandlers: SyncHandlers;
    disabled: boolean;
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
        syncHandlers: new SyncHandlers(),
        disabled: false,
    };

    componentDidMount() {
        this.getIcons(this.props.team).then((response) => {
            this.setState({
                iconCache: response
            });
        });

        this.get_team_status();
    }

    get_team_status() {
        // Determine the state of the team. May be inefficient to do this at every render
        // Need to move this out of here
        let teams_from_other_popup_store;
        if (this.props.team_list_type === TeamListType.LOCAL) {
            teams_from_other_popup_store = popupStore.cloudTeams;
        } else if (this.props.team_list_type === TeamListType.CLOUD) {
            teams_from_other_popup_store = popupStore.localTeams;
        } else {
            throw new Error(`Unexpected team list type: ${this.props.team_list_type}`);
        }

        if (this.state.team_status === Status.CURRENTLY_BEING_EDITED) {
            console.warn("Team is being edited");
        } else {
            // Check if team exists in both local and cloud
            if (getShowdownTeamJsonKey(this.props.team) in teams_from_other_popup_store) {
                // if here, we know that the team name is at least in both local and cloud
                // IconCache could be a problem here. Just compare the contents of the team
                if (teams_from_other_popup_store[getShowdownTeamJsonKey(this.props.team)].team === this.props.team.team) {
                    this.setState({
                        team_status: Status.BACKED_UP_AND_AVAILABLE,
                    });
                } else {
                    this.setState({
                        team_status: Status.BACKED_UP_AND_OUTDATED,
                    });
                }
            } else {
                switch (this.props.team_list_type) {
                    case TeamListType.LOCAL:
                        this.setState({
                            team_status: Status.NOT_BACKED_UP,
                        });
                        break;
                    case TeamListType.CLOUD:
                        this.setState({
                            team_status: Status.BACKED_UP_AND_NOT_AVAILABLE,
                        });
                        break;
                    default:
                        throw new Error(`Unexpected team list type: ${this.props.team_list_type}`);
                }
            }
        }
    }

    async getIcons(team: ShowdownTeamJson) {
        console.log("team", team);
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

    async backup_callback() {
        this.state.syncHandlers.backup_team(this.props.team).then(() => {
            console.log("Team backed up, setting backed up state for: ", this.props.team)
            this.setState({
                team_status: Status.BACKED_UP_AND_AVAILABLE,
            });
        }).catch((err) => {
            console.error("Backup error: ", err);
        });
    }

    disable_backup_button_check() {
        switch (this.state.team_status) {
            case Status.CURRENTLY_BEING_EDITED:
            case Status.BACKED_UP_AND_AVAILABLE:
                return true;
            case Status.NOT_BACKED_UP:
                return false;
            case Status.BACKED_UP_AND_NOT_AVAILABLE:
                // need to hide and move to "restore"
                break;
            default:
                console.warn("Unexpected state:", this.state.team_status);
                return true;
        }
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
                                <Button onClick={() => this.backup_callback()} disabled={this.disable_backup_button_check()}>Backup</Button>
                            </ButtonGroup>
                        </li>
                    </UL>
                </Card>
            </li>
        );
    }
}

export function getShowdownTeamJsonKey(team: ShowdownTeamJson) {
    return team.format + team.name;
}