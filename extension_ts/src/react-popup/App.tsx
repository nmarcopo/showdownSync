import React from "react";
import { Card } from "@blueprintjs/core";

import { Title } from "./Title"
import { Team } from "../components/Team"

export class App extends React.Component {
    render() {
        return (
            <div>
                <Title />
                <Team team_name="My New Team" team_format="gen8" />
            </div>
        );
    };
}