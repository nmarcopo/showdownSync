/*
FIXME: this is a quick and dirty solution. Duplicate code is not good!
I can't figure out how to share this function with the chrome tab via injection,
So this will need to live in getAvailableTeams.js and restoreTeams.js
From https://stackoverflow.com/a/60873268/10665534
*/
function returnValues(query, needReturn) {
    var objNativeGetter = {

        divsToTidyup: [],
        DIVID: 'someUniqueDivId',
        _tidyUp: function () {
            console.log(['going to tidy up ', this.divsToTidyup]);
            var el;
            while (el = this.divsToTidyup.shift()) {
                console.log('removing element with ID : ' + el.getAttribute('id'));
                el.parentNode.removeChild(el);
            }
        },

        // create a div to hold the serialised version of what we want to get at
        _createTheDiv: function () {
            var div = document.createElement('div');
            div.setAttribute('id', this.DIVID);
            div.innerText = '';
            document.body.appendChild(div);
            this.divsToTidyup.push(div);
        },

        _getTheValue: function () {
            return JSON.parse(document.getElementById(this.DIVID).innerText);
        },

        // find the page variable from the stringified version of what you would normally use to look in the symbol table
        // eg. pbjs.adUnits would be sent as the string: 'pbjs.adUnits'
        _findTheVar: function (strIdentifier) {
            var script = document.createElement('script');
            script.setAttribute('id', 'scrUnique');
            script.textContent = "\nconsole.log(['going to stringify the data into a div...', JSON.stringify(" + strIdentifier + ")]);\ndocument.getElementById('" + this.DIVID + "').innerText = JSON.stringify(" + strIdentifier + ");\n";
            (document.head || document.documentElement).appendChild(script);
            this.divsToTidyup.push(script);
        },

        // this is the only call you need to make eg.:
        // var val = objNativeGetter.find('someObject.someValue');
        // sendResponse({theValueYouWant: val});
        find: function (strIdentifier) {
            this._createTheDiv();
            this._findTheVar(strIdentifier);
            if (needReturn) {
                var ret = this._getTheValue();
            }
            this._tidyUp();
            if (needReturn) {
                return ret;
            }else{
                return;
            }
        }
    };

    // do some validation, then carefully call objNativeGetter.find(...) with a known string (don't use any user generated or dynamic string - keep tight control over this)
    return JSON.stringify(objNativeGetter.find(query));
};

function getIcons() {
    let teamDiv = document.getElementById('teamData');
    teamDiv.setAttribute('style', 'display: none;');
    let packedTeamData = teamDiv.innerText;
    console.log(packedTeamData);
    // icon data
    let packedTeams = returnValues("window.Storage.packedTeamIcons(\""+ packedTeamData +"\")", true);
    teamDiv.parentNode.removeChild(teamDiv);
    return packedTeams;
}

getIcons();