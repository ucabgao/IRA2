CorduleJS.addModule('Lexer', (function() {
    var tokens = [];

    function createToken(kind, value, line) {
        tokens.push({
            "kind": kind,
            "value": value,
            "line": line,
            "is": function(tokenKind,tokenValue) {
                return (tokenKind === this.kind && (tokenValue ? (tokenValue===this.value):true) );
            }
        });
    }

    function error(line,msg) {
        CorduleJS.pushRequest('logIssue', {type: 'error', message: msg, line: line});
    }
    
    function warning(line,msg) {
        CorduleJS.pushRequest('logIssue', {type: 'warning', message: msg, line: line});
    }



    function buildTokenList(sourceCode) {
        sourceCode = sourceCode.trim(); //remove leading and trailing whitespace
        var currentLine = 1;            //set the current line
        var inString = false;           //are we looking at characters in a string? 
        var tokenized = false;          //has the current character been tokenized yet?
        
        //create a simple text buffer
        var buffer = (function() {    
            var buffer = "";
            return {
                "push": function(ch) {buffer+=ch;},
                "clear": function() {buffer="";},
                "get": function() {return buffer;},
                "flush": function() {var txt=buffer; buffer=""; return txt;}
            }
        })();

        //loop through each char in sourceCode
        for(var i=0; i<sourceCode.length; i++) {

            //if we've hit a white space, the buffer may contain a token
            if(sourceCode[i].match(/\s/)) {
                if(inString) { //if we are in a string, we want to preserve the whitespace and not make the wrong token
                    createToken(Tokens.T_SPACE,sourceCode[i],currentLine);
                    tokenized = true;
                } else { //if we are not in a string, we must check to see if we've hit a token
                    if(!getToken(buffer.flush(), currentLine)) //if we failed to create a valid token, handle the error
                        error(currentLine, "Lex Error: Invalid token.");
                }
            } 

            //if we've hit a newline, the buffer may contain a token
            if(sourceCode[i].match(/\n|\r\n/)) {
                if(inString) { //newline in a string? not in this language!
                    error(currentLine, "Lex Error: Invalid character in string.");
                } else { //if we are not in a string, we must check to see if we've hit a token
                    if(!getToken(buffer.flush(), currentLine)) //if we failed to create a valid token, handle the error
                        error(currentLine, "Lex Error: Invalid token.");
                }
                currentLine++; //we hit a newline, so increment the current line                
            }

            //if we've hit a different token-ending character
            if(sourceCode[i].match(/\{|\}|\(|\)|\$|\+/)) {
                if(inString) //these are not valid in a string, so log an error
                    error(currentLine, "Lex Error: Invalid character in string.");
                else { //if we are not in a string, check to see if we've hit a token
                    if(!getToken(buffer.flush(), currentLine)) //if we failed to create a valid token, handle the error
                        error(currentLine, "Lex Error: Invalid token.");
                    
                    getToken(sourceCode[i],currentLine); //add this token to the token list
                    tokenized = true; //note that the current token has been tokenized
                }
            }

            if(sourceCode[i].match(/\$/) && i<sourceCode.length-1) {
                warning(currentLine, "Warning: Code found after terminating token ($). Ignoring.");
                return;
            }


            //if we find quotes, we must handle whether or not they begin or end a string and toggle inString
            if(sourceCode[i].match(/"/)) {
                if(!inString) { //if we are not in a string, see if we can create a token from buffer contents
                    if(!getToken(buffer.flush(),currentLine)) //if we failed to create a valid token, handle the error
                        error(currentLine, "Lex Error: Invalid token.");
                }

                inString = !inString; //invert inString
             
                getToken(sourceCode[i],currentLine); //add this token to the token list
                tokenized = true; //note that the current token has been tokenized
            }

            //to handle =, ==, and !=, we'll need to use lookahead (1)
            if(sourceCode[i].match(/\!|\=/)) {
                if(inString) //if we are in a string, log an error
                    error(currentLine, "Lex Error: Invalid character in string.");
                else { //we are not in a string so proceed normally 
                    //since ! can only mean != or an error, and = can only mean == or =, we empty the buffer before proceeding
                    if(!getToken(buffer.flush(),currentLine)) //if we failed to create a valid token, handle the error
                        error(currentLine, "Lex Error: Invalid token.");

                    if(sourceCode[i+1] === '=') { //look ahead by 1. do we have != or ==?
                        getToken(sourceCode[i]+'=',currentLine) //if so, create a token for it
                        i++; //skip the next character as we've already dealt with it
                        tokenized = true;
                    } else if(sourceCode[i] === '!') { //error! lone (!)
                        error(currentLine, "Lex Error: Invalid token.");
                    } else { //otherwise it must be '=' which is valid
                        getToken(sourceCode[i],currentLine); //tokenize it!
                        tokenized = true;
                    }
                }
            }

            //if this is the last char in the code and it's not the EOF character, deal with it
            if(!inString && i==sourceCode.length-1 && sourceCode[i] != '$') {
                if(!tokenized) { //if this has not yet been tokenized, add it to the buffer and flush. we are at EOF.
                    buffer.push(sourceCode[i]); //push this last char to the buffer
                    if(!getToken(buffer.flush(), currentLine)) //try to create a token from the buffer
                            error(currentLine, "Lex Error: Invalid token.");
                }
                getToken('$', currentLine); //add EOF token for the user
                warning(currentLine, "Warning: EOF character not found.")
            }

            //if this character is in a string and hasn't yet been handled and is an alpha char
            if(inString && !tokenized && sourceCode[i].match(/[a-zA-Z]/)) {
                createToken(Tokens.T_CHAR, sourceCode[i], currentLine); //create a character token
                tokenized = true; //current token has been tokenized
            }

            //having checked all cases where a token must be processed from the buffer, we can safely add whatever
            //character this is to the current buffer if it hasn't already been tokenized
            if(!tokenized)
                buffer.push(sourceCode[i]);

            tokenized = false; //reset tokenized
        }
    }

    function getToken(str, lineNum) { 
        str = str.trim(); //to handle excess spaces and newlines
        if(str.length === 0) //in the case of being passed an empty buffer, don't throw an error
            return true;

        switch(str) {
            case '{':
            case '}':
                createToken(Tokens.T_BRACE,str,lineNum);
                return true;
            case '(':
            case ')':
                createToken(Tokens.T_PAREN,str,lineNum);
                return true;
            case '=':
                createToken(Tokens.T_ASSIGN,str,lineNum);
                return true;
            case '==':
            case '!=':
                createToken(Tokens.T_BOOLOP,str,lineNum);
                return true;
            case '$':
                createToken(Tokens.T_EOF,str,lineNum);
                return true;
            case '+':
                createToken(Tokens.T_OPERATOR,str,lineNum);
                return true;
            case '"':
                createToken(Tokens.T_QUOTE,str,lineNum);
                return true;
            case 'false':
            case 'true':
                createToken(Tokens.T_BOOLEAN,str,lineNum);
                return true;
            case 'print':
            case 'while':
            case 'if':
                createToken(Tokens.T_KEYWORD,str,lineNum);
                return true;
            case 'int':
            case 'string':
            case 'boolean':
                createToken(Tokens.T_TYPE,str,lineNum);
                return true;
            default:
                break;

        }

        //if a single character (a-Z) has been sent in
        if(str.length === 1 && str.match(/[a-zA-Z]/)) {
            createToken(Tokens.T_ID,str,lineNum); //we've found an identifier (string chars handled elsewhere)
            return true;
        }

        //if a single digit has been sent in
        if(str.length === 1 && str.match(/[0-9]/)) {
            createToken(Tokens.T_DIGIT,str,lineNum);
            return true;
        }

        return false; //This token doesn't match anything. Nailed it.
    }

    return {
        init : function() {
            var self = this;
            CorduleJS.observe(self, 'lex', function(sourceCode) {
                buildTokenList(sourceCode);
                return tokens;
            });
            CorduleJS.observe(self, 'reset', function() {tokens = [];});
        },
        destroy : function() {}
    }
})());