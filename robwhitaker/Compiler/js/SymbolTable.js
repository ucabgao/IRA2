CorduleJS.addModule('SymbolTable', (function() {
    var head = null;
    var currentNode = head;
    var maxScope = -1;

    var scopeIn = function() {
        if(head) {
            var newScope = new TreeNode(++maxScope);
            newScope.setItem([]);
            currentNode.addChild(newScope);
            currentNode = newScope;
        } else {
            head = new TreeNode(++maxScope);
            head.setParent(null);
            currentNode = head;
        }
        if(currentNode.getText() >= 0)
            CorduleJS.pushRequest('putStr', {message: "Changed Scope: "+currentNode.getText(), verbose: true});
    }

    var scopeOut = function() {
        if(currentNode.getParent()) {
            currentNode = currentNode.getParent();
            CorduleJS.pushRequest('putStr', {message: "Changed Scope: "+currentNode.getText(), verbose: true});
        }
    }

    var push = function(typeToken,idToken) {
        CorduleJS.pushRequest('putStr',{
            message:"Adding item to symbol table -> " + typeToken.value + " " + idToken.value + ", Scope: " + currentNode.getText(),
            verbose: true
        });
        if(currentNode.getItem())
            currentNode.getItem().push({"type":typeToken.value,"id":idToken.value,"line":idToken.line,"initialized":false});
        else
            currentNode.setItem([{"type":typeToken.value,"id":idToken.value,"line":idToken.line,"initialized":false}]);
    }

    var initialize = function(idToken) {
        var tempNode = currentNode;
        while(tempNode && !(tempNode.getParent() === undefined)) {
            for(var i=0; tempNode.getItem() && i<tempNode.getItem().length;i++) {
                if(tempNode.getItem()[i].id === idToken.value) {
                    tempNode.getItem()[i].initialized = true;
                    return;
                }
            }
            tempNode = tempNode.getParent();
        }
        CorduleJS.pushRequest('logIssue', {type: 'warning', 
                                           message: "Warning: Found AssignmentStatement for undeclared identifier " + idToken.value +".",
                                           line: idToken.line});  
    }

    var get = function() {
        return head;
    }

    // var put = function(nextNode) {
    //     var tempNode = nextNode || head;
    //     if(tempNode.getItem() && tempNode.getItem().length > 0) {
    //         Compiler.putStr("---------- Scope "+tempNode.getText()+" ----------");
    //         Compiler.putStr("<div class='symT'>Type</div> <div class='symT'>ID</div> <div class='symT'>Line</div> <div class='symT'>Initialized</div>");
    //         if(tempNode.getItem()) {
    //             for(var i = 0; i<tempNode.getItem().length; i++) {
    //                 var elem = tempNode.getItem()[i];
    //                 Compiler.putStr("<div class='symT'>"+ elem.type + "</div><div class='symT'>" + 
    //                          elem.id + "</div><div class='symT'>" + elem.line + 
    //                          "</div><div class='symT'>" + elem.initialized +"</div>");
    //             }
    //         }
    //     }

    //     for(var i=0; i<tempNode.getChildren().length; i++)
    //         Compiler.SymbolTable.put(tempNode.getChild(i));
    // }

    var reset = function() {
        head = null;
        currentNode = null;
        maxScope = -1;
    }

    return {
        init : function() {
            var self = this;
            CorduleJS.observe(self,'reset',reset);
            CorduleJS.observe(self,'scope', function(scopeDirection) {
                if(scopeDirection === 'in')
                    scopeIn();
                else if(scopeDirection === 'out')
                    scopeOut();
            });
        },
        destroy : function() {}
    }
})());