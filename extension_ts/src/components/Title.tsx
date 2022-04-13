import React from "react";
import { H3, Card } from "@blueprintjs/core";

export class Title extends React.Component {
    render() {
        return (
            <Card className="title-card">
                <H3>Showdown Team Sync</H3>
            </Card>
        );
    };
}