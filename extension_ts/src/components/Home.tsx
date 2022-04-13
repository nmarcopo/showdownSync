import React from "react";
import { Card, Navbar, Alignment } from "@blueprintjs/core";

import { Title } from "./Title"
import { Team } from "./Team"
import { TeamListContainer } from "./TeamListContainer";

export class Home extends React.Component {
    render() {
        return (
            <div>
                <TeamListContainer />
            </div>
        );
    };
}