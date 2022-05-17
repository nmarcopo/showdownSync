import React from "react";

import { Tab, Tabs, TabId, Alignment } from "@blueprintjs/core";
import { TeamListType, TeamList } from "./TeamList";

export interface TeamListContainerProps {
    // team_list_name: TeamListType;
}

interface TeamListContainerState {
    activePanelOnly: boolean;
    animate: boolean;
    navbarTabId: TabId;
    vertical: boolean;
}

export class TeamListContainer extends React.Component<TeamListContainerProps, TeamListContainerState> {
    public state: TeamListContainerState = {
        activePanelOnly: false,
        animate: true,
        navbarTabId: Object.values(TeamListType)[0],
        vertical: false,
    };

    tabs = function () {
        let tabNames = []
        for (let value of Object.values(TeamListType)) {
            tabNames.push(<Tab key={value} id={value} title={value} panel={<TeamList team_list_type={value as TeamListType} />} />)
        }
        return tabNames
    }

    render() {
        return (
            <Tabs
                animate={this.state.animate}
                id="team_list_container"
                onChange={this.handleNavbarTabChange}
                selectedTabId={this.state.navbarTabId}
            >

                {this.tabs()}

            </Tabs>
        );
    }

    private handleNavbarTabChange = (navbarTabId: TabId) => this.setState({ navbarTabId });
}
