CorduleJS.addModule('SymanticAnalysis', (function() {
    var ast = null;
    var currentNode = null;

    var buildAST = function(cNode) {
        switch(cNode.getText()) {
            case 'Program':
                //create the program node of the AST and move down
                if(!ast) {
                    ast = new TreeNode("Program");
                    currentNode = ast;
                }
                buildAST(cNode.getChild(0));
                break;
            case 'Block':
                //create a new Block node, and add it to the AST
                var newNode = new TreeNode("Block");
                currentNode.addChild(newNode);
                currentNode = newNode;
                //move down the CST to the nearest StatementList
                buildAST(cNode.getChild(1));
                //after processing the StatementList, move back up 
                currentNode = currentNode.getParent();
                break;
            case 'StatementList':
                //first we process the Statement
                buildAST(cNode.getChild(0));
                //if a StatementList exists, process it 
                if(cNode.getChild(1))
                    buildAST(cNode.getChild(1));
                break;
            case 'Statement':
                //nothing to do here, just keep recursing
                buildAST(cNode.getChild(0));
                break;
            case 'PrintStatement':
                //add print node to AST
                var newNode = new TreeNode("Print");
                currentNode.addChild(newNode);
                currentNode = newNode;
                //recurse on expr
                buildAST(cNode.getChild(2));
                //after processing the expr, move back up in AST
                currentNode = currentNode.getParent();
                break;
            case 'AssignmentStatement':
                //add Assignment node to AST
                var newNode = new TreeNode("Assignment");
                currentNode.addChild(newNode);
                currentNode = newNode;
                //add id as child
                currentNode.addChild(cNode.getChild(0));
                //recurse on expr
                buildAST(cNode.getChild(2));
                //after processing the expr, move back up in AST
                currentNode = currentNode.getParent();
                break;
            case 'VarDecl':
                //add VarDecl node to AST
                var newNode = new TreeNode("VarDecl");
                currentNode.addChild(newNode);
                //add type as child
                newNode.addChild(cNode.getChild(0));
                //add id as child
                newNode.addChild(cNode.getChild(1));
                break;
            case 'WhileStatement':
                //add While node to AST
                var newNode = new TreeNode("While");
                currentNode.addChild(newNode);
                currentNode = newNode;
                //recurse on BooleanExpr
                buildAST(cNode.getChild(1));
                //recurse on Block
                buildAST(cNode.getChild(2));
                //after processing while statement, move back up in AST
                currentNode = currentNode.getParent();
                break;
            case 'IfStatement':
                //add If node to AST
                var newNode = new TreeNode("If");
                currentNode.addChild(newNode);
                currentNode = newNode;
                //recurse on BooleanExpr
                buildAST(cNode.getChild(1));
                //recurse on Block
                buildAST(cNode.getChild(2));
                //after processing if statement, move back up in AST
                currentNode = currentNode.getParent();
                break;
            case 'Expr':
                //if the expr is just an id, add that as the child
                if(!(cNode.getChild(0) instanceof TreeNode)) 
                    currentNode.addChild(cNode.getChild(0));
                else //otherwise, it is a diff type of expr, so recurse on that
                    buildAST(cNode.getChild(0));
                break;
            case 'IntExpr':
                if(!cNode.getChild(1)) //if this expr is only a digit
                    currentNode.addChild(cNode.getChild(0)); //just add the digit as a child
                else {                    
                    //add operator node to AST
                    var newNode = new TreeNode(cNode.getChild(1).getItem().value); //check into this later... might be child node... always (+) anyway
                    currentNode.addChild(newNode);
                    currentNode = newNode;
                    //set left child to the digit
                    currentNode.addChild(cNode.getChild(0));
                    //recurse through expr
                    buildAST(currentNode.getChild(2));
                    //after processing IntExpr, move back up in AST
                    currentNode = currentNode.getParent();
                }
                break;
            case 'StringExpr':
                currentNode.addChild(new TreeNode('String',{value: '"'+buildStr(cNode.getChild(1))+'"'}));
                break;
            case 'BooleanExpr':
                if(currentNode.getChild(0).value === '(') { //if we have a boolean expression
                    //add boolop node to AST
                    var newNode = new TreeNode(cNode.getChild(2).getItem().value);
                    currentNode.addChild(newNode);
                    currentNode = newNode;
                    //recurse through first expr
                    buildAST(cNode.getChild(1));
                    //recurse through second expr
                    buildAST(cNode.getChild(3));
                    //after processing BoolExpr, move back up in AST
                    currentNode = currentNode.getParent();
                } else //otherwise, we just have a boolean value
                    currentNode.addChild(cNode.getChild(0).getItem().value); //add boolval as child
                break;
            default:
                break;
        }
    }

    //recursively build a string from CharLists
    var buildStr = function(chList) {
        var val = chList.getChild(0).getItem().value || " ";
        return val + (chList.getChild(1) ? buildStr(chList.getChild(1)):"");
    }

    var reset = function() {
        ast = null;
        currentNode = null;
    }

    return {
        init : function() {
            var self = this;
            CorduleJS.observe(self,'symanticAnalysis', function(cst){buildAST(cst);ast.output()});
            CorduleJS.observe(self,'reset', reset);
        },
        destroy : function() {}
    }
})());