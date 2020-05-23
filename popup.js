var teams;

chrome.tabs.executeScript(null, {file: "retrieveValue.js"}, function(ret) {
    console.log(ret)
    teams = JSON.parse(ret)
    teamList = document.getElementById("teamsGoHere")
    for (team of teams) {
        let item = document.createElement("li")
        let icons = document.createElement("small")
        item.classList.add("list-group-item")
        item.innerHTML = team.iconCache
        teamList.appendChild(item)
    }
});
