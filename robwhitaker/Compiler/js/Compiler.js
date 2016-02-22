CorduleJS.addModule('Compiler', (function() {
    var errors = [];
    var warnings = [];
    var verbose = true;

    var putStr = function(outData) {
        if(outData.verbose && !verbose)
            return;

        CorduleJS.pushRequest('pushBuffer', {
            message: "<div style='color:" + (outData.color ? outData.color:"black") + "'>"+outData.message+"</div>",
            DOM_ID: outData.DOM_ID ? outData.DOM_ID:'output'
        });
    }

    var logIssue = function(errData) {
        switch(errData.type) {
            case "error":
                errors.push({line: errData.line, message: errData.message});
                putStr({color: "#cc1111",message: errData.message + " Line " + errData.line});
                break;
            case "warning":
                warnings.push({line: errData.line, message: errData.message});
                putStr({color: "orange",message: errData.message + " Line " + errData.line});
                break;
            default:
                return;
        }
    }

    var reset = function() {
        document.getElementById('output').innerHTML = "";
        document.getElementById('CST').innerHTML = "";
        errors = [];
        warnings = [];
    }

    var compile = function(code) {

        CorduleJS.pushRequest('reset');

        var tokenList = CorduleJS.pushRequest('lex',code);
        var cst;
        if(tokenList && errors.length < 1)
            cst = CorduleJS.pushRequest('parse',tokenList[0]);

        if(cst && cst[0])
            cst[0].output();

        putStr({message: "<h3>Tokens</h3>"});
        tokenList[0].forEach(function(elem) {
            putStr({message: elem.line + "&nbsp;&nbsp;&nbsp;&nbsp;" + elem.kind + "&nbsp;&nbsp;&nbsp;&nbsp;'" + elem.value +"'"});
        });

        if(cst && cst[0])
            CorduleJS.pushRequest('symanticAnalysis', cst[0]);

        CorduleJS.pushRequest('flushBuffer');
    }

    var setVerbose = function(v) {
        verbose = v.checked;
    }

    return {
        init : function() {
            var self = this;
            CorduleJS.observe(self, 'putStr', putStr);
            CorduleJS.observe(self, 'logIssue', logIssue);
            CorduleJS.observe(self, 'reset', reset);
            CorduleJS.observe(self, 'compile', compile);
            CorduleJS.observe(self, 'verbose', setVerbose);
        },
        destroy: function(){}
    }
})());