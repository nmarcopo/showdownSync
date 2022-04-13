import React from "react";

import { Home } from "../components/Home"
import { HeaderBar } from "../components/HeaderBar"

export class App extends React.Component {
    render() {
        return (
            <div style={{ width: '50em' }} className="extension-root bp4-dark">
                <HeaderBar />
                <Home />
            </div>
        );
    };
}