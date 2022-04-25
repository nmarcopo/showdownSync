export async function getCurrentTab() {
    let queryOptions = { active: true, currentWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;  
}

chrome.runtime.onMessage.addListener(function sender(request, sender, sendResponse) {
    switch (request.type) {
        case "getLocalStorage": {
            console.log(localStorage)
            sendResponse({
                data: "this is a response!"
            });
            // sendResponse({
                // storage = 
        }
        default: {
            console.log("Unknown message type: " + request.type);
            console.log(request);
            console.log(chrome.storage.local.get("teams"));
        }
    }
});