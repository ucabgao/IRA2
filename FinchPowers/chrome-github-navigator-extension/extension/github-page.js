function cleanFilesList(fileList){
    $(fileList).find(".commit.commit-tease.js-details-container").remove();
    $(fileList).find(".branch-infobar").remove();
    if($(fileList).find("tr:first a:first").html() == ".."){
        $(fileList).find("tr:first").remove()
    }
}

function init(){
    $(".wrapper, .container").hide();
    cleanFilesList(".bubble.files-bubble");
    $("body").append(
        "<div id='fileBrowser'>"
        + $(".bubble.files-bubble").html() 
        + "</div>"
        + "<div id='fileViewer'></div>");
    $("#fileBrowser").parents().css("height", "100%");

    $("#fileBrowser").on("click", "a", function(){
        var icon_span = $(this).parents("tr:first").find("td:first span");
        var href = $(this).attr("href");
        var anchor = this
        if ($(icon_span).hasClass("octicon-file-directory")){
            if($(anchor).parents("tr:first").next().hasClass("ghExtensionExtend")){
                //Already exists
                $(anchor).parents("tr:first").next().toggle();
            }else{
                //First time, fetch it
                $(anchor).parents("tr:first").after(
                    "<tr class='ghExtensionExtend'>"
                    + "<td colspan=4 style='padding-left: 10px;'>Loading</td>"
                    + "</tr>");
                $.get(href, function(html){

                    html = $(html).find(".bubble.files-bubble");
                    cleanFilesList(html);
                    text = $(html).html();
                    $(anchor).parents("tr:first").next().find("td").html(text);
                });
            }
        } else if ($(icon_span).hasClass("octicon-file-submodule")) {
            //Nav out to the submodule
            return true;
        } else {
            $(".githubPagesHighlighted").removeClass("githubPagesHighlighted");
            $(this).parents("tr:first").addClass("githubPagesHighlighted");
            if($(this).data("cachedFile")){
                $("#fileViewer").find("table").remove();
                $("#fileViewer").html(
                    "<table>" + $(this).data("cachedFile") + "</table>");
            }else{
                var anchor = this;
                $("#fileViewer").html("Loading");
                $.get(href, function(html){
                    var text;
                    if($(html).find(".file-code.file-diff.tab-size-8").size()){
                        //standard code viewing pane
                        text = $(html).find(".file-code.file-diff.tab-size-8").html();
                    }else if($(html).find(".blob.instapaper_body")){
                        //markdown
                        console.log($(html).find(".blob.instapaper_body"));
                        console.log($(html).find(".blob.instapaper_body").html())
                        text = $(html).find(".blob.instapaper_body").html();
                    }else if($(html).find(".blob-wrapper").size()){
                        //images
                        text = $(html).find(".blob-wrapper").html();
                    }else{
                        throw "Cannot handle the selected resource";
                    }
                    $("#fileViewer").html("<table>" + text + "</table>");
                    $(anchor).data("cachedFile", text);
                });
            }
        }
        return false;
    });
}

if($("#fileBrowser").size()){

}else{
    init();
}
