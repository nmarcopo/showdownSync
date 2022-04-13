import React from "react";
import { Card, Navbar, Alignment } from "@blueprintjs/core";

import { Title } from "./Title"
import { Team } from "./Team"
import { TeamListContainer } from "./TeamListContainer";

export class Home extends React.Component {
    render() {
        return (
            <div>
                <TeamListContainer >

                </TeamListContainer>
                <Team team_name="My New Team" team_format="gen8" />
            </div>
        );
    };
}