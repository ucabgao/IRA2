/*
Copyright (C) 2011 by Wendy Liu, Andrew Hankinson, Laurent Pugin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

// this pattern was taken from http://www.virgentech.com/blog/2009/10/building-object-oriented-jquery-plugin.html
(function( $ ) {
    var Diva = function(element, options) {
        // These are elements that can be overridden upon instantiation
        var defaults =  {
            adaptivePadding: 0.05,      // The ratio of padding to the page dimension
            backendServer: '',          // The URL to the script returning the JSON data; mandatory
            enableAutoTitle: true,      // Shows the title within a div of id diva-title
            enableFilename: true,       // Uses filenames instead of page numbers for links (i=bm_001.tif instead of p=1)
            enableFullscreen: true,     // Enable or disable fullscreen mode
            enableGotoPage: true,       // A "go to page" jump box
            enableGrid: true,           // A grid view of all the pages
            enableGridSlider: true,     // Slider to control the pages per grid row
            enableKeyScroll: true,      // Scrolling using the page up/down keys
            enableSpaceScroll: false,   // Scrolling down by pressing the space key
            enableZoomSlider: true,     // Enable or disable the zoom slider (for zooming in and out)
            fixedPadding: 10,           // Fallback if adaptive padding is set to 0
            fixedHeightGrid: true,      // So each page in grid view has the same height (only widths differ)
            viewerFloat: 'none',        // Change to left or right for dual-viewer layouts
            iipServerBaseUrl: '',       // The URL to the IIPImage installation, including the ?FIF=
            maxPagesPerRow: 8,          // Maximum number of pages per row, grid view
            maxZoomLevel: 0,            // Optional; defaults to the max zoom returned in the JSON response
            minPagesPerRow: 2,          // 2 for the spread view. Recommended to leave it
            minZoomLevel: 0,            // Defaults to 0 (the minimum zoom)
            onFullscreen: null,         // Callback for toggling fullscreen
            onFullscreenEnter: null,    // Callback for entering fullscreen mode
            onFullscreenExit: null,     // Callback for exiting fullscreen mode
            onGrid: null,               // Callback for toggling grid mode
            onJump: null,               // Callback function for jumping to a specific page (using the gotoPage feature)
            onReady: null,              // Callback function for initial load
            onScroll: null,             // Callback function for scrolling
            onScrollDown: null,         // Callback function for scrolling down, only
            onScrollUp: null,           // Callback function for scrolling up only
            onZoom: null,               // Callback function for zooming in general
            onZoomIn: null,             // Callback function for zooming in only
            onZoomOut: null,            // Callback function for zooming out only
            pagesPerRow: 5,         // The default number of pages per row in grid view
            protocol: 'http://',        // Either http:// or https://; for getCurrentURL()
            tileFadeSpeed: 300,         // The tile fade-in speed in ms. Set to 0 to disable tile fading. May also be "fast" or "slow".
            tileHeight: 256,            // The height of each tile, in pixels; usually 256
            tileWidth: 256,             // The width of each tile, in pixels; usually 256
            viewportMargin: 200,        // Pretend tiles +/- 200px away from viewport are in
            zoomLevel: 2                // The initial zoom level (used to store the current zoom level)
        };
        
        // Apply the defaults, or override them with passed-in options.
        var settings = $.extend({}, defaults, options);

        // Things that cannot be changed because of the way they are used by the script
        // Many of these are declared with arbitrary values that are changed later on
        var globals = {
            centerX: 0,                 // Only used if doubleClick is true - for zooming in
            centerY: 0,                 // Y-coordinate, see above
            ctrlKey: false,             // Hack for ctrl+double-clicking in Firefox on Mac
            currentPageIndex: 0,        // The current page in the viewport (center-most page)
            desiredXOffset: 0,          // Used for holding the 'x' hash parameter (x offset from left side of page)
            desiredYOfffset: 0,         // Used for holding the 'y' hash parameter (y offset from top of page)
            dimAfterZoom: 0,            // Used for storing the item dimensions after zooming
            dimBeforeZoom: 0,           // Used for storing the item dimensions before zooming
            doubleClick: false,         // If the zoom has been triggered by a double-click event
            elementSelector: '',        // The ID of the element plus the # for easy selection, set in init()
            firstAjaxRequest: true,     // True initially, set to false after the first request
            firstPageLoaded: -1,        // The ID of the first page loaded (value set later)
            firstRowLoaded: -1,         // The index of the first row loaded
            fullscreenStatusbar: null,  // The popup box that tells you what page you're on
            goDirectlyTo: -1,           // For the page hash param (#p=100 or &p=5)
            hashParamSuffix: '',        // Used when there are multiple document viewers on a page
            heightAbovePages: [],       // The height above each page
            horizontalOffset: 0,        // Used for storing the page offset before zooming
            horizontalPadding: 0,       // Either the fixed padding or adaptive padding
            ID: null,                   // The prefix of the IDs of the elements (usually 1-diva-)
            inFullscreen: false,        // Set to true when the user enters fullscreen mode
            inGrid: false,              // Set to true when the user enters the grid view
            itemTitle: '',              // The title of the document
            lastPageLoaded: -1,         // The ID of the last page loaded (value set later)
            lastRowLoaded: -1,          // The index of the last row loaded
            maxHeight: 0,               // The height of the tallest page
            maxWidth: 0,                // The width of the widest page
            mobileSafari: false,        // Checks if the user is on an iPad, iPhone or iPod
            numClicks: 0,               // Hack for ctrl+double-clicking in Firefox on Mac
            numPages: 0,                // Number of pages in the array
            numRows: 0,                 // Number of rows
            openIncipits: [],           // For preserving state of dropdown arrows
            pages: [],                  // An array containing the data for all the pages
            panelHeight: 0,             // Height of the panel. Set in initiateViewer()
            panelWidth: 0,              // Width of the panel. Set in initiateViewer()
            prevVptTop: 0,              // Used to determine vertical scroll direction
            scaleWait: false,           // For preventing double-scale on the iPad
            selector: '',               // Uses the generated ID prefix to easily select elements
            scrollbarWidth: 0,          // Set to the actual scrollbar width in init()
            scrollLeft: -1,             // Total scroll from the left
            scrollSoFar: 0,             // Holds the number of pixels of vertical scroll
            scrollTop: -1,              // Total scroll from the top
            totalHeight: 0,             // Height of all the image stacked together, value set later
            verticalOffset: 0,          // Used for storing the page offset before zooming
            verticalPadding: 0,         // Either the fixed padding or adaptive padding
            viewerXOffset: 0,           // Distance between left edge of viewer and document left edge
            viewerYOffset: 0,           // ^ for top edges
            zoomInCallback: null,       // Only executed after zoomIn() if present
            zoomOutCallback: null       // Only executed after zoomOut() if present
        };

        $.extend(settings, globals);

        // Checks if a page is within the viewport vertically
        var verticallyInViewport = function(top, bottom) {
            var panelHeight = settings.panelHeight;
            var topOfViewport = settings.scrollSoFar - settings.viewportMargin;
            var bottomOfViewport = topOfViewport + panelHeight + settings.viewportMargin * 2;
           
            if (top >= topOfViewport && top <= bottomOfViewport) {
                // If top of page is in the viewport
                return true;
            } else if (bottom >= topOfViewport && bottom <= bottomOfViewport) {
                // Same as above for the bottom of the page
                return true;
            } else if (top <= topOfViewport && bottom >= bottomOfViewport) {
                // Top of page is above, bottom of page is below
                return true;
            } else {
                // The page is nowhere near the viewport, return 0
                return false;
            }
        };
        
        // Check if a page has been loaded (i.e. is visible to the user) 
        var isPageLoaded = function(pageIndex) {
            // Done using the length attribute in jQuery
            // If and only if the div does not exist, its length will be 0
            if ($(settings.selector + 'page-' + pageIndex).length === 0) {
                return false;
            } else {
                return true;
            }
        };
        
        // Check if a page is near the viewport and thus should be loaded
        var isPageVisible = function(pageIndex) {
            var topOfPage = settings.heightAbovePages[pageIndex];
            var bottomOfPage = topOfPage + settings.pages[pageIndex].h + settings.verticalPadding;
            return verticallyInViewport(topOfPage, bottomOfPage);
        };

        // Check if a specific tile is near the viewport and thus should be loaded (row-based only)
        var isTileVisible = function(pageIndex, tileRow, tileCol) {
            // Call near viewport
            var tileTop = settings.heightAbovePages[pageIndex] + (tileRow * settings.tileHeight) + settings.verticalPadding;
            var tileBottom = tileTop + settings.tileHeight;
            return verticallyInViewport(tileTop, tileBottom);
        };
        
        // Check if a tile has already been appended
        var isTileLoaded = function(pageIndex, tileNumber) {
            if ($(settings.selector + 'tile-' + pageIndex + '-' + tileNumber).length > 0) {
                return true;
            } else {
                return false;
            }
        };
       
        // Appends the page directly into the document body, or loads the relevant tiles
        var loadPage = function(pageIndex) {
            var content = [];
            var filename = settings.pages[pageIndex].fn;
            var rows = settings.pages[pageIndex].r;
            var cols = settings.pages[pageIndex].c;
            var width = settings.pages[pageIndex].w;
            var height = settings.pages[pageIndex].h;
            var maxZoom = settings.pages[pageIndex].m_z;
            var leftOffset, widthToUse;
            
            // Use an array as a string builder - faster than str concatentation
            var lastHeight, lastWidth, row, col, tileHeight, tileWidth, imgSrc;
            var tileNumber = 0;
            var heightFromTop = settings.heightAbovePages[pageIndex] + settings.verticalPadding;

            // Only try to append the div part if the page has not already been loaded
            if (!isPageLoaded(pageIndex)) {
                // Magically centered using left: 50% and margin-left: -(width/2)
                content.push('<div id="' + settings.ID + 'page-' + pageIndex + '" style="top: ' + heightFromTop + 'px; width: ' + width + 'px; height: ' + height + 'px; left: 50%; margin-left: -' + (width / 2) + 'px" class="diva-page">');
            }

            // Calculate the width and height of the outer tiles (the ones that may have weird dimensions)
            lastHeight = height - (rows - 1) * settings.tileHeight;
            lastWidth = width - (cols - 1) * settings.tileWidth;
            var tilesToLoad = [];

            // Now loop through the rows and columns
            for (row = 0; row < rows; row++) {
                for (col = 0; col < cols; col++) {
                    var top = row * settings.tileHeight;
                    var left = col * settings.tileWidth;

                    // Set to none if there is a tileFadeSpeed set
                    var displayStyle = (settings.tileFadeSpeed) ? 'none' : 'inline';

                    // The zoom level might be different, if a page has a different max zoom level than the others
                    var zoomLevel = (maxZoom === settings.maxZoomLevel) ? settings.zoomLevel : settings.zoomLevel + (maxZoom - settings.maxZoomLevel); 
                    tileHeight = (row === rows - 1) ? lastHeight : settings.tileHeight; // If it's the LAST tile, calculate separately
                    tileWidth = (col === cols - 1) ? lastWidth : settings.tileWidth; // Otherwise, just set it to the default height/width
                    imgSrc = settings.iipServerBaseUrl + filename + '&amp;JTL=' + zoomLevel + ',' + tileNumber;
                    
                    if (!isTileLoaded(pageIndex, tileNumber) && isTileVisible(pageIndex, row, col)) {
                        content.push('<div id="' + settings.ID + 'tile-' + pageIndex + '-' + tileNumber + '"style="display: ' + displayStyle + '; position: absolute; top: ' + top + 'px; left: ' + left + 'px; background-image: url(\'' + imgSrc + '\'); height: ' + tileHeight + 'px; width: ' + tileWidth + 'px;"></div>');
                    }

                    tilesToLoad.push(tileNumber);
                    tileNumber++;
                }
            }

            if (!isPageLoaded(pageIndex)) {
                content.push('</div>');

                // Build the content string and append it to the document
                var contentString = content.join('');
                $(settings.innerSelector).append(contentString);
            } else {
                // Append it to the page
                $(settings.selector + 'page-' + pageIndex).append(content.join(''));
            }

            // Make the tiles we just appended fade in
            if (settings.tileFadeSpeed) {
                for (var i = 0; i < tilesToLoad.length; i++) {
                    $(settings.selector + 'tile-' + pageIndex + '-' + tilesToLoad[i]).fadeIn(settings.tileFadeSpeed);
                }
            }
        };

        // Delete a page from the DOM; will occur when a page is scrolled out of the viewport
        var deletePage = function(pageIndex) {
            if (isPageLoaded(pageIndex)) {
                $(settings.selector + 'page-' + pageIndex).remove();
            }
        };

        // Check if a row index is valid
        var rowInRange = function(rowIndex) {
            if (rowIndex >= 0 && rowIndex < settings.numRows) {
                return true;
            } else {
                return false;
            }
        };

        // Check if a page index is valid
        var pageInRange = function(pageIndex) {
            if (pageIndex >= 0 && pageIndex < settings.numPages) {
                return true;
            } else {
                return false;
            }
        };

        // Check if the bottom of a page is above the top of a viewport (scrolling down)
        // For when you want to keep looping but don't want to load a specific page
        var pageAboveViewport = function(pageIndex) {
            var bottomOfPage = settings.heightAbovePages[pageIndex] + settings.pages[pageIndex].h + settings.verticalPadding;
            var topOfViewport = settings.scrollSoFar; 

            if (bottomOfPage < topOfViewport) {
                return true;
            } else {
                return false;
            }
        };
       
        // Check if the top of a page is below the bottom of a viewport (scrolling up)
        var pageBelowViewport = function(pageIndex) {
            var topOfPage = settings.heightAbovePages[pageIndex];
            var bottomOfViewport = settings.scrollSoFar + settings.panelHeight;

            if (topOfPage > bottomOfViewport) {
                return true;
            } else {
                return false;
            }
        };

        // Check if the bottom of a row is above the top of the viewport (scrolling down)
        var rowAboveViewport = function(rowIndex) {
            var bottomOfRow = settings.rowHeight * (rowIndex + 1);
            var topOfViewport = settings.scrollSoFar;

            if (bottomOfRow < topOfViewport) {
                return true;
            } else {
                return false;
            }
        };

        // Check if the top of a row is below the bottom of the viewport (scrolling up)
        var rowBelowViewport = function(rowIndex) {
            var topOfRow = settings.rowHeight * rowIndex;
            var bottomOfViewport = settings.scrollSoFar + settings.panelHeight;

            if (topOfRow > bottomOfViewport) {
                return true;
            } else {
                return false;
            }
        };

        // Helper function for setCurrentPage; should only be called at the end
        var updateCurrentPage = function(pageIndex) {
            var pageNumber = pageIndex + 1;
            var folioNumber = settings.pages[pageIndex].fn;
            if (folioNumber[0] == "1") {
                folioNumber = folioNumber.substring(2, folioNumber.indexOf('.tif'));
            } else if (folioNumber[0] == "2") {
                folioNumber = "A" + folioNumber.substring(3, folioNumber.indexOf('.tif'));
            }
            var ajaxURL = settings.appRoot + '/page/' + folioNumber;
            var folio = 'N/A';
            var feasts = [];
            $.getJSON(ajaxURL, function(data) {
                var toAppend = '';
                var illumination = '';
                if (data.length == 1 && data[0].continuation != "") {
                    var toAppend = '<p class="larger-text">This folio is a continuation of ' + data[0].continuation + '</p>';
                } else {
                    for (var i = 0; i < data.length; i++) {
                        var incipit = data[i];
                        folio = incipit.folio;
                        if (incipit.illumination != "") {
                            illumination = data[i].illumination;
                        } else {
                            // We need to work out a better way of doing continuation & illumination
                            var incipitID = String(data[i].id);
                            var incipitName = incipit.incipit;
                            var feast = incipit.feastnameeng;
                            if (jQuery.inArray(feast, feasts) == -1) {
                                feasts.push(feast);
                            }
                            toAppend += '<h3 class="incipit';
                            toAppend += (settings.openIncipits.indexOf(incipitID) >= 0) ? ' arrow2"' : '"';
                            toAppend += ' data-id="' + incipitID + '">' + incipitName + '</h3>';
                            toAppend += '<ul class="incipit-info"';
                            toAppend += (settings.openIncipits.indexOf(incipitID) >= 0) ? ' style="display: block;" ' : '';
                            toAppend += '>';
                            incipit_data = {
                                'Mode': incipit.mode,
                                'Office': incipit.office,
                                'Genre': incipit.genre,
                                'Liturgical Position': incipit.position,
                                'Standard Text': incipit.fullstandardtext,
                                'Manuscript Text': incipit.fullmanuscripttext,
                                'Feast Name': incipit.feastname + ' (<em>' + incipit.feastnameeng + '</em>)',
                                'CAO Number': incipit.caonumber
                            }
                            for (li_item in incipit_data) {
                                toAppend += '<li><strong>' + li_item + ':</strong> ' + incipit_data[li_item] + '</li>';
                            }
                            if (incipit.concordances_strm[0]) {
                                toAppend += '<li><p class="concordances">Concordances:</p><ul><li>' + incipit.concordances_strm.join('</li>\n<li>') + '</li></ul></li>';
                            }
                            toAppend += '</ul>';
                        }
                    }
                }
                // Append at the end
                if (feasts.length > 0) {
                    $("#current-folio-feasts").show();
                    $("#current-folio-feasts span").text(feasts.join("; "));
                } else {
                    $("#current-folio-feasts").hide();
                }
                if (illumination != "") {
                    $("#current-folio-illumination").show();
                    $("#current-folio-illumination span").text(illumination);
                } else {
                    $("#current-folio-illumination").hide();
                }
                $('#current-folio span').text(folio.replace(/^0+/, ""));
                $('#page-data').html(toAppend);
                $('.incipit, .concordances').click(function() {
                    $(this).next().toggle();
                    $(this).toggleClass('arrow2');
                    var incipitID = $(this).attr('data-id');
                    // Add it to (or remove from) array of stored click things
                    var incipitIndex = settings.openIncipits.indexOf(incipitID);
                    if (incipitIndex < 0) {
                        settings.openIncipits.push(incipitID);
                    } else {
                        delete settings.openIncipits[incipitIndex];
                    }
                });
            });
        };

        // Determines and sets the "current page" (settings.currentPageIndex); called within adjustPages 
        // The "direction" can be 0, 1 or -1; 1 for down, -1 for up, and 0 to go straight to a specific page
        var setCurrentPage = function(direction) {
            var currentPage = settings.currentPageIndex;
            var pageToConsider = settings.currentPageIndex + parseInt(direction, 10);
            var viewportMiddle = settings.panelHeight / 2;
            var changeCurrentPage = false;

            // When scrolling up:
            if (direction < 0) {
                // If the previous page > middle of viewport
                if (pageToConsider >= 0 && (settings.heightAbovePages[pageToConsider] + settings.pages[pageToConsider].h + (settings.verticalPadding) >= settings.scrollSoFar + viewportMiddle)) {
                    changeCurrentPage = true;
                }
            } else if (direction > 0) {
                // When scrolling down:
                // If this page < middle of viewport
                if (settings.heightAbovePages[currentPage] + settings.pages[currentPage].h + settings.verticalPadding < settings.scrollSoFar + viewportMiddle) {
                    changeCurrentPage = true;
                }
            }

            if (changeCurrentPage) {
                // Set this to the current page
                settings.currentPageIndex = pageToConsider;

                // Now try to change the next page, given that we're not going to a specific page
                // Calls itself recursively - this way we accurately obtain the current page
                if (direction !== 0) {
                    // Only change it when we're done scrolling etc
                    if (!setCurrentPage(direction)) {
                        updateCurrentPage(pageToConsider);
                    }
                }
                return true;
            } else {
                return false;
            }
        };

        // Called in grid mode ... done this way to avoid going through every page
        var setCurrentRow = function(direction) {
            var currentRow = Math.floor(settings.currentPageIndex / settings.pagesPerRow);
            var rowToConsider = currentRow + parseInt(direction, 10);
            var middleOfViewport = settings.scrollSoFar + (settings.panelHeight / 2);
            var changeCurrentRow = false;

            if (direction < 0) {
                // This logic how does it work
                if (rowToConsider >= 0 && (settings.rowHeight * currentRow >= middleOfViewport || settings.rowHeight * rowToConsider >= settings.scrollSoFar)) {
                    changeCurrentRow = true;
                }
            } else if (direction > 0) {
                if ((settings.rowHeight * (currentRow + 1)) < settings.scrollSoFar && rowInRange(rowToConsider)) {
                    changeCurrentRow = true;
                }
            }

            if (changeCurrentRow) {
                settings.currentPageIndex = rowToConsider * settings.pagesPerRow;

                if (direction !== 0) {
                    if (!setCurrentRow(direction)) {
                        updateCurrentPage(settings.currentPageIndex);
                    }
                }

                return true;
            } else {
                return false;
            }
        };

        // Called by adjust pages - see what pages should be visisble, and show them
        var attemptPageShow = function(pageIndex, direction) {
            if (direction > 0) {
                // Direction is positive - we're scrolling down
                // Should we add this page to the DOM? First check if it's a valid page
                if (pageInRange(pageIndex)) {
                    // If it's near the viewport, yes, add it
                    if (isPageVisible(pageIndex)) {
                        loadPage(pageIndex);

                        // Reset the last page loaded to this one
                        settings.lastPageLoaded = pageIndex;

                        // Recursively call this function until there's nothing to add
                        attemptPageShow(settings.lastPageLoaded+1, direction);
                    } else if (pageAboveViewport(pageIndex)) {
                        // Otherwise, is it below the viewport?
                        // Do not increment last page loaded, that would be lying
                        // Attempt to call this on the next page
                        attemptPageShow(pageIndex + 1, direction);
                    }
                } else {
                    // Nothing to do ... return
                    return;
                }
            } else {
                // Direction is negative - we're scrolling up
                if (pageInRange(pageIndex)) {
                    // If it's near the viewport, yes, add it
                    if (isPageVisible(pageIndex)) {
                        loadPage(pageIndex);

                        // Reset the first page loaded to this one
                        settings.firstPageLoaded = pageIndex;

                        // Recursively call this function until there's nothing to add
                        attemptPageShow(settings.firstPageLoaded-1, direction);
                    } else if (pageBelowViewport(pageIndex)) {
                        // Attempt to call this on the next page, do not increment anything
                        attemptPageShow(pageIndex-1, direction);
                    }
                } else {
                    // Nothing to do ... return
                    return;
                }
            }
        };

        // Called by adjustPages - see what pages need to be hidden, and hide them
        var attemptPageHide = function(pageIndex, direction) {
            if (direction > 0) {
                // Direction is positive - we're scrolling down
                // Should we delete this page from the DOM?
                if (pageInRange(pageIndex) && pageAboveViewport(pageIndex)) {
                    // Yes, delete it, reset the first page loaded
                    deletePage(pageIndex);
                    settings.firstPageLoaded++;

                    // Try to call this function recursively until there's nothing to delete
                    attemptPageHide(settings.firstPageLoaded, direction);
                } else {
                    // Nothing to delete - return
                    return;
                }
            } else {
                // Direction must be negative (not 0, see adjustPages), we're scrolling up
                if (pageInRange(pageIndex) && pageBelowViewport(pageIndex)) {
                    // Yes, delete it, reset the last page loaded
                    deletePage(pageIndex);
                    settings.lastPageLoaded--;
                    
                    // Try to call this function recursively until there's nothing to delete
                    attemptPageHide(settings.lastPageLoaded, direction);
                } else {
                    return;
                }
            }
        };

        // Same thing as attemptPageShow only with rows
        var attemptRowShow = function(rowIndex, direction) {
            if (direction > 0) {
                if (rowInRange(rowIndex)) {
                    if (isRowVisible(rowIndex)) {
                        loadRow(rowIndex);
                        settings.lastRowLoaded = rowIndex;
                        attemptRowShow(settings.lastRowLoaded+1, direction);
                    } else if (rowAboveViewport(rowIndex)) {
                        attemptRowShow(rowIndex+1, direction);
                    }
                }
            } else {
                if (rowInRange(rowIndex)) {
                    if (isRowVisible(rowIndex)) {
                        loadRow(rowIndex);
                        settings.firstRowLoaded = rowIndex;
                        attemptRowShow(settings.firstRowLoaded-1, direction);
                    } else if (rowBelowViewport(rowIndex)) {
                        attemptRowShow(rowIndex-1, direction);
                    }
                }
            }
        };

        var deleteRow = function(rowIndex) {
            if (isRowLoaded(rowIndex)) {
                $(settings.selector + 'row-' + rowIndex).remove();
            }
        };

        var attemptRowHide = function(rowIndex, direction) {
            if (direction > 0) {
                if (rowInRange(rowIndex) && rowAboveViewport(rowIndex)) {
                    deleteRow(rowIndex);
                    settings.firstRowLoaded++;
                    attemptRowHide(settings.firstRowLoaded, direction);
                }
            } else {
                if (rowInRange(rowIndex) && rowBelowViewport(rowIndex)) {
                    deleteRow(rowIndex);
                    settings.lastRowLoaded--;

                    attemptRowHide(settings.lastRowLoaded, direction);
                }
            }
        };

        var adjustRows = function(direction) {
            if (direction < 0) {
                attemptRowShow(settings.firstRowLoaded, -1);
                setCurrentRow(-1);
                attemptRowHide(settings.lastRowLoaded, -1);
            } else if (direction > 0) {
                attemptRowHide(settings.firstRowLoaded, 1);
                setCurrentRow(1);
                attemptRowShow(settings.lastRowLoaded, 1);
            }

            // Handle the scrolling callback functions here
            if (direction !== 0) {
                $.executeCallback(settings.onScroll, settings.scrollSoFar);

                // If we're scrolling down
                if (direction > 0) {
                    $.executeCallback(settings.onScrollDown, settings.scrollSoFar);
                } else {
                    // We're scrolling up
                    $.executeCallback(settings.onScrollUp, settings.scrollSoFar);
                }
            }
        };

        // Handles showing and hiding pages when the user scrolls
        var adjustPages = function(direction) {
            // Direction is negative, so we're scrolling up
            if (direction < 0) {
                attemptPageShow(settings.firstPageLoaded, direction);
                setCurrentPage(-1);
                attemptPageHide(settings.lastPageLoaded, direction);
            } else if (direction > 0) {
                // Direction is positive so we're scrolling down
                attemptPageHide(settings.firstPageLoaded, direction);
                attemptPageShow(settings.lastPageLoaded, direction);
                setCurrentPage(1);
            }

            // Handle the scrolling callback functions here
            if (direction !== 0) {
                $.executeCallback(settings.onScroll, settings.scrollSoFar);

                // If we're scrolling down
                if (direction > 0) {
                    $.executeCallback(settings.onScrollDown, settings.scrollSoFar);
                } else {
                    // We're scrolling up
                    $.executeCallback(settings.onScrollUp, settings.scrollSoFar);
                }
            }
        };

        // Goes directly to the page index stored in settings.goDirectlyTo
        var goDirectlyTo = function() {
            // Use settings.firstAjaxRequest instead of settings.goDirectlyTo
            // Because the latter can be 0, which may or may not be valid
            if (settings.goDirectlyTo >= 0) {
                gotoPage(settings.goDirectlyTo + 1, settings.desiredYOffset, settings.desiredXOffset);
                // Off by one error before
                updateCurrentPage(settings.goDirectlyTo);
                settings.goDirectlyTo = -1;
                return true;
            }
            return false;
        };

        // Don't call this when not in grid mode please
        // Scrolls to the relevant place when in grid view
        var gridScroll = function() {
            if (settings.gridScrollTop) {
                $(settings.outerSelector).scrollTop(settings.gridScrollTop);
                settings.gridScrollTop = 0;
            } else {
                // Figure out where it is supposed to scroll
                // Scroll to the row containing the current page
                gotoPage(settings.currentPageIndex + 1);
            }
        };

        // Helper function called by loadDocument to scroll to the desired place
        var documentScroll = function() {
            updateCurrentPage(settings.currentPageIndex);
            if (goDirectlyTo()) {
                return;
            }

            if (settings.scrollLeft >= 0 && settings.scrollTop >= 0) {
                $(settings.outerSelector).scrollTop(settings.scrollTop);
                $(settings.outerSelector).scrollLeft(settings.scrollLeft);
                settings.scrollLeft = -1;
                settings.scrollTop = -1;
                return;
            }

            // The x and y coordinates of the center ... let's zoom in on them
            var centerX, centerY, desiredLeft, desiredTop;
            
            // Determine the zoom change ratio - if first ajax request, set to 1
            var zChangeRatio = (settings.dimBeforeZoom > 0) ? settings.dimAfterZoom / settings.dimBeforeZoom : 1;
                
            // First figure out if we need to zoom in on a specific part (if doubleclicked)
            if (settings.doubleClick) {
                centerX = settings.centerX * zChangeRatio;
                centerY = settings.centerY * zChangeRatio;
                desiredLeft = Math.max((centerX) - (settings.panelWidth / 2), 0);
                desiredTop = Math.max((centerY) - (settings.panelHeight / 2), 0);
            } else {
                // Just zoom in on the middle
                // If the user wants more precise scrolling the user will have to double-click
                desiredLeft = settings.maxWidth / 2 - settings.panelWidth / 2 + settings.horizontalPadding;
                desiredTop = settings.verticalOffset * zChangeRatio;
            }
            
            settings.prevVptTop = 0;
            $(settings.outerSelector).scrollTop(desiredTop);
            $(settings.outerSelector).scrollLeft(desiredLeft);
        };

        // Perform the AJAX request; afterwards, execute the callback
        var ajaxRequest = function(zoomLevel, successCallback) {
            $.ajax({
                url: settings.backendServer + '&z=' + zoomLevel,
                cache: true,
                context: this, // Not sure if necessary
                dataType: 'json',
                success: function(data) {
                    // Save some data
                    settings.pages = data.pgs;
                    settings.maxWidth = data.dims.max_w;
                    settings.maxHeight = data.dims.max_h;

                    // If it's the first request, set some initial settings
                    if (settings.firstAjaxRequest) {
                        setupInitialLoad(data, zoomLevel);
                    }

                    // Clear the document, then execute the callback
                    clearDocument();

                    $.executeCallback(successCallback, data);
                    settings.firstAjaxRequest = false;
                }
            });
        };

        // Helper function for setting settings in the first AJAX request
        var setupInitialLoad = function(data, zoomLevel) {
            settings.itemTitle = data.item_title;
            settings.numPages = data.pgs.length;
            $('#diva-goto-page input').attr('placeholder', settings.numPages);

            // Make sure the set max zoom level is valid
            settings.maxZoomLevel = (settings.maxZoomLevel > 0 && settings.maxZoomLevel <= data.max_zoom) ? settings.maxZoomLevel : data.max_zoom;

            // Make sure the initial zoom level is valid (could be a hashparam)
            if (zoomLevel > settings.maxZoomLevel) {
                // If it's invalid, just use 0 (that's what divaserve.php does)
                zoomLevel = 0;
            }

            // Set the total number of pages
            $(settings.selector + 'current label').text(settings.numPages);

            $(settings.selector + 'goto-page-fullscreen input').attr('placeholder', settings.numPages);

            if (settings.enableAutoTitle) {
                $(settings.elementSelector).prepend('<div id="' + settings.ID + 'title">' + settings.itemTitle + '</div>');
            }

            // Now check that p is in range - only if using the filename is disabled
            var pParam = parseInt($.getHashParam('p' + settings.hashParamSuffix), 10);
            if (!settings.enableFilename && pageInRange(pParam)) {
                settings.goDirectlyTo = pParam;
            }

            // Otherwise, if filename is enabled, look at the i parameter
            var iParam = $.getHashParam('i' + settings.hashParamSuffix);
            var iParamPage = getPageIndex(iParam);
            if (settings.enableFilename && iParamPage >= 0) {
                settings.goDirectlyTo = iParamPage;
            }
        };

        // Check if a row (in grid view) has been appended already
        var isRowLoaded = function(rowIndex) {
            if ($(settings.selector + 'row-' + rowIndex).length > 0) {
                return true;
            } else {
                return false;
            }
        };

        // Check if a row should be visible in the viewport
        var isRowVisible = function(rowIndex) {
            // Calculate the top and bottom, then call verticallyInViewport
            var topOfRow = settings.rowHeight * rowIndex;
            var bottomOfRow = topOfRow + settings.rowHeight + settings.fixedPadding;
            return verticallyInViewport(topOfRow, bottomOfRow);
        };

        var loadRow = function(rowIndex) {
            if (isRowLoaded(rowIndex)) {
                return;
            }

            var i;
            var heightFromTop = (settings.rowHeight) * rowIndex + settings.fixedPadding;
            var stringBuilder = [];
            stringBuilder.push('<div id="' + settings.ID + 'row-' + rowIndex + '" style="width: 100%; height: ' + settings.rowHeight + '; position: absolute; top: ' + heightFromTop + 'px;">');

            // Load each page within that row
            for (i = 0; i < settings.pagesPerRow; i++) {
                // Figure out the actual page number
                var pageIndex = rowIndex * settings.pagesPerRow + i;

                if (!pageInRange(pageIndex)) {
                    break; // when we're at the last page etc
                }
                
                var filename = settings.pages[pageIndex].fn;
                var pageWidth = (settings.fixedHeightGrid) ? (settings.rowHeight - settings.fixedPadding) * settings.pages[pageIndex].w / settings.pages[pageIndex].h : settings.gridPageWidth;
                var pageHeight = (settings.fixedHeightGrid) ? settings.rowHeight - settings.fixedPadding : pageWidth / settings.pages[pageIndex].w * settings.pages[pageIndex].h;
                var leftOffset = parseInt(i * (settings.fixedPadding + settings.gridPageWidth) + settings.fixedPadding, 10);

                // Make sure they're all integers for nice, round numbers
                pageWidth = parseInt(pageWidth, 10);
                pageHeight = parseInt(pageHeight, 10);

                // Center the page if the height is fixed
                leftOffset += (settings.fixedHeightGrid) ? (settings.gridPageWidth - pageWidth) / 2 : 0;

                /* For some reason, IIP returns an image that is always 1px less wide than specified, so this (i.e. specifying an image one pixel wider than the one you want) is the workaround. It means some images are cut off a bit vertically; still, it looks better than a white border along the bottom and right edges (although that border remains at higher zooms ... blame IIP */
                // + 2 pixels seems to work better at the default n for some reason
                var imgSrc = settings.iipServerBaseUrl + filename + '&amp;HEI=' + (pageHeight + 2) + '&amp;CVT=JPG';
                stringBuilder.push('<div id="' + settings.ID + 'page-' + pageIndex + '" class="diva-page" style="width: ' + pageWidth + 'px; height: ' + pageHeight + 'px; left: ' + leftOffset + 'px; display: inline;"><div style="position: absolute; background-image: url(\'' + imgSrc  + '\'); background-repeat: no-repeat; width: ' + pageWidth + 'px; height: ' + pageHeight + 'px;"></div></div>');
            }

            // Append, using an array as a string builder instead of string concatenation
            $(settings.innerSelector).append(stringBuilder.join(''));
        };

        var loadGrid = function() {
            // Ignore the zoom level if it's in a grid
            // As for page number, try to get the row containing that grid near the middle
            // Uses zoom level = 0 as the grid? smallest numbers etc
            ajaxRequest(0, function(data) {
                // Create the grid slider here
                if (settings.enableGridSlider) {
                    createGridSlider();
                }

                // Now go through the pages
                var horizontalPadding = settings.fixedPadding * (settings.pagesPerRow + 1);
                var pageWidth = (settings.panelWidth - horizontalPadding) / settings.pagesPerRow;
                settings.gridPageWidth = pageWidth;

                // Calculate the row height depending on whether we want to fix the width or the height
                settings.rowHeight = (settings.fixedHeightGrid) ? settings.fixedPadding + data.dims.min_ratio * pageWidth : settings.fixedPadding + data.dims.max_ratio * pageWidth;
                settings.numRows = Math.ceil(settings.numPages / settings.pagesPerRow);
                settings.totalHeight = settings.numRows * settings.rowHeight + settings.fixedPadding;
                $(settings.innerSelector).css('height', Math.round(settings.totalHeight));
                $(settings.innerSelector).css('width', Math.round(settings.panelWidth));

                // First scroll directly to the row containing the current page
                gridScroll();

                settings.scrollSoFar = $(settings.outerSelector).scrollTop();

                // Figure out the row each page is in
                for (var i = 0; i < settings.numPages; i += settings.pagesPerRow) {
                    var rowIndex = Math.floor(i / settings.pagesPerRow);

                    if (isRowVisible(rowIndex)) {
                        settings.firstRowLoaded = (settings.firstRowLoaded < 0) ? rowIndex : settings.firstRowLoaded;
                        loadRow(rowIndex);
                        settings.lastRowLoaded = rowIndex;
                    }
                }
            });
        };

        // When changing between grid/document view, or fullscreen toggling, or zooming
        var clearDocument = function() {
            $(settings.outerSelector).scrollTop(0);
            settings.scrollSoFar = 0; // important - for issue 26
            $(settings.innerSelector).text('');
            settings.firstPageLoaded = 0;
            settings.firstRowLoaded = -1;
        };
        
        // AJAX request to start the whole process - called upon page load and upon zoom change
        var loadDocument = function(zoomLevel) {
            ajaxRequest(zoomLevel, function(data) {
                // If the desired initial zoom > max zoom, set to 0 (in accordance with divaserve.php)
                if (zoomLevel > data.max_zoom) {
                    zoomLevel = 0;
                }

                // Calculate the horizontal and vertical inter-page padding
                if (settings.adaptivePadding > 0) {
                    settings.horizontalPadding = data.dims.a_wid * settings.adaptivePadding;
                    settings.verticalPadding = data.dims.a_hei * settings.adaptivePadding;
                } else {
                    // It's less than or equal to 0; use fixedPadding instead
                    settings.horizontalPadding = settings.fixedPadding;
                    settings.verticalPadding = settings.fixedPadding;
                }

                // Now reset some things that need to be changed after each zoom
                settings.totalHeight = data.dims.t_hei + settings.verticalPadding * (settings.numPages + 1); 
                settings.zoomLevel = zoomLevel;
                settings.dimAfterZoom = settings.totalHeight; 

                // Create the zoom slider at this point, if desired
                if (settings.enableZoomSlider) {
                    createZoomSlider();
                }

                // Needed to set settings.heightAbovePages - initially just the top padding
                var heightSoFar = 0;
                for (var i = 0; i < settings.numPages; i++) {                 
                    // First set the height above that page by adding this height to the previous total
                    // A page includes the padding above it
                    settings.heightAbovePages[i] = heightSoFar;

                    // Has to be done this way otherwise you get the height of the page included too
                    heightSoFar = settings.heightAbovePages[i] + settings.pages[i].h + settings.verticalPadding;

                    // Now try to load the page ONLY if the page needs to be loaded
                    // Take scrolling into account later, just try this for now
                    if (isPageVisible(i)) {
                        loadPage(i);
                        settings.lastPageLoaded = i;
                    }
                }
                    
                // Set the height and width of documentpane (necessary for dragscrollable)
                $(settings.innerSelector).css('height', Math.round(settings.totalHeight));
                var widthToSet = (data.dims.max_w + settings.horizontalPadding * 2 < settings.panelWidth ) ? settings.panelWidth : data.dims.max_w + settings.horizontalPadding * 2; // width of page + 40 pixels on each side if necessary
                $(settings.innerSelector).css('width', Math.round(widthToSet));

                // Scroll to the proper place
                documentScroll();

                // Now execute the zoom callback functions (if it's not the initial load)
                // No longer gets executed when leaving or entering fullscreen mode
                if (!settings.firstAjaxRequest) {
                    if (settings.dimBeforeZoom !== settings.dimAfterZoom) {
                        $.executeCallback(settings.onZoom, zoomLevel);

                        // Execute the zoom in/out callback functions if set
                        if (settings.dimBeforeZoom > settings.dimAfterZoom) {
                            // Zooming out
                            $.executeCallback(settings.onZoomOut, zoomLevel);

                            // Execute the one-time callback, too, if present
                            $.executeCallback(settings.zoomOutCallback, zoomLevel);
                            settings.zoomOutCallback = null;
                        } else {
                            // Zooming in
                            $.executeCallback(settings.onZoomIn, zoomLevel);
                            $.executeCallback(settings.zoomInCallback, zoomLevel);
                            settings.zoomInCallback = null;
                        }
                    } else {
                        // Switching between fullscreen mode
                        $.executeCallback(settings.onFullscreen, zoomLevel);
                    }
                } else {
                    // The document viewer has loaded, execute onReady
                    $.executeCallback(settings.onReady);
                }

                // For use in the next ajax request (zoom change)
                settings.dimBeforeZoom = settings.dimAfterZoom;

                // For the iPad - wait until this request finishes before accepting others
                if (settings.scaleWait) {
                    settings.scaleWait = false;
                }
            });
        };
        
        // Called whenever there is a scroll event in the document panel (the #diva-outer element)
        var handleScroll = function() {
            settings.scrollSoFar = $(settings.outerSelector).scrollTop();
            adjustPages(settings.scrollSoFar - settings.prevVptTop);
            settings.prevVptTop = settings.scrollSoFar;
        };

        var handleGridScroll = function() {
            settings.scrollSoFar = $(settings.outerSelector).scrollTop();
            adjustRows(settings.scrollSoFar - settings.prevVptTop);
            settings.prevVptTop = settings.scrollSoFar;
        };

        // Handles zooming - called after pinch-zoom, changing the slider, or double-clicking
        var handleZoom = function(zoomLevel) {
            // First make sure that this is an actual zoom request
            if (settings.zoomLevel != zoomLevel && zoomLevel >= settings.minZoomLevel && zoomLevel <= settings.maxZoomLevel) {
                // Now do an ajax request with the new zoom level
                loadDocument(zoomLevel);

                // Make the slider display the new value (it may already)
                $(settings.selector + 'zoom-slider').slider({
                    value: zoomLevel
                });

                return true;
            } else {
                // Execute the callback functions anyway (required for the unit testing)
                $.executeCallback(settings.zoomInCallback, settings.zoomLevel);
                $.executeCallback(settings.zoomOutCallback, settings.zoomLevel);

                // Set them to null so we don't try to call it again
                settings.zoomOutCallback = null;
                settings.zoomInCallback = null;
                return false;
            }
        };

        // Called whenever the zoom slider is moved
        var handleZoomSlide = function(zoomLevel) {
            // First get the vertical offset (vertical scroll so far)
            settings.verticalOffset = $(settings.outerSelector).scrollTop();
            settings.horizontalOffset = $(settings.outerSelector).scrollLeft();

            // If we're in grid mode, leave it
            if (settings.inGrid) {
                // Don't call loadDocument() in leaveGrid() otherwise it loads twice
                leaveGrid(true);
            }
            
            // Let handleZoom handle zooming
            settings.doubleClick = false;
            handleZoom(zoomLevel);
        };

        // Private function for going to a page
        var gotoPage = function(pageNumber, verticalOffset, horizontalOffset) {
            if (!verticalOffset) {
                var verticalOffset = 1; // i don't know why but this makes things work
            }

            if (!horizontalOffset) {
                var horizontalOffset = 0;
            }

            // If we're in grid view, find out the row number that is
            if (settings.inGrid) {
                var rowIndex = Math.ceil(pageNumber / settings.pagesPerRow) - 1;

                if (rowInRange(rowIndex)) {
                    var heightToScroll = rowIndex * settings.rowHeight;
                    $(settings.outerSelector).scrollTop(heightToScroll);

                    // Update the "currently on page" thing here as well
                    updateCurrentPage(pageNumber - 1);
                    settings.currentPageIndex = pageNumber - 1;
                    return true;
                }
            } else {
                // Since we start indexing from 0, subtract 1 to behave as the user expects
                pageIndex = pageNumber - 1;
    
                // First make sure that the page number exists (i.e. is in range)
                if (pageInRange(pageIndex)) {
                    var heightToScroll = settings.heightAbovePages[pageIndex] + verticalOffset;
    
                    // Change the "currently on page" thing
                    updateCurrentPage(pageIndex);
                    $(settings.outerSelector).scrollTop(heightToScroll);

                    // Now figure out the horizontal scroll - scroll to the MIDDLE
                    // Or, scroll to the horizontal offset if set
                    var horizontalScroll = (horizontalOffset > 0) ? horizontalOffset : ($(settings.innerSelector).width() - settings.panelWidth) / 2;
                    $(settings.outerSelector).scrollLeft(horizontalScroll);
    
                    // Now execute the callback function, pass it the page NUMBER not the page index
                    $.executeCallback(settings.onJump, pageNumber);

                    return true; // To signify that we can scroll to this page
                }
            }
            return false;
        };
        
        // Handles the double click event, put in a new function for better codeflow
        var handleDoubleClick = function(event) {
            // If the zoom level is already at max, zoom out
            var newZoomLevel;
            if (settings.zoomLevel === settings.maxZoomLevel) {
                if (event.ctrlKey || settings.ctrlKey) {
                    newZoomLevel = settings.zoomLevel - 1;
                } else {
                    return;
                }
            } else if (settings.zoomLevel === settings.minZoomLevel) {
                if (event.ctrlKey || settings.ctrlKey) {
                    return;
                } else {
                    newZoomLevel = settings.zoomLevel + 1;
                }
            } else {
                if (event.ctrlKey || settings.ctrlKey) {
                    newZoomLevel = settings.zoomLevel - 1;
                } else {
                    newZoomLevel = settings.zoomLevel + 1;
                }
            }

            // Needed for zooming out in Firefox on Mac
            settings.numClicks = 0;
            // Set centerX and centerY for scrolling in after zoom
            // Need to use this.offsetLeft and this.offsetTop to get it relative to the edge of the document
            settings.centerX = (event.pageX - settings.viewerXOffset) + $(settings.outerSelector).scrollLeft();
            settings.centerY = (event.pageY - settings.viewerYOffset) + $(settings.outerSelector).scrollTop();

            // Set doubleClick to true, so we know where to zoom
            settings.doubleClick = true;
            
            // Zoom
            handleZoom(newZoomLevel);
        };

        // Bound to an event handler if iStuff detected; prevents window dragging
        var blockMove = function(event) {
            event.preventDefault();
        };

        // Allows pinch-zooming for iStuff
        var scale = function(event) {
            var newZoomLevel = settings.zoomLevel;

            // First figure out the new zoom level:
            if (event.scale > 1 && newZoomLevel < settings.maxZoomLevel) {
                newZoomLevel++;
            } else if (event.scale < 1 && newZoomLevel > settings.minZoomLevel) {
                newZoomLevel--;
            } else {
                return;
            }

            // Set it to true so we have to wait for this one to finish
            settings.scaleWait = true;

            // Has to call handleZoomSlide so that the coordinates are kept
            handleZoomSlide(newZoomLevel);
        };

        var toggleFullscreen = function() {
            // First store the offsets so the user stays in the same place
            settings.verticalOffset = $(settings.outerSelector).scrollTop();
            settings.horizontalOffset = $(settings.outerSelector).scrollLeft();
            settings.doubleClick = false;

            // Empty the viewer so we don't get weird jostling
            $(settings.innerSelector).text('');

            // If we're already in fullscreen mode, leave it
            if (settings.inFullscreen) {
                leaveFullscreen();
            } else {
                enterFullscreen();
            }

            // Recalculate height and width
            settings.panelWidth = parseInt($(settings.outerSelector).width(), 10) - settings.scrollbarWidth;
            settings.panelHeight = parseInt($(settings.outerSelector).height(), 10);

            // Change the width of the inner div correspondingly
            $(settings.innerSelector).width(settings.panelWidth);

            // Do another AJAX request to fix the padding and so on
            if (settings.inGrid) {
                loadGrid();
            } else {
                loadDocument(settings.zoomLevel);
            }
        };

        // Handles entering fullscreen mode
        var enterFullscreen = function() {
            if (settings.fullscreenStatusbar === null) {
                createFullscreenStatusbar('none');
            }

            // Change the styling of the fullscreen icon - two viewers on a page won't work otherwise
            $(settings.selector + 'fullscreen').css('position', 'fixed').css('z-index', '9001');

            $(settings.outerSelector).addClass('fullscreen');
            settings.inFullscreen = true;

            // Hide the body scrollbar
            $('body').css('overflow', 'hidden');

            // Execute the callback
            $.executeCallback(settings.onFullscreenEnter);

            // Listen to window resize events
            var resizeTimer;
            $(window).resize(function() {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(function() {
                    settings.panelHeight = parseInt($(settings.outerSelector).height(), 10);
                    settings.panelWidth = parseInt($(settings.outerSelector).width(), 10);

                    // It should simulate scrolling down since it only matters if the page gets bigger
                    adjustPages(1);
                }, 10);
            });
        };

        // Handles leaving fullscreen mode
        var leaveFullscreen = function() {
            // Remove the status bar
            if (settings.fullscreenStatusbar !== null) {
                // In case animation has been set to fade
                settings.fullscreenStatusbar.pnotify({
                    pnotify_animation: 'none'
                });

                settings.fullscreenStatusbar.pnotify_remove();
                settings.fullscreenStatusbar = null;
            }

            $(settings.outerSelector).removeClass('fullscreen');
            settings.inFullscreen = false;

            // Return the body scrollbar and the fullscreen icon to their original places
            $(settings.selector + 'fullscreen').css('position', 'absolute').css('z-index', '8999');

            // Execute the callback
            $.executeCallback(settings.onFullscreenExit);
        };

        // Toggle, enter and leave grid mode functions akin to those for fullscreen
        var toggleGrid = function() {
            // Already in grid, leave it
            if (settings.inGrid) {
                leaveGrid();
            } else {
                // Enter grid view
                enterGrid();
            }

            // May need to be moved later ... callback is executed first, before grid view has finished loading
            $.executeCallback(settings.onGrid);
        };

        var enterGrid = function() {
            // Store the x and y offsets
            settings.desiredXOffset = getXOffset();
            settings.desiredYOffset = getYOffset();
            settings.inGrid = true;
            // Hide the left and right panels
            $('#search-pane').hide();
            $('#context-pane').hide();
            // Make the document panel take up the whole page
            $('#document-pane').css('left', '0px').css('right', '0px');
            resizePanels();
            loadGrid();
        };

        var leaveGrid = function(preventLoad) {
            // Bring the left and right panels back
            $('#document-pane').css('left', $('#search-pane').width() + 1).css('right', $('#context-pane').width() + 1);
            $('#search-pane').show(); // doesn't need inline-block for some reason
            $('#context-pane').show(); // needs inline-block to show up
            resizePanels();
            // Save the grid top offset
            settings.gridScrollTop = $(settings.outerSelector).scrollTop();
            settings.inGrid = false;

            // Jump to the "current page" if double-click wasn't used
            if (settings.goDirectlyTo < 0 ) {
                settings.goDirectlyTo = settings.currentPageIndex;
                //settings.desiredYOffset = getYOffset();
                //settings.desiredXOffset = getXOffset();
            }

            // preventLoad is only true when the zoom slider is used
            if (!preventLoad) {
                loadDocument(settings.zoomLevel);
            }
        };

        var folioToTiff = function(folio) {
            // Converts 003r -> 1-003.tif
            // 23r --> 1-023r.tif
            // A19v -> 2-019.tif
            // A1r --> 2-001.tif
            var pagePrefix;
            if (folio[0].toUpperCase() == "A") {
                pagePrefix = "2-";
                folio = folio.substring(1);
            } else {
                pagePrefix = "1-";
            }

            while (folio.length < 4) {
                folio = '0' + folio;
            }
            return pagePrefix + folio + '.tif';
        };

        var highlightNextResult = function(currentResult) {
            $('#search-results div').removeClass('active');
            $(currentResult).addClass('active');
            var folio = $(currentResult).attr('data-folio');
            var incipitID = $(currentResult).attr('data-incipit');
            // Make the relevant incipit automatically open when this result is clicked
            if (settings.openIncipits.indexOf(incipitID) < 0) {
                settings.openIncipits.push(incipitID);
            }
            var pageIndex = getPageIndex(folioToTiff(folio));
            gotoPage(pageIndex+1);
        };

        // Returns stuff to append
        var getSearchResults = function(data) {
            var toAppend = '';
            var numItems = data.length;
            for (var i = 0; i < numItems; i++) {
                var standardText = "";
                var feastName = ("feastname" in data[i].hl) ? data[i].hl.feastname[0] : data[i].feastname;
                var feastNameEng = ("feastnameeng" in data[i].hl) ? data[i].hl.feastnameeng[0] : data[i].feastnameeng;
                var office = ("office" in data[i].hl) ? data[i].hl.office[0] : data[i].office;
                var genre = ("genre" in data[i].hl) ? data[i].hl.genre[0] : data[i].genre;
                var position = ("position" in data[i].hl) ? data[i].hl.position[0] : data[i].position;
                var desc = " (" + genre + ", " + office + ", " + feastNameEng + ")";

                if ("feastname" in data[i].hl) {
                    standardText = data[i].incipit + " (" + genre + ", " + office + ", " + feastName + ")";
                } else if ("feastnameeng" in data[i].hl) {
                    standardText = data[i].incipit + desc;
                } else if ("fullstandardtext" in data[i].hl) {
                    standardText = data[i].hl.fullstandardtext[0] + " (" /*+ data[i].office + ", " */ + feastNameEng + ")";
                } else if ("fullmanuscripttext" in data[i].hl) {
                    standardText = data[i].hl.fullmanuscripttext[0]+ " ("/* + data[i].office + ", "*/ + feastNameEng + ")";
                } else if ("caonumber" in data[i].hl) {
                    standardText = data[i].incipit + " (" + data[i].hl.caonumber[0] + ")";
                } else if ("position" in data[i].hl) {
                    standardText = data[i].incipit + " (" + position + ", " + office + ", " + feastNameEng + ")";
                } else if ("office" in data[i].hl || "genre" in data[i].hl || "mode" in data[i].hl) {
                    standardText = data[i].incipit + desc;
                } else {
                    standardText = data[i].incipit;
                }
                var folio = data[i].folio;
                tifName = folioToTiff(folio);
                var backgroundImage = settings.iipServerBaseUrl + tifName + '&WID=40&CVT=JPG';
                toAppend += '<div class="result" style="background-image: url(' + backgroundImage + ');" data-folio="' + folio + '" data-incipit="' + data[i].id + '">' + folio + ': ' + standardText + '</div>';
            }
            return toAppend;
        };

        // Handles all the events
        var handleEvents = function() {
            // Handle the search form submission
            $('#search-box form').submit(function() {
                var query = $('#search-box input').val();
                // Save it ...
                settings.query = query;
                var ajaxURL = settings.appRoot + '/search?q=' + query;
                $('#search-results').text(''); // clear the pane first
                $.getJSON(ajaxURL + '&rows=20', function(data) {
                    var resultInfo = '<p class="result-info">';
                    resultInfo += (data.numFound == 0) ? 'There are no search results.' : 'Found <strong>' + data.numFound + '</strong> results.';
                    resultInfo += '</p>';

                    // Filler box to pad the length of the box so that it doesn't change after query #2
                    var fillerBox = '';
                    if (data.numFound > 20) {
                        var fillerHeight = (data.numFound - 20) * 96; // the height of the box
                        fillerBox += '<div id="search-filler" style="width: 100%; height: ' + fillerHeight + 'px"><p class="result-info">Loading more results ...</p></div>';
                    }

                    var searchResults = data.results;
                    $('#search-results').html(resultInfo + getSearchResults(searchResults) + fillerBox);
                    $('#clear-results').show();
                    $('#search-results div').click(function() {
                        highlightNextResult(this);
                    });
                    // Send off another request to fetch more results
                    $.getJSON(ajaxURL + '&start=20&rows=all', function(data) {
                        if (data.results.length > 0) {
                            $('#search-filler').replaceWith(getSearchResults(data.results));
                        }
                        $('#search-results div').click(function() {
                            highlightNextResult(this); // needs to be handled better
                        });
                    });
                });
                return false;
            });

            // Handler for the clear results button
            $('#clear-results').click(function() {
                $(this).fadeOut(50);
                $('#search-box input').val('');
                // Clear the search results pane too
                $('#search-results').text('');
            });

            // Handler for the back and forward buttons
            $('#back-icon, #forward-icon').click(function() {
                var currentlyActive = $('#search-results .active');
                if (currentlyActive.length) {
                    var toHighlight = $(currentlyActive[0]);
                    if ($(this).attr('id') == 'forward-icon') {
                        toHighlight = toHighlight.next();
                    } else {
                        toHighlight = toHighlight.prev();
                    }

                    // If there's no next/previous, do nothing
                    if (toHighlight.length && toHighlight[0].tagName == 'DIV') {
                        highlightNextResult(toHighlight);
                    }
                } else {
                    // Nothing is highlighted - select the first (if it exists)
                    var searchResults = $('#search-results div');
                    if (searchResults.length) {
                        highlightNextResult(searchResults[0]);
                    }
                }
            });
            // Handle the grid toggle events
            if (settings.enableGrid) {
                // silly
                $('#grid-icon').click(function() {
                    if (!settings.inGrid) {
                        toggleGrid();
                    }
                });
                $('#document-icon').click(function() {
                    if (settings.inGrid) {
                        toggleGrid();
                    }
                });
            }

            // Create the fullscreen toggle icon if fullscreen is enabled
            if (settings.enableFullscreen) {
                // Event handler for fullscreen toggling
                $(settings.selector + 'fullscreen').click(function() {
                    toggleFullscreen();
                });
            }

            // Change the cursor for dragging
            $(settings.innerSelector).mouseover(function() {
                $(this).removeClass('grabbing').addClass('grab');
            });
            
            $(settings.innerSelector).mouseout(function() {
                $(this).removeClass('grab');
            });
            
            $(settings.innerSelector).mousedown(function() {
                $(this).removeClass('grab').addClass('grabbing');
            });
            
            $(settings.innerSelector).mouseup(function() {
                $(this).removeClass('grabbing').addClass('grab');
            });

            
            // Set drag scroll on first descendant of class dragger on both selected elements
            $(settings.outerSelector + ', ' + settings.innerSelector).dragscrollable({dragSelector: '.dragger', acceptPropagatedEvent: true});

            // Handle the scroll
            $(settings.outerSelector).scroll(function() {
                // Has to be within this otherwise settings.inGrid is checked ONCE
                if (settings.inGrid) {
                    handleGridScroll();
                } else {
                    handleScroll();
                }
            });

            // Prevent the context menu within the outerdrag IF it was triggered with the ctrl key
            $(settings.outerSelector).bind("contextmenu", function(event) {
                var e = event.originalEvent;
                if (e.ctrlKey) {
                    settings.ctrlKey = true;
                    settings.numClicks++;
                    if (settings.numClicks > 1) {
                        handleDoubleClick(event);
                        settings.numClicks = 0;
                    }
                    e.preventDefault();
                    e.stopPropagation();
                    settings.ctrlKey = false;
                }
            });
                
            // Double-click to zoom
            $(settings.outerSelector).dblclick(function(event) {
                // First set the x and y offsets of the viewer from the edge of document
                settings.viewerXOffset = $(this).offset().left;
                settings.viewerYOffset = $(this).offset().top;

                if (settings.inGrid) {
                    // Figure out the page that was clicked, scroll to that page
                    var centerX = (event.pageX - settings.viewerXOffset) + $(settings.outerSelector).scrollLeft();
                    var centerY = (event.pageY - settings.viewerYOffset) + $(settings.outerSelector).scrollTop();
                    var rowIndex = Math.floor(centerY / settings.rowHeight);
                    var colIndex = Math.floor(centerX / (settings.panelWidth / settings.pagesPerRow));
                    var pageIndex = rowIndex * settings.pagesPerRow + colIndex;
                    // Double clicking --> going to a different page, so clear the x/y offsets
                    settings.desiredXOffset = 0;
                    settings.desiredYOffset = 0;
                    settings.goDirectlyTo = pageIndex;
                    leaveGrid();
                } else {
                    handleDoubleClick(event);
                }
            });

            // Check if the user is on a iPhone or iPod touch or iPad
            if (settings.mobileSafari) {
                // One-finger scroll within outerdrag
                $(settings.outerSelector).oneFingerScroll();

                // Prevent resizing (below from http://matt.might.net/articles/how-to-native-iphone-ipad-apps-in-javascript/)
                var toAppend = [];
                toAppend.push('<meta name="viewport" content="user-scalable=no, width=device-width" />');

                // Eliminate URL and button bars if added to home screen
                toAppend.push('<meta name="apple-mobile-web-app-capable" content="yes" />');

                // Choose how to handle the phone status bar
                toAppend.push('<meta name="apple-mobile-web-app-status-bar-style" content="black" />');
                $('head').append(toAppend.join('\n'));

                // Block the user from moving the window
                $('body').bind('touchmove', function(event) {
                    var e = event.originalEvent;
                    blockMove(e);
                });

                // Allow pinch-zooming
                // If originally in grid view, go to document view with the lowest zoom
                $('body').bind('gestureend', function(event) {
                    var e = event.originalEvent;
                    if (!settings.scaleWait) {
                        if (settings.inGrid) {
                            leaveGrid();
                        } else {
                            scale(e);
                        }
                    }
                    return false;
                });

            }

            // Only check if either scrollBySpace or scrollByKeys is enabled
            if (settings.enableSpaceScroll || settings.enableKeyScroll) {
                var spaceKey = $.ui.keyCode.SPACE;
                var pageUpKey = $.ui.keyCode.PAGE_UP;
                var pageDownKey = $.ui.keyCode.PAGE_DOWN;
                var homeKey = $.ui.keyCode.HOME;
                var endKey = $.ui.keyCode.END;

                // Catch the key presses in document
                $(document).keydown(function(event) {
                    // Space or page down - go to the next page
                    if ((settings.enableSpaceScroll && event.keyCode == spaceKey) || (settings.enableKeyScroll && event.keyCode == pageDownKey)) {
                        $(settings.outerSelector).scrollTop(settings.scrollSoFar + settings.panelHeight);
                        return false;
                    }

                    // Page up - go to the previous page
                    if (settings.enableKeyScroll && event.keyCode == pageUpKey) {
                        $(settings.outerSelector).scrollTop(settings.scrollSoFar - settings.panelHeight);
                        return false;
                    }

                    // Home key - go to the beginning of the document
                    if (settings.enableKeyScroll && event.keyCode == homeKey) {
                        $(settings.outerSelector).scrollTop(0);
                        return false;
                    }

                    // End key - go to the end of the document
                    if (settings.enableKeyScroll && event.keyCode == endKey) {
                        $(settings.outerSelector).scrollTop(settings.totalHeight);
                        return false;
                    }
                });

            }
            var resizeTimer;
            $(window).resize(function() {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(function() {
                    resizePanels();
                    // Simulate scrolling down
                    adjustPages(1);
                }, 10);
            });
            $("#select-feast select").change(function(data) {
                var folio = $(data.target).val();
                var desiredPage = getPageIndex(folioToTiff(folio)) + 1;
                gotoPage(desiredPage);
            });
        };

        // Create a fullscreen statusbar thing - if it doesn't exist
        var createFullscreenStatusbar = function(animation) {
            // If grid view is enabled, put the icon in there
            var gridIcon = (settings.enableGrid) ? '<div id="' + settings.ID + 'grid-icon-fullscreen"></div>' : '';
            var options = { 
                pnotify_text: '<form id="' + settings.ID + 'goto-page-fullscreen"><input placeholder="' + settings.numPages + '" type="text" size="4" id="' + settings.ID + 'goto-input-fullscreen" /><input type="submit" value="Go"></form><div id="' + settings.ID + 'tools-fullscreen" style="height: 60px;"></div><div id="' + settings.ID + 'link-fullscreen"><a href="">Link</a></div>',
                pnotify_title: gridIcon + 'Page: <span id="' + settings.ID + 'page-number-fullscreen">' + (settings.currentPageIndex + 1) + '</span>',
                pnotify_history: false,
                pnotify_width: '160px',
                pnotify_hide: false,
                pnotify_notice_icon: '',
                pnotify_animation: animation, // Can be 'none' or 'fade' depending on what calls it
                pnotify_before_close: function() {
                    settings.fullscreenStatusbar = null;
                }
            };

            settings.fullscreenStatusbar = $.pnotify(options);

            // Handle clicking of the link thing
            $(settings.selector + 'link-fullscreen a').click(function() {
                $('body').prepend('<div id="' + settings.ID + 'link-popup-fullscreen"><input id="' + settings.ID + 'link-popup-input-fullscreen" class="diva-input" value="' + getCurrentURL() + '" /></div>');
                var offset = $('div.ui-pnotify').offset(); // offset of the statusbar (pnotify div)
                $(settings.selector + 'link-popup-fullscreen').css('left', offset.left + 'px').css('top', (offset.top + $('div.ui-pnotify').height() + 5) + 'px');

                // Catch onmouseup events outside of this div
                $('body').mouseup(function(event) {
                    var targetID = event.target.id;
                    if (targetID !== settings.ID + 'link-popup-fullscreen' && targetID !== settings.ID + 'link-popup-input-fullscreen') {
                        $(settings.selector + 'link-popup-fullscreen').remove();
                    }
                });

                // Also delete it upon scroll and page up/down key events
                $(settings.outerSelector).scroll(function() {
                    $(settings.selector + 'link-popup-fullscreen').remove();
                });
                return false;
            });

            $(settings.selector + 'grid-icon-fullscreen').click(function() {
                toggleGrid();
            });

            // Create the relevant slider
            if (settings.inGrid && settings.enableGridSlider) {
                createGridSlider();
            } else if (settings.enableZoomSlider) {
                createZoomSlider();
            }

            // Handle clicking, a bit redundant but better than using live(), maybe
            $(settings.selector + 'goto-page-fullscreen').submit(function() {
                var desiredPage = parseInt($(settings.selector + 'goto-input-fullscreen').val(), 10);

                if (!gotoPage(desiredPage)) {
                    alert("Invalid page number");
                }

                return false;
            });
        };

        // Creates a zoomer using the min and max zoom levels specified ... PRIVATE, only if zoomSlider = true
        var createZoomSlider = function() {
            // This whole thing can definitely be optimised
            $(settings.selector + 'slider').remove();
            $(settings.selector + 'slider-label').remove();

            $('#slider').prepend('<div id="' + settings.ID + 'slider"></div>');
            $(settings.selector + 'slider').slider({
                value: settings.zoomLevel,
                min: settings.minZoomLevel,
                max: settings.maxZoomLevel,
                step: 1,
                slide: function(event, ui) {
                    handleZoomSlide(ui.value);
                }
            });
        };

        // Creates a slider for controlling the number of pages per grid row
        var createGridSlider = function() {
            $(settings.selector + 'slider').remove();
            $(settings.selector + 'slider-label').remove();

            $('#slider').prepend('<div id="' + settings.ID + 'slider"></div>');
            $(settings.selector + 'slider').slider({
                value: settings.pagesPerRow,
                min: settings.minPagesPerRow,
                max: settings.maxPagesPerRow,
                step: 1,
                slide: function(event, ui) {
                    handleGridSlide(ui.value);
                }
            });
        };

        var handleGridSlide = function(newPagesPerRow) {
            settings.pagesPerRow = newPagesPerRow;
            enterGrid();
        };

        /*var createGridIcon = function() {
            $(settings.selector + 'tools').prepend('<div id="' + settings.ID + 'grid-icon"></div>');
        };*/
        
        // Creates the "go to page" box
        var createGotoPage = function() {
            // Handle the prev/next page buttons
            $('#previous-icon').click(function() {
                // Pass it the page index which is page number -1
                gotoPage(settings.currentPageIndex);
            });
            $('#next-icon').click(function() {
                gotoPage(settings.currentPageIndex+2);
            });
            $('#link-icon').click(function() {
                $('#wrap').prepend('<div id="link-popup"><input id="link-popup-input" type="text" value="'+ getCurrentURL() + '"/></div>');

                // Catch onmouseup events outside of this div
                $('#wrap').mouseup(function(event) {
                    var targetID = event.target.id;
                    if (targetID == 'link-popup' || targetID == 'link-popup-input') {
                        $('#link-popup-input').select();
                    } else {
                        $('#link-popup').remove();
                    }
                });
                // Also delete it upon scroll and page up/down key events
                $(settings.outerSelector).scroll(function() {
                    $(settings.selector + 'link-popup').remove();
                });
                return false;
            });
            
            $('#diva-goto-page').submit(function() {
                var desiredPage, folioNumber, numChars, isAppendix, prefix;
                var input = $('#diva-goto-page input').val();
                var lastChar = input.charAt(input.length - 1);

                // If the last character is an or a v, assume a folio number
                if (lastChar == 'r' || lastChar == 'v') {
                    desiredPage = getPageIndex(folioToTiff(input)) + 1;
                } else {
                    desiredPage = parseInt(input, 10);
                }

                if (!gotoPage(desiredPage)) {
                    alert("Invalid page number");
                }

                return false;
            });
        };

        // Returns the page index associated with the given filename; must called after settings settings.pages
        var getPageIndex = function(filename) {
            for (var i = 0; i < settings.numPages; i++) {
                if (settings.pages[i].fn == filename) {
                    return i;
                }
            }

            return -1;
        };

        var getYOffset = function() {
            var yScroll = $(settings.outerSelector).scrollTop();
            var topOfPage = settings.heightAbovePages[settings.currentPageIndex];

            return parseInt(yScroll - topOfPage, 10);
        };

        var getXOffset = function() {
            return $(settings.outerSelector).scrollLeft(); // already is an integer
        };

        var getState = function() {
            var state = {
                //'f': settings.inFullscreen,
                'g': settings.inGrid,
                'z': settings.zoomLevel,
                'n': settings.pagesPerRow,
                'i': settings.currentPageIndex, // page index, only used when not in grid
                'y': (settings.inGrid) ? settings.documentLeftScroll : getYOffset(),
                'x': (settings.inGrid) ? settings.documentLeftScroll : getXOffset(),
                'gy': (settings.inGrid) ? $(settings.outerSelector).scrollTop() : settings.gridScrollTop,
                'q': settings.query,
                'r': settings.resultNumber // 1-indexed
            }

            return state;
        };

        var getURLHash = function() {
            var hashParams = getState();
            var i = hashParams.i; // current page index
            hashParams.i = (settings.enableFilename) ? settings.pages[i].fn : i + 1; // make it the filename if desired, else the page number
            var hashStringBuilder = [];
            for (var param in hashParams) {
                if (hashParams[param]) { // truthy
                    hashStringBuilder.push(param + settings.hashParamSuffix + '=' + hashParams[param]);
                }
            }
            return hashStringBuilder.join('&');
        };

        // Returns the URL to the current state of the document viewer (so it should be an exact replica)
        var getCurrentURL = function() {
            return settings.protocol + location.host + location.pathname + '#' + getURLHash();
        };

        var resizeViewer = function(newWidth, newHeight) {
            if (newWidth >= settings.minWidth && newHeight >= settings.minHeight) {
                $(settings.outerSelector).width(newWidth);
                $(settings.outerSelector).height(newHeight);

                // Save the new height and width
                settings.panelHeight = newHeight;
                settings.panelWidth = newWidth - settings.scrollbarWidth;

                // Should also change the width of the container
                $(settings.parentSelector).width(newWidth); // including the scrollbar etc

                // If it's in grid mode, we have to reload it, unless this is disabled
                if (settings.inGrid) {
                    loadGrid();
                }
            }
        };

        // It should only need to resize side panel widths the first time
        var resizePanels = function() {
            // Get the new panel height and width
            settings.panelHeight = $(settings.elementSelector).height() - settings.scrollbarWidth -  $('#diva-toolbar').height();
            // The side panels are fixed width so subtract those widths
            settings.panelWidth = $(settings.elementSelector).width() - settings.scrollbarWidth - $('#left-pane').width() - $('#right-pane').width();

            // Set the width and height of the viewer
            // I'm not sure why you can't just ignore the scrollbar but you can't
            $(settings.outerSelector).height(settings.panelHeight + settings.scrollbarWidth);
            $(settings.outerSelector).width(settings.panelWidth + settings.scrollbarWidth);

            // Adjust the side panel heights
            $('#search-outer').height(settings.panelHeight - $('#search-box').height() + settings.scrollbarWidth);
            $('#info-outer').height(settings.panelHeight - 20 + settings.scrollbarWidth);
        }

        var init = function() {
            // First figure out the width of the scrollbar in this browser
            settings.scrollbarWidth = $.getScrollbarWidth();
            // Check if the platform is the iPad/iPhone/iPod
            settings.mobileSafari = navigator.platform == 'iPad' || navigator.platform == 'iPhone' || navigator.platform == 'iPod';

            // For easier selecting of the container element
            settings.elementSelector = '#' + $(element).attr('id');
   
            // Generate an ID that can be used as a prefix for all the other IDs
            settings.ID = $.generateId('diva-');
            settings.selector = '#' + settings.ID;

            // Figure out the hashParamSuffix from the ID
            var divaNumber = parseInt(settings.ID, 10);
            if (divaNumber > 1) {
                // If this is document viewer #1, don't use a suffix; otherwise, use the document viewer number
                settings.hashParamSuffix = divaNumber;
            }

            // Since we need to reference these two a lot
            settings.outerSelector = settings.selector + 'outer';
            settings.innerSelector = settings.selector + 'inner';
            
            // Create a diva-tools div only if we need to
            /*if (settings.zoomSlider || settings.enableGotoPage || settings.enableGrid) {
                $(settings.elementSelector).prepend('<div id="' + settings.ID + 'tools"></div>');
            }*/
            
            // Create the go to page box, if enabled
            if (settings.enableGotoPage) {
                createGotoPage();
            }

            // Create the icon for toggling grid view, if enabled
            /*if (settings.enableGrid) {
                createGridIcon();
            }*/
            
            // Create the inner and outer panels
            $(settings.elementSelector).append('<div id="' + settings.ID + 'outer"></div>');
            $(settings.outerSelector).append('<div id="' + settings.ID + 'inner" class="dragger"></div>');
            
            // Adjust the document panel dimensions for Apple touch devices
            if (settings.mobileSafari) {
                // Account for the scrollbar
                settings.panelWidth = screen.width - settings.scrollbarWidth;

                // The iPhone's toolbar etc takes up slightly more screen space
                // So the height of the panel needs to be adjusted accordingly
                if (navigator.platform == 'iPad') {
                    settings.panelHeight = screen.height - 170;
                } else {
                    settings.panelHeight = screen.height - 250;
                }

                //$(settings.elementSelector).css('width', settings.panelWidth);
                $(settings.outerSelector).css('height', settings.panelHeight + 'px');
            } else {
                // For other devices, adjust to take the scrollbar into account
                resizePanels();
            }
            
            
            // First, n - check if it's in range
            var nParam = parseInt($.getHashParam('n' + settings.hashParamSuffix), 10);
            if (nParam >= settings.minPagesPerRow && nParam <= settings.maxPagesPerRow) {
                settings.pagesPerRow = nParam;
            }

            // Now z - check that it's in range
            var zParam = $.getHashParam('z' + settings.hashParamSuffix);
            if (zParam !== '') {
                // If it's empty, we don't want to change the default zoom level
                zParam = parseInt(zParam, 10);
                // Can't check if it exceeds the max zoom level or not because that data is not available yet ...
                if (zParam >= settings.minZoomLevel) {
                    settings.zoomLevel = zParam;
                }
            }

            // y - vertical offset from the top of the relevant page
            var yParam = parseInt($.getHashParam('y' + settings.hashParamSuffix), 10);
            if (yParam > 0) {
                settings.desiredYOffset = yParam;
            }

            // x - horizontal offset from the left edge of the relevant page
            var xParam = parseInt($.getHashParam('x' + settings.hashParamSuffix), 10);
            if (xParam > 0) {
                settings.desiredXOffset = xParam;
            }

            var gridScrollTop = parseInt($.getHashParam('gy' + settings.hashParamSuffix), 10);
            if (gridScrollTop > 0) {
                settings.gridScrollTop = gridScrollTop;
            }

            // Store the height and width of the viewer (the outer div), if present
            var desiredHeight = parseInt($.getHashParam('h' + settings.hashParamSuffix), 10);
            var desiredWidth = parseInt($.getHashParam('w' + settings.hashParamSuffix), 10);
            // Store the minimum and maximum height too
            settings.minHeight = parseInt($(settings.outerSelector).css('min-height'));
            settings.minWidth = parseInt($(settings.outerSelector).css('min-width'));

            // If the grid hash param is true, go to grid view initially
            var gridParam = $.getHashParam('g' + settings.hashParamSuffix);
            if (gridParam === 'true' && settings.enableGrid) {
                toggleGrid();
            }
            
            // Load the images at the initial zoom level, if we haven't already 
            if (!settings.inFullscreen && !settings.inGrid) {
                loadDocument(settings.zoomLevel);
            }
        
            handleEvents();

            // Set the search results
            var queryParam = $.getHashParam('q');
            if (queryParam) {
                $('#search-box input').val(queryParam);
                $('#search-box form').submit();
            }
        };

        // Call the init function when this object is created.
        init();

        /* PUBLIC FUNCTIONS
        ===============================================
        */

        // Returns the title of the document, based on the directory name
        this.getItemTitle = function() {
            return settings.itemTitle;
        };

        // Go to a particular page (with indexing starting at 1)
        this.gotoPage = function(pageNumber) {
            return gotoPage(pageNumber);
        };

        // Returns the page index (with indexing starting at 0)
        this.getCurrentPage = function() {
            return settings.currentPageIndex;
        };

        // Returns the current zoom level
        this.getZoomLevel = function() {
            return settings.zoomLevel;
        };

        // Zoom in, with callback. Will return false if it's at the maximum zoom
        this.zoomIn = function(callback) {
            settings.zoomInCallback = callback;
            return handleZoom(settings.zoomLevel+1);
        };

        // Zoom out, with callback. Will return false if it's at the minimum zoom
        this.zoomOut = function(callback) {
            settings.zoomOutCallback = callback;
            return handleZoom(settings.zoomLevel-1);
        };

        // Uses the verticallyInViewport() function, but relative to a page
        // Check if something (e.g. a highlight box on a particular page) is visible
        this.inViewport = function(pageNumber, topOffset, height) {
            var pageIndex = pageNumber - 1;
            var top = settings.heightAbovePages[pageIndex] + topOffset;
            var bottom = top + height;
            return verticallyInViewport(top, bottom);
        };

        // Jump to an image based on its filename
        this.gotoPageByName = function(filename) {
            // Go through all the pages looking for one whose filename matches
            for (var i = 0; i < settings.numPages; i++) {
                if (settings.pages[i].fn == filename) {
                    gotoPage(i);
                    return true;
                }
            }

            // If not found, return false
            return false;
        };

        // Get the current URL (exposes the private method)
        this.getCurrentURL = function() {
            return getCurrentURL();
        };

        // Get the hash part only of the current URL (without the leading #)
        this.getURLHash = function() {
            return getURLHash();
        };

        this.getState = function() {
            return getState();
        };

        this.setState = function(state) {
            // Ignore fullscreen, this is meant for syncing two viewers ... they can't both be fullscreen
            // Pass it the state retrieved from calling getState() on another diva
            settings.gridScrollTop = state.gy;
            settings.goDirectlyTo = (isNaN(state.i)) ? getPageIndex(state.i) : state.i// if not a number, it's a filename
            settings.desiredXOffset = state.x;
            settings.desiredYOffset = state.y;

            // The actions to take depend on both the desired state and the current state
            if (state.g) {
                // Save the zoom level (won't be used right away, but it must be done here)
                settings.zoomLevel = state.z
                // Are we already in grid mode?
                if (settings.inGrid) {
                    // Do we need to change the number of pages per row?
                    if (settings.pagesPerRow === state.n) {
                        // We don't ... now do gridScroll() just in case we need to scroll
                        gridScroll();
                    } else {
                        // We do ... change that, scrolling will be taken care of automatically
                        handleGridSlide(state.n);
                    }
                } else {
                    // Enter the grid ... scrolling and pages per row should be done automatically
                    settings.pagesPerRow = state.n;
                    // Can't call enter grid because it overwrites the desired x and y offsets
                    settings.inGrid = true;
                    loadGrid();
                }
            } else {
                // Save the number of pages per row here in case we go into grid mode later
                settings.pagesPerRow = state.n;
                // Are we in grid mode right now?
                if (settings.inGrid) {
                    // We are ... let's get out of it
                    settings.zoomLevel = state.z;
                    leaveGrid();
                } else {
                    // Do we need to change the zoom level?
                    if (settings.zoomLevel === state.z) {
                        // Nope. Just scroll.
                        documentScroll();
                    } else {
                        // We do, do it
                        handleZoom(state.z);
                    }
                }
            }

            // If we need to resize, do it now
            if (settings.panelHeight !== state.h || (settings.panelWidth + settings.scrollbarWidth) !== state.w) {
                resizeViewer(state.h, state.w);
            }
        };

        // Resizes the outer div to the specified width and height
        this.resize = function(newWidth, newHeight) {
            resizeViewer(newWidth, newHeight);
        };
    };


    
    $.fn.diva = function(options) {
        return this.each(function() {
            var element = $(this);

            // Return early if this element already has a plugin instance
            if (element.data('diva')) {
                return;
           }
            options.parentSelector = element;
            
            // Otherwise, instantiate the document viewer
            var diva = new Diva(this, options);
            element.data('diva', diva);
        });
    };
    
})( jQuery );
