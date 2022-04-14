import React from "react";

import { Home } from "../components/Home"
import { HeaderBar } from "../components/HeaderBar"

export class App extends React.Component {
    render() {
        return (
            <div style={{ minWidth: '25em' }} className="extension-root bp4-dark">
                <HeaderBar />
                <Home />
            </div>
        );
    };
}