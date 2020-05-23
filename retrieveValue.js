function returnValues() {
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
            var ret = this._getTheValue();
            this._tidyUp();
            return ret;
        }
    };

    // do some validation, then carefully call objNativeGetter.find(...) with a known string (don't use any user generated or dynamic string - keep tight control over this)
    return JSON.stringify(objNativeGetter.find('window.Storage.teams'));
};
returnValues();