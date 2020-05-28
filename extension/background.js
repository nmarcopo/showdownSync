chrome.runtime.onInstalled.addListener(function () {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [new chrome.declarativeContent.PageStateMatcher({
                pageUrl: {
                    hostEquals: 'play.pokemonshowdown.com'
                },
            })],
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
});

// When an update is forced
chrome.runtime.onUpdateAvailable.addListener(function (details) {
    console.log("Updating Showdown Team Backup to version " + details.version);
    chrome.runtime.reload();
});

// Send user's signed-in email to popup.js
let userEmail = "";
chrome.identity.getProfileUserInfo(function (info) {
    userEmail = info.email;
    console.log("Signed in as: " + userEmail);
});

chrome.runtime.onMessage.addListener(
    function(request, _sender, sendResponse) {
        console.log(request);
        if(request.msg == "openedExtension"){
            //TODO: try to use sendResponse. not working currently
            /*sendResponse({
                msg: "email",
                data: {
                    content: userEmail
                }
            });*/
            chrome.runtime.sendMessage({
                msg: "email",
                content: userEmail
            });
        }
    }
);