CorduleJS.addModule('Parser', (function(){
    var indexInTokenList = 0;
    var tokens = [];
    var depth = -1;
    var cst = null; //concrete syntax tree
    var currentNode = null; //current node of the tree

    function nextToken() {
        indexInTokenList++;
    }

    function lastToken() {
        indexInTokenList--;
    }

    function currentToken() {
        return tokens[indexInTokenList];
    }

    function error(expecting) {
        CorduleJS.pushRequest('logIssue', {
            type: 'error', 
            message: tabs(depth)+"Parse Error: Expecting "+expecting+"; Found "+currentToken().value, 
            line: currentToken().line
        });
    }

    function expect(expecting) {
        CorduleJS.pushRequest('putStr', {
            message: tabs(depth)+"Expecting token " + expecting,
            verbose: true,
        });
    }

    function found(item, isToken) {
        CorduleJS.pushRequest('putStr', {
            message: tabs(depth)+"Found " + (isToken ? "token ":"") + item,
            verbose: true,
        });
    } 

    function parsing(item) {
        CorduleJS.pushRequest('putStr', {
            message: tabs(depth)+"Parsing " + item,
            verbose: true,
        });
    }

    function tabs(n) {
        var str = "";
        for(var i=0; i<n; i++)
            str += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
        return str;
    }

    //returns a production function which can be run in order to parse the code
    //p_name - string
    //p_parts - [[production function | SingleToken function]]
    //p_lookahead - function (returns int x where 0 <= x < p_parts.length or -1 on failure)
    //p_terminator - {token: Tokens.T_XXXX, value: string}
    function Production(p_name, p_parts, p_lookAhead, p_terminator) {
        this.name = p_name;
        this.parts = p_parts;
        this.lookAhead = p_lookAhead;
        this.terminator = p_terminator;

        this.set = function(p_name, p_parts, p_lookAhead, p_terminator) {
            this.name = p_name;
            this.parts = p_parts;
            this.lookAhead = p_lookAhead;
            this.terminator = p_terminator;
        }
    } 

    var runProduction = function(prod) {
        var name = prod.name;
        var parts = prod.parts;
        var lookAhead = prod.lookAhead;
        var terminator = prod.terminator;

        var newNode = new TreeNode(name); //create child node, but don't use it yet
        if(!cst) {
            cst = newNode;
            currentNode = cst;
        }
        depth++;
        var ll = lookAhead ? lookAhead():0; //get lookAhead result if it exists
        var _parts; //subset of parts
        var success = true;
        
        //if a terminator has been defined, and we are at that terminator, return true
        if(terminator && (terminator.value ? currentToken().is(terminator.token, terminator.value):currentToken().is(terminator.token))) { 
            lastToken(); //step back one as we've overstepped the bounds of this Production
            depth--;
            return true;
        } else {
            //we have not reached a terminator so add this node
            if(currentNode != newNode) {
                currentNode.addChild(newNode);
                currentNode = newNode;
            }
        }

        parsing(name);

        //if lookAhead reveals no matches
        if(ll < 0) { 
            found(currentToken().kind + " '" + currentToken().value +"'", true);
            error(name);
            return false;
        } else {
            _parts = parts[ll];
        }

        for(var i = 0; i < _parts.length; i++) { //loop through all parts
            var part = _parts[i]; //get the current part

            if(part === 'self') 
                success = runProduction(prod);
            else
                success = (part instanceof Production ? runProduction(part):part()); //does the source code match this part of the production? success if yes.

            if(!success) {
                currentNode = currentNode.getParent();
                depth--;
                return false;
            }

            if(i != _parts.length-1) //if we are at the end of the array, don't increment
                nextToken();
        }

        if(success) {
            found(name);
            currentNode = currentNode.getParent(); //move up a node
            depth--;
            return true; //looped correctly -> parsed correctly
        }
    }

    //creates a single token function to be used in productions
    function SingleToken(t,val) {
        return function() {
            depth++;
            var child = new TreeNode(currentToken().kind,currentToken()); //create child node for this token but don't add it yet
            if(val) { //if value is provided
                expect(t+" '"+val+"'");
                found(currentToken().kind + " '" + currentToken().value +"'", true);
                if(currentToken().is(t,val)) {
                    currentNode.addChild(child); //since this token is correct, add the child node to the cst
                    depth--;
                    return true;
                }
                else {
                    error(t+" "+val);
                    depth--;
                    return false;
                }
            } else { //value not provided
                expect(t);
                found(currentToken().kind + " '" + currentToken().value + "'", true);
                if(currentToken().is(t)) {
                    currentNode.addChild(child); //since this token is correct, add the child node to the cst
                    depth--;
                    return true;
                }
                else {
                    error(t);
                    depth--;
                    return false;
                }
            }
        }
    }

    //-------------- Productions --------------
    var PRODUCTIONS = {};

    //instantiate production objects
    PRODUCTIONS.Program = new Production(); //
    PRODUCTIONS.Block = new Production();   //
    PRODUCTIONS.Statement = new Production(); //
    PRODUCTIONS.StatementList = new Production(); //
    PRODUCTIONS.PrintStatement = new Production(); //
    PRODUCTIONS.AssignmentStatement = new Production(); //
    PRODUCTIONS.VarDecl = new Production(); //
    PRODUCTIONS.WhileStatement = new Production(); //
    PRODUCTIONS.IfStatement = new Production(); //
    PRODUCTIONS.Expr = new Production(); //
    PRODUCTIONS.BooleanExpr = new Production(); //
    PRODUCTIONS.IntExpr = new Production(); //
    PRODUCTIONS.StringExpr = new Production(); //
    PRODUCTIONS.CharList = new Production(); //

    //Production definitions
    PRODUCTIONS.Statement.set("Statement", [[PRODUCTIONS.Block],                //0
                                            [PRODUCTIONS.PrintStatement],       //1
                                            [PRODUCTIONS.AssignmentStatement],  //2
                                            [PRODUCTIONS.VarDecl],              //3
                                            [PRODUCTIONS.WhileStatement],       //4
                                            [PRODUCTIONS.IfStatement]],         //5
                                            function() {
                                                switch(currentToken().kind) {
                                                    case Tokens.T_KEYWORD: //print, while, if
                                                        if(currentToken().is(Tokens.T_KEYWORD, "print"))
                                                            return 1;
                                                        else if(currentToken().is(Tokens.T_KEYWORD, "while"))
                                                            return 4;
                                                        else
                                                            return 5;
                                                    case Tokens.T_ID: //assignment statement
                                                        return 2;
                                                    case Tokens.T_TYPE: //var declaration
                                                        return 3;
                                                    case Tokens.T_BRACE: //block
                                                        return 0;
                                                    default: //not a valid statement
                                                        return -1;
                                                }
                                            });
    PRODUCTIONS.StatementList.set("StatementList",[[PRODUCTIONS.Statement, 'self']],false,{"token":Tokens.T_BRACE,"value":'}'});
    PRODUCTIONS.Block.set("Block",[[SingleToken(Tokens.T_BRACE,'{'), PRODUCTIONS.StatementList, SingleToken(Tokens.T_BRACE,'}')]]); 
    PRODUCTIONS.Program.set("Program",[[PRODUCTIONS.Block,SingleToken(Tokens.T_EOF)]]);
    PRODUCTIONS.VarDecl.set("VarDecl",[[SingleToken(Tokens.T_TYPE),SingleToken(Tokens.T_ID)]]);
    PRODUCTIONS.PrintStatement.set("PrintStatement", 
        [[SingleToken(Tokens.T_KEYWORD,"print"),SingleToken(Tokens.T_PAREN,"("),PRODUCTIONS.Expr,SingleToken(Tokens.T_PAREN,")")]]);
    PRODUCTIONS.AssignmentStatement.set("AssignmentStatement", [[SingleToken(Tokens.T_ID),SingleToken(Tokens.T_ASSIGN),PRODUCTIONS.Expr]]);
    PRODUCTIONS.WhileStatement.set("WhileStatement", [[SingleToken(Tokens.T_KEYWORD, "while"),PRODUCTIONS.BooleanExpr,PRODUCTIONS.Block]]);
    PRODUCTIONS.IfStatement.set("IfStatement", [[SingleToken(Tokens.T_KEYWORD, "if"),PRODUCTIONS.BooleanExpr,PRODUCTIONS.Block]]);
    PRODUCTIONS.Expr.set("Expr", 
        [[PRODUCTIONS.IntExpr],         //0
         [PRODUCTIONS.StringExpr],      //1
         [PRODUCTIONS.BooleanExpr],     //2
         [SingleToken(Tokens.T_ID)]],   //3
         function() {
            switch(currentToken().kind) {
                case Tokens.T_DIGIT: //IntExpr
                    return 0;
                case Tokens.T_QUOTE: //StringExpr
                    return 1;
                case Tokens.T_PAREN: //potential BooleanExpr
                    if(currentToken().is(Tokens.T_PAREN,"("))
                        return 2;
                    else
                        return -1; //error
                case Tokens.T_BOOLEAN: //actually a BoolleanExpr
                    return 2;
                case Tokens.T_ID: //an id
                    return 3;
                default:
                    return -1; //error, no matches
            }
         });
    PRODUCTIONS.IntExpr.set("IntExpr",
        [[SingleToken(Tokens.T_DIGIT),SingleToken(Tokens.T_OPERATOR), PRODUCTIONS.Expr], //0
        [SingleToken(Tokens.T_DIGIT)]], //1
        function() {
            nextToken(); //since both possibilities start with DIGIT, we need to look at the next token
            if(currentToken() && currentToken().is(Tokens.T_OPERATOR)) { //if this token exists and is an operator
                lastToken(); //set the token index back to where it should be
                return 0;
            }
            //if we get here, it can't be DIGIT + Expr, so let's check if it's just digit
            lastToken(); //set the token index back to where it should be
            if(currentToken().is(Tokens.T_DIGIT))
                return 1;

            //if we reach this point, this cannot be an IntExpr
            return -1; 
        });
    PRODUCTIONS.BooleanExpr.set("BooleanExpr",
        [[SingleToken(Tokens.T_PAREN,"("),PRODUCTIONS.Expr,SingleToken(Tokens.T_BOOLOP),PRODUCTIONS.Expr,SingleToken(Tokens.T_PAREN,")")], //0
         [SingleToken(Tokens.T_BOOLEAN)]],  //1
         function() {
            if(currentToken().is(Tokens.T_PAREN,"("))
                return 0;
            else if(currentToken().is(Tokens.T_BOOLEAN)) 
                return 1;
            else
                return -1;
         });
    PRODUCTIONS.StringExpr.set("StringExpr",[[SingleToken(Tokens.T_QUOTE),PRODUCTIONS.CharList,SingleToken(Tokens.T_QUOTE)]]);
    PRODUCTIONS.CharList.set("CharList", 
        [[SingleToken(Tokens.T_CHAR), 'self'], //0
         [SingleToken(Tokens.T_SPACE), 'self']], //1
         function() {
            switch(currentToken().kind) {
                case Tokens.T_CHAR:
                    return 0;
                case Tokens.T_SPACE:
                    return 1;
                default:
                    return -1;
            }
         },
         {"token":Tokens.T_QUOTE});
    //-------------- End Productions --------------
    
    var parse = function(tokenList) {
        //if tokenList not defined, or it is not the minimun length of a program
        if(!tokenList || tokenList.length < 3) {
            error(1,"Parse Error: Insufficient tokens to parse program.");
            return;
        }

        tokens = tokenList;
        if(runProduction(PRODUCTIONS.Program))
            return cst; //if the program parsed successfully, return the cst
    }

    var reset = function() {
        indexInTokenList = 0;
        tokens = [];
        depth = -1;
        cst = null; 
        currentNode = null;
    }

    return {
        init : function() {
            var self = this;
            CorduleJS.observe(self,'parse',parse);
            CorduleJS.observe(self,'reset',reset);
        },
        destroy : function() {}
    }
})());