CorduleJS.addModule('OutputBuffer', (function() {
    var buffer = {};

    var pushBuffer = function(outData) {
        if(!outData.DOM_ID)
            return;

        if(buffer[outData.DOM_ID]) 
            buffer[outData.DOM_ID].push(outData.message);
        else
            buffer[outData.DOM_ID] = [outData.message];
    }

    var wipeBuffer = function() {
        buffer = {};
    }

    var flushBuffer = function() {
        var compiledStr = "";
        for(key in buffer) {
            if(document.getElementById(key)) {
                for(var i=0; i<buffer[key].length;i++)
                    compiledStr += buffer[key][i];
                document.getElementById(key).innerHTML += compiledStr;
            }
        }
    }

    return {
        init : function() {
            var self = this;
            CorduleJS.observe(self,'pushBuffer',pushBuffer);
            CorduleJS.observe(self,'flushBuffer',flushBuffer);
            CorduleJS.observe(self,'reset',wipeBuffer);
        },
        destroy : function() {}
    }
})());