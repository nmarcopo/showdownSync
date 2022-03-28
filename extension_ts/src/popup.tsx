import React from "react";
import { render } from "react-dom";

import { FocusStyleManager } from "@blueprintjs/core";

import "normalize.css";
import "@blueprintjs/core/lib/css/blueprint.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";

import { App } from './react-popup/App'
import './css/app.css'

FocusStyleManager.onlyShowFocusOnTabs();

// render(<App />, document.getElementById("root"));

function ready(callbackFunc: () => void) {
    if (document.readyState !== 'loading') {
        callbackFunc()
    } else if (document.addEventListener) {
        document.addEventListener('DOMContentLoaded', callbackFunc)
    }
}

ready(() => {
    render(<App />, document.getElementById('root'))
})
