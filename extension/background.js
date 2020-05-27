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