function TreeNode(tn_text,tn_item,tn_parent) {
    var text = tn_text;
    var item = tn_item;
    var parent = tn_parent;
    var children = [];

    //add to utility file eventually
    function tabs(n) {
        var str = "";
        for(var i=0; i<n; i++)
            str += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
        return str;
    }

    this.addChild = function(child) {
        child.setParent(this); 
        children.push(child);
        return child;
    }

    this.getItem = function() {
        return item;
    }

    this.setItem = function(tn_item) {
        item = tn_item;
    }

    this.getChildren = function() {
        return children;
    }

    this.getChild = function(index) {
        return children[index];
    }

    this.getText = function() {
        return text;
    }

    this.setParent = function(node) {
        parent = node;
    }

    this.getParent = function() {
        return parent;
    }

    //temp function to output for now
    this.output = function(depth) {
        if(!depth)
            depth = 0;
        CorduleJS.pushRequest('putStr', {message: tabs(depth) + text + (item ? " : "+item.value:"") +"<br>", DOM_ID: 'CST', verbose: true});
        for(var i=0; i<children.length; i++)
            children[i].output(depth+1);
    }
}