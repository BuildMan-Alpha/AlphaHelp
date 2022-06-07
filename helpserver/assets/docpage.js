// The SEO page helpserver functions

// Set up standard page elements...
var helpServer = {
    navigateClosestTopic: function (topic) {
        var hint = "";
        //------------------ Special case
        if( topic )
            topic = topic.replace(/^\s+|\s+$/gm,'');
        var lastWordStart = topic.lastIndexOf(' ');
        if( lastWordStart > 0 ) {
            if( topic.substring(lastWordStart+1).toLowerCase() == "class" ) {
                var classMethods = document.location.hash.toLowerCase().lastIndexOf("/methods/");
                if( classMethods > 0 ) {
                    hint = document.location.hash.substring(1,classMethods)+"/definition";
                }
            }
        }
        //--------------------------------
        
        var fromPath = window.location.pathname;
        var pagesAt = fromPath.indexOf("/pages");
        if (pagesAt >= 0) {
            var basePath = fromPath.substring(0,pagesAt+1);
            fromPath = fromPath.substring(pagesAt + 6);
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.onload = function () {
                if (this.status == 200) {
                    if (xmlhttp.responseText != "") {
                        // link to
                        window.location = basePath + "pages" + xmlhttp.responseText;
                    }
                }
            };
            xmlhttp.open("GET", basePath + "topic?topic=" + topic + "&from=" + document.location.hash.substring(1) + "&hint=" + hint, true);
            xmlhttp.send();
        }
    },
    checkNavigation: function (navToId, from) {
        if (navToId.indexOf("://") <= 0) {
            var fromPath = window.location.pathname;
            var pagesAt = fromPath.indexOf("/pages");
            if (pagesAt >= 0) {
                fromPath = fromPath.substring(0, pagesAt + 6);
                navToId = fromPath + navToId
            }
        }
        window.location = navToId;
    }
}

function localExpand(e, expand) {
    var display = (expand)? "" : "none";
    var classname = (expand)? "opened" : "closed";

    var eles = document.querySelectorAll("li[branch='true']");
    for (var i = 0; i < eles.length; i++) {
        var eleB = eles[i].lastElementChild;

        eleB.style.display = display;
        eles[i].className = classname;
    }
}

// Only called on article pages.
function loaded() {
    getGitTimestamp();
    betaSoftware();
    desktopPageTag();
    showAnnouncement();

    // fix positioned page nav
    var ele = document.getElementById('page-nav');
    var dEle = document.getElementById('doc');
    if(dEle.offsetHeight > ele.offsetHeight){
        var pEle = ele;
        var t = 0;
        while(pEle && pEle.offsetParent){
            pEle = pEle.offsetParent;
            t += pEle.offsetTop;
        }
        ele.setAttribute('defaultTop',t);
        document.body.onscroll = function(){
            if(window.adjustingNav) return false;
            window.adjustingNav = true;
            var ele = document.getElementById('page-nav');
            if(ele && ele.hasAttribute('defaultTop')){
                var fixed = false;
                if(document.documentElement.scrollTop > Number(ele.getAttribute('defaultTop'))) fixed = true;
                if(ele.classList.contains('fixed') && !fixed)  ele.classList.toggle('fixed',false);
                else if(!ele.classList.contains('fixed') && fixed) ele.classList.toggle('fixed',true);
            }
            setTimeout(function(){window.adjustingNav = false;},100);
        }
    }
}

// Only called on the Search Results Page.
function initializeSearch() {
    // Display maintenance announcements
    showAnnouncement();

    // Prepend the URL hostname to the page url in the search results:
    var addressTags = document.getElementsByClassName("search-address");
    if( addressTags && addressTags.length ) {
        var i;
        for( i = 0 ; i < addressTags.length ; ++i ) {
             if( addressTags[i].innerHTML.substr(0,1) == '/' ) {
                 addressTags[i].innerHTML = document.location.host + addressTags[i].innerHTML;
             }
        }
    }
}

function localToClickHandler(e) {
    if (e.target) {
        if (e.target.nodeName == "LI" && e.target.getAttribute("branch") == "true") {
            var eleB = e.target.lastElementChild;
            if (eleB.style.display == "none") {
                eleB.style.display = "";
                e.target.className = "opened";
            } else {
                eleB.style.display = "none";
                e.target.className = "closed";
            }
        }
    }
}

function onSearch() {
    let basePath = window.location.pathname.split("pages")[0];
    let target = basePath+"pages/search";
    let pattern = document.getElementsByName("pattern")[0];
    let search = document.getElementsByName("search")[0];
    let display = document.getElementsByName("display")[0];
    let limit = document.getElementsByName("limit")[0];

    if (pattern.value.indexOf("in:title") !== -1) {
        pattern.value = pattern.value.split("in:title").join(" ").trim();

        search.value = "title";
    } else {
        search.removeAttribute("name");
    }
    if (display.value.trim().length == 0) {
        display.removeAttribute("name");
    }
    if (limit.value.trim().length == 0) {
        limit.removeAttribute("name");
    }

    return true;
}

function gotoPrintPage(flatten) {
    if( flatten ) {
        window.open( location.pathname.replace("/pages/","/print/")+"?flatten=true" , "_blank" );
    } else {
        window.open( location.pathname.replace("/pages/","/print/") , "_blank" );
    }
}

function gotoFlattenPage(isFlat) {
    if( isFlat ) {
        window.open( location.pathname );
    } else {
        window.open( location.pathname + "?flatten=true" );
    }
}

// Site wide announcement
function showAnnouncement() {
    // TODO:
    // Move Site Announcements into a JSON file
    // JSON entry has start, end, message:
    //    start   = a date/time value in GMT time; The timestamp will be rendered in the user's local time.
    //    end     = Optional. A date/time value in GMT time; The timestamp will be rendered in the user's local time.
    //    message = Message to display. Can use placeholders {start} and {end} to refer to the start and end time. Can also use HTML.
    //    target  = Array of target doc sites. Doc sites include: "Alpha Anywhere", "Alpha TransForm"
    //    Example: 
    //    {
    //      "start":"Thu, 06 Sep 2018 13:00:00 GMT",
    //      "end":"Thu, 06 Sep 2018 22:00:00 GMT",
    //      "message": "Maintenance will be performed on the documentation servers between {start} and {end}. During this time, the Alpha Anywhere help documentation may be temporarily unavailable as we make improvements to our system. Thank you for your patience during this time.",
    //      "target":["Alpha Anywhere","Alpha TransForm"]
    //    }
    //
    //
    // Question: Should we support multiple simultaneous announcements on the site?

    // start and end must be in GMT time; The timestamp will be rendered in the user's local time.
    var maintenance = {
        start: new Date("Sun, 23 Jun 2019 22:00:00 GMT"),
        end: new Date("Mon, 23 Jun 2019 06:00:00 GMT")
    };
    
    var now = new Date();
    if (now >= maintenance.end) {
        return;
    }
    
    var ele = document.getElementById("announcement");
    ele.style.display = "block";
    ele.innerHTML = "We will be upgrading the Alpha Cloud servers beginning " + maintenance.start.toLocaleString() + ".  <strong>During this time, access to both Alpha Cloud and Alpha TransForm Server will not be available for several hours.</strong>  The Alpha TransForm App will continue to work, but you will not be able to synchronize forms with the TransForm Cloud nor log into your Alpha TransForm account if you were previously logged out or your login expired.  We appreciate your patience during this time. <a href=\"https://www.alphasoftware.com/blog/major-upgrades-coming-to-alpha-cloud-june-23\" alt=\"Major Upgrades Coming to Alpha Cloud\" target=\"blog\">Click here</a> to learn more about the scheduled service outage and exciting new features coming to Alpha Cloud.";


}

// Display a "This is beta product" warning on the page.
function betaSoftware() {
    var url = window.location.href;
    if (decodeURI(url).search(/beta software/i) !== -1) {
        var content = document.getElementById("doc");
        if (content) {
            var classes = content.getAttribute("class");
            if (classes !== null) {
                classes = classes + " betaSoftware";
            } else {
                classes = "betaSoftware";
            }
            content.setAttribute("class", classes);
        }
    }
}

function desktopPageTag() {
    var url = window.location.href;
    if (decodeURI(url).search(/Guides\/Desktop/i) !== -1) {
        var content = document.getElementById("doc");
        if (content) {
            var classes = content.getAttribute("class");
            if (classes !== null) {
                classes = classes + " desktop";
            } else {
                classes = "desktop";
            }
            content.setAttribute("class", classes);
        }
    }
}

// Pull the GitHub Last Modified Timestamp for the page content.
function getGitTimestamp() {
    var path = window.location.href
    path = path.split("pages")[1];
    var url = "https://api.github.com/repos/BuildMan-Alpha/AlphaHelp/commits?page=1&per_page=1&path=/helpfiles" + path;

    var callbackFunc = function (status, jsonObj) {
        if (typeof (jsonObj) == "string") {
            jsonObj = JSON.parse(jsonObj);
        }
        if (status == null && jsonObj.length > 0) {
            var d = new Date(jsonObj[0].commit.author.date);
            var month = d.getMonth() + 1;
            month = (month < 10)? "0" + month:""+month;
            var day = d.getDate();
            day = (day < 10) ? "0" + day:""+day;
            var dateStr = d.getFullYear() + "/" + month + "/" + day;

            var ele = document.getElementById('report-issue-timestamp');
            if (ele) {
                ele.innerHTML = "Page Last Modified on " + dateStr;
            }
        }
    }

    var response = function(url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'json';
        xhr.onload = function() {
        var status = xhr.status;
        if (status == 200) {
            callback(null, xhr.response);
        } else {
            callback(status);
        }
        };
        xhr.send();
    };

    response(url, callbackFunc);
}
