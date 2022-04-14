import React from "react";
import { Navbar, Alignment, Collapse, Button, Icon, Tooltip, Position } from "@blueprintjs/core";
// import { Classes, Tooltip2 } from "@blueprintjs/popover2";

export interface HeaderBarCollapseState {
    isOpen?: boolean;
};

export class HeaderBar extends React.Component<{}, HeaderBarCollapseState> {
    public state = {
        isOpen: false,
    }

    render() {
        return (
            <div>
                <Navbar>
                    <Navbar.Group align={Alignment.LEFT}>
                        <Navbar.Heading>Showdown Team Sync</Navbar.Heading>
                    </Navbar.Group>
                    <Navbar.Group align={Alignment.RIGHT}>
                        <Tooltip
                            content={`${this.state.isOpen ? "Hide" : "Show"} Detailed Sync Info`}
                            position={Position.LEFT}
                            openOnTargetFocus={false}
                            hoverOpenDelay={300}
                        >
                            <Button onClick={this.expand_button_click}>
                                <Icon icon="dashboard" />
                            </Button>
                        </Tooltip>
                    </Navbar.Group>
                </Navbar>
                <Collapse isOpen={this.state.isOpen}>
                    TODO: Sync information goes here
                </Collapse>
            </div>
        );
    };

    private expand_button_click = () => {
        this.setState({ isOpen: !this.state.isOpen });
    }
}