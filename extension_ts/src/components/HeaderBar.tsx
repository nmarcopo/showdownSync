import React from "react";
import { Navbar, Alignment, Collapse, Button } from "@blueprintjs/core";

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
                        <Button onClick={this.expand_button_click}>
                            {this.state.isOpen ? "Hide" : "Show"} sync information
                        </Button>
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