(function() {
    var handlePageLoadAfterHashChange = true,
        animateContentChange = true,
        lastHash = undefined,
        currentHash = undefined,
        $mainMenu = undefined,
        $content = undefined,
        $backToTop = undefined;

    $(window).bind('hashchange', function (e) {
        currentHash = location.hash.replace(/^#/, '');

        if(handlePageLoadAfterHashChange) {
            loadContent();
        }
    });

    $(document).ready(function () {
        initAnchorHandling();

        $mainMenu = $("#main-menu");
        $content = $("#content-wrap");
        $backToTop = $("#back-to-top");
        currentHash = location.hash.replace(/^#/, '');

        //Since the event is only triggered when the hash changes, we need to trigger the event now,
        //to handle the hash the page may have loaded with
        var accBefore = animateContentChange;
        animateContentChange = false;
        loadContent();
        animateContentChange = accBefore;
    });

    function initAnchorHandling() {
        $(document).delegate('a', 'click', function (e) {
            //All anchors which get clicked and weren't prevented before by another specific element-handler come here to big daddy.
            //Big daddy is only able to reload content because a normal anchor always makes a request for a new page. So big daddy does
            //nothing else than load the content of the href into the content-div by setting the window.location.hash
            var $a = $(this);

            if($a.is(".disabled")) {
                return false; //do not handle disabled anchors
            }

            var target = $a.attr("target"),
                href = $a.attr("href");

            if(!href || (target && target != "")) {
                return true; //normal browser behaviour
            }

            if (e.ctrlKey == false && e.shiftKey == false) {
                if(href.toLowerCase().indexOf("javascript") === 0) {
                    return true;
                }

                if(href.indexOf("#") === 0) {
                    //anchor starts with # so it must be a reference to a html element by id
                    scrollTo(href);
                    return false;
                }

                // Get the url from the link's href attribute, stripping any leading #
                var url = href.replace(/^#/, '');
                if (url != '') {
                    setLocationHash(url);
                }

                $a[0].blur();

                return false;
            }
        });
    };

    function setLocationHash(url) {
        url = encodeURI(url);

        var curUrl = location.hash.replace(/^#/, '');
        if (curUrl !== url) {
            location.hash = url;
        }
        else {
            $(window).trigger("hashchange");
        }
    };

    function loadContent() {
        var currentHashParts = currentHash.split(","),
            currentContentUrl = currentHashParts[0].replace("#", ""),
            currentScrollToElement = currentHashParts[1];

        if(!currentContentUrl || currentContentUrl === "") {
            setLocationHash("behandlungen");
            return false;
        }

        if(lastHash) {
            var lastHashParts = lastHash.split(","),
                lastContentUrl = lastHashParts[0],
                lastScrollToElement = lastHashParts[1];

            if(currentContentUrl === lastContentUrl) {
                if(lastScrollToElement && (!currentScrollToElement || currentScrollToElement === "")) {
                    //scroll to top if now the scrollelement hash part is empty but was not before
                    $("html,body").animate({
                        scrollTop: 0
                    }, 1000);
                }

                //return because we don't have to load content which is already there
                return false;
            }
        }

        $mainMenu.find("a").removeClass("active");
        $mainMenu.find("a[href='"+currentContentUrl+"']").addClass("active");

        currentContentUrl = encodeURI(currentContentUrl)+".html";

        if (animateContentChange) {
            //animate the change between content switch
            $content
                .css('overflow-y', 'hidden')
                .fadeOut(400, function () {
                    $content
                        .hide()
                        .load(currentContentUrl, function (responseText, status) {
                            if (status === "error") {
                                var errorContent = responseText || "Diese Seite konnte nicht geladen werden: "+contentUrl;
                                $content.html(errorContent);
                            }
                            else {
                                $content.show("slide", { direction: "up" }, 400, function() {
                                    afterContentLoad(responseText, currentScrollToElement);
                                });
                            }
                        });
                });
        }
        else {
            //no animation, we're loading the page directly from a browser get request
            $content.load(currentContentUrl, function (responseText, status) {
                if (status === "error") {
                    $content.html(responseText);
                }
                else {
                    afterContentLoad(responseText, currentScrollToElement);
                }

                $content.show();
                $(window).trigger('contentLoaded');
            });
        }
    };

    function afterContentLoad(responseText, scrollToElement) {
        //jQuery messes with the SCRIPT tags when you pass HTML to $().
        //It doesn't remove them though - it simply adds them to the DOM collection produced from your HTML.
        //We just want to execute java script tags but no template tag.
        //$(responseText).filter("script[type='text/javascript']").each(function (i, val) {
        //    $.globalEval(this.text || this.textContent || this.innerHTML || '');
        //});

        if(scrollToElement) {
            scrollTo(scrollToElement);
        }

        //track all headings and show/hide back to top button if one of them is passed
        $backToTop.hide();
        $.waypoints("destroy");

        $("h1").waypoint(function(direction) {
            if(direction === "down") {
                $backToTop.fadeIn(300);
            }
        });
        $("h1:first").waypoint(function(direction) {
            if(direction === "up") {
                $backToTop.fadeOut(300);
            }
        });

        lastHash = currentHash;

        //track all headings which have ids because we want to keep our url hash up to date to this information
        /*$("h1[id]").waypoint(function() {
            updateWaypointInLocationHash($(this).attr("id"));
        });*/
    };

    /**
     * Scrolls the element with the specified id into view
     * @param elementId Id of element
     */
    function scrollTo(elementId) {
        //reduced method from http://css-tricks.com/snippets/jquery/smooth-scrolling/ in the comments
        var eId = elementId.replace(/^#/, ''),
            $e = $("#"+eId);

        if ($e && $e.length >= 1) {
            updateWaypointInLocationHash(eId);

            $("html,body").animate({
                scrollTop: $e.offset().top
            }, 1000);
        }
    };

    function updateWaypointInLocationHash(elementId) {
        var hplahcBefore = handlePageLoadAfterHashChange;
        handlePageLoadAfterHashChange = false;

        var hashParts = location.hash.split(",");
        location.hash = hashParts[0]+","+elementId;

        //defer
        setTimeout(function() {
            handlePageLoadAfterHashChange = hplahcBefore;
        },0);
    }
}());

/**
 * Scroll to top of the page
 */
function scrollToTop() {
    var hashParts = location.hash.replace(/^#/, '').split(","),
        contentUrl = hashParts[0],
        scrollToElement = hashParts[1];

    if(scrollToElement) {
        //set the location hash with it's current content url but without the scrollToElement part which means that it
        //will scroll up the whole document again
        location.hash = contentUrl;
    }
    else {
        //scroll to element is already undefined, just scroll to the top without changing the url
        $("html,body").animate({
            scrollTop: 0
        }, 1000);
    }
};