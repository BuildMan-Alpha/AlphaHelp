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
var tableOfContents = {
    tocEle: null,
    pendingTocData: null,
    anchorPrefix: "",
    breadcrumbs: "",
    getAnchorPrefix: function () {
        var prefix = tableOfContents.anchorPrefix;
        if (!prefix) {
            var pagesAt = window.location.pathname.indexOf("/pages");
            if (pagesAt >= 0) {
                prefix = window.location.pathname.substring(0, pagesAt + 6);
                tableOfContents.anchorPrefix = prefix;
            }
        }
        return prefix;
    },
    populateTree: function (_tocData, pageName) {
        if (tableOfContents.tocEle) {
            var pathOfPage = window.location.pathname;
            var indexOfPages = pathOfPage.indexOf("/pages");
            if (indexOfPages >= 0) {
                pathOfPage = pathOfPage.substring(indexOfPages + 6);
            }
            pathOfPage = decodeURI(pathOfPage);
            var parentsNodes = [];

            var setInitialSelection = function (res) {
                if (res && res.length) {
                    var branchSelected = false;
                    var i;
                    for (i = 0; i < res.length; ++i) {
                        if (res[i].path && res[i].path.length) {
                            if (pathOfPage == res[i].path) {
                                res[i].initialSelection = true;
                                branchSelected = true;
                                break;
                            }
                        }
                        if (res[i].children) {
                            if (setInitialSelection(res[i].children, false)) {
                                res[i].initialSelection = true;
                                branchSelected = true;
                                parentsNodes.push(res[i]);
                                break;
                            }
                        }
                    }
                    return branchSelected;
                }
            };
            setInitialSelection(_tocData.children);
            var prefix = tableOfContents.getAnchorPrefix();
            var breadCrumbs = "";

            if (parentsNodes.length > 0) {
                // Construct breadcrumbs
                var i = parentsNodes.length - 1;
                while (i >= 0) {
                    if (parentsNodes[i].path) {
                        if (parentsNodes[i].hash) {
                            breadCrumbs += "<li><a href=\"" + prefix + parentsNodes[i].path + "#" + parentsNodes[i].hash + "\">" + parentsNodes[i].title + "</a></li>";
                        } else {
                            breadCrumbs += "<li><a href=\"" + prefix + parentsNodes[i].path + "\">" + parentsNodes[i].title + "</a></li>";
                        }
                    } else {
                        breadCrumbs += "<li>" + parentsNodes[i].title + "</li>";
                    }
                    --i;
                }
            }
            if (breadCrumbs != "") {
                tableOfContents.breadcrumbs = breadCrumbs;
            }

            var buildTree = function (res, isOpen) {
                if (res && res.length) {
                    var ulList = isOpen ? "<ul>\n" : "<ul style=\"display:none\">\n";
                    var i;
                    for (i = 0; i < res.length; ++i) {
                        if (res[i].children) {
                            if (res[i].initialSelection) {
                                ulList += "<li branch=\"true\" class=\"opened\" >";
                            } else {
                                ulList += "<li branch=\"true\" class=\"closed\" >";
                            }
                        } else {
                            ulList += "<li class=\"leaf\" >";
                        }
                        if (res[i].path) {
                            if (res[i].ignoreBreadcrumbs) {
                                if (res[i].hash)
                                    ulList += "<div id=\"" + res[i].path + "#" + res[i].hash + "\" ignoreBreadcumbs=\"true\" ><a href=\"" + prefix + res[i].path + "#" + res[i].hash + "\" >" + res[i].title + "</a></div>";
                                else
                                    ulList += "<div id=\"" + res[i].path + "\" ignoreBreadcumbs=\"true\" ><a href=\"" + prefix + res[i].path + "\" >" + res[i].title + "</a></div>";
                            } else if (res[i].hash)
                                ulList += "<div id=\"" + res[i].path + "#" + res[i].hash + "\" ><a href=\"" + prefix + res[i].path + "#" + res[i].hash + "\" >" + res[i].title + "</a></div>";
                            else
                                ulList += "<div id=\"" + res[i].path + "\" ><a href=\"" + prefix + res[i].path + "\" >" + res[i].title + "</a></div>";
                        } else {
                            ulList += "<div>" + res[i].title + "</div>";
                        }
                        if (res[i].children)
                            ulList += buildTree(res[i].children, res[i].initialSelection ? true : false);
                        ulList += "</li>\n"
                    }
                    ulList += "</ul>\n";
                    return ulList;
                }
                return "";
            };
            tableOfContents.tocEle.innerHTML = buildTree(_tocData.children, true);
            var path = window.location.pathname.replace(prefix, "");
            if (path) {
                tableOfContents.setSelectedPage(path);
            }
            if (tableOfContents.breadcrumbs != "") {
                var breadCrumbsEle = document.getElementById("breadcrumbs");
                breadCrumbsEle.innerHTML = tableOfContents.breadcrumbs;
            }
        } else {
            tableOfContents.pendingTocData = _tocData
        }
    },
    loaded: function () {
        tableOfContents.tocEle = document.getElementById("TOC");
        if (tableOfContents.tocEle) {
            tableOfContents.tocEle.addEventListener("click", tableOfContents.tocClickHandler);
        }
        if (tableOfContents.pendingTocData) {
            tableOfContents.populateTree(tableOfContents.pendingTocData);
            tableOfContents.pendingTocData = null;
        }
    },
    search: function () {
        var ele = document.getElementById("searchInput");
        this.searchText = ele.value;
        if (ele.value != '') {
            var command = "/search?limit=50&pattern=" + ele.value;
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.onreadystatechange = function () {
                if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                    var resultList = JSON.parse(xmlhttp.responseText);
                    var html = '';
                    var i;
                    var prefix = tableOfContents.getAnchorPrefix();
                    for (i = 0; i < resultList.length; ++i) {
                        html += "<div><a href=\"" + prefix + resultList[i].path + "\" id=\"search_" + resultList[i].path + "\" class=\"searchUnselected\" "
                        html += ">" + resultList[i].title + "</a></div>";
                    }
                    var headerEle = document.getElementById('header');
                    document.getElementById("searchResults").innerHTML = html;
                }
            };
            xmlhttp.open("GET", command, true);
            xmlhttp.send();
        }
    },
    setSelectedPage: function (navToId) {
        // goto the page
        var navTo = document.getElementById(navToId);
        if (!navTo) {
            navToId = decodeURI(navToId);
            navTo = document.getElementById(navToId);
        }
        if (!navTo && !tableOfContents.tocData)
            ; // race with TOC load
        else if (navTo) {
            navTo.className = "selected";
            var dad = navTo.parentNode;
            while (dad) {
                if (dad.style && dad.style.display == "none") {
                    dad.style.display = "";
                    dad = dad.parentNode;
                    dad.className = "opened";
                }
                dad = dad.parentNode;
            }
            this.lastSelection = navTo;
            if (navTo.scrollIntoViewIfNeeded)
                navTo.scrollIntoViewIfNeeded();
            else
                navTo.scrollIntoView();
        }
    },
    tocClickHandler: function (e) {
        if (e.target) {
            if (e.target.id == "TOC") {
                return false;
            } else if (e.target.nodeName == "A") {
                if (e.target.href) {
                    var navToId = e.target.href;
                    tableOfContents.disableScrollTo = e.target;
                    if (helpServer && helpServer.checkNavigation)
                        helpServer.checkNavigation(navToId, 'toc');
                    else
                        window.parent.helpServer.checkNavigation(navToId, 'toc');
                }
            } else if (e.target.nodeName == "DIV") {
                e.target.className = "selected";
            } else if (e.target.nodeName == "LI" && e.target.getAttribute("branch") == "true") {
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
};

var clippy = null;


function initialize() {
    var toolbarContent = ["	<button id=\"toolbarTOCButton\" onclick=\"document.body.classList.toggle('showTOC',!document.body.classList.contains('showTOC'));\" style=\"position: absolute; left: 18px;\">",
        "		<svg width=\"44\" height=\"44\" xmlns=\"http://www.w3.org/2000/svg\">",
        "			<defs>",
        "				<filter id=\"dropshadow\" height=\"130%\" width=\"130%\">",
        "					<feGaussianBlur in=\"SourceAlpha\" stdDeviation=\"1\"/>",
        "					<feOffset dx=\"0\" dy=\"0\" result=\"offsetblur\"/>",
        "					<feComponentTransfer>",
        "						<feFuncA type=\"linear\" slope=\"1\"/>",
        "					</feComponentTransfer>",
        "					<feMerge> ",
        "						<feMergeNode/>",
        "						<feMergeNode in=\"SourceGraphic\"/>",
        "					</feMerge>",
        "				</filter>",
        "			</defs>",
        "			<path d=\"m 13.014649,15 a 1.0000999,1.0000999 0 1 0 0,2 l 17.970702,0 a 1.0000999,1.0000999 0 1 0 0,-2 l -17.970702,0 z m 0,6 a 1.0000999,1.0000999 0 1 0 0,2 l 17.970702,0 a 1.0000999,1.0000999 0 1 0 0,-2 l -17.970702,0 z m 0,6 a 1.0000999,1.0000999 0 1 0 0,2 l 17.970702,0 a 1.0000999,1.0000999 0 1 0 0,-2 l -17.970702,0 z\" fill=\"#fff\" filter=\"url(#dropshadow)\" />",
        "		</svg>",
        "	</button>",
        "	<button onclick=\"document.body.classList.add('search'); document.getElementById('searchInput').focus()\"  style=\"position: absolute; right: 18px;\">",
        "		<svg width=\"44\" height=\"44\" xmlns=\"http://www.w3.org/2000/svg\">",
        "			<defs>",
        "				<filter id=\"dropshadow\" height=\"130%\" width=\"130%\">",
        "					<feGaussianBlur in=\"SourceAlpha\" stdDeviation=\"1\"/>",
        "					<feOffset dx=\"0\" dy=\"0\" result=\"offsetblur\"/>",
        "					<feComponentTransfer>",
        "						<feFuncA type=\"linear\" slope=\"1\"/>",
        "					</feComponentTransfer>",
        "					<feMerge>",
        "						<feMergeNode/>",
        "						<feMergeNode in=\"SourceGraphic\"/>",
        "					</feMerge>",
        "				</filter>",
        "			</defs>",
        "			<path d=\"m 20.741949,11.740364 c -4.406433,0 -8,3.593567 -8,8 0,4.406433 3.593567,8 8,8 1.561891,0 3.016201,-0.459127 4.25,-1.238281 l 4.482422,5.378906 a 1.0001,1.0001 0 1 0 1.535156,-1.28125 l -4.470703,-5.365234 c 1.361245,-1.43534 2.203125,-3.367695 2.203125,-5.494141 0,-4.406433 -3.593567,-8 -8,-8 z m 0,2 c 3.325553,0 6,2.674447 6,6 0,3.325553 -2.674447,6 -6,6 -3.325553,0 -6,-2.674447 -6,-6 0,-3.325553 2.674447,-6 6,-6 z\" fill=\"#fff\" filter=\"url(#dropshadow)\" />",
        "		</svg>",
        "	</button>"
    ].join("\n");
    var toolbarEle = document.getElementById("toolbar");
    toolbarEle.innerHTML = toolbarContent;

    var toTopButtonContent = [
        "	<svg width=\"44\" height=\"44\" xmlns=\"http://www.w3.org/2000/svg\">",
        "		<defs>",
        "			<filter id=\"dropshadow\" height=\"130%\" width=\"130%\">",
        "				<feGaussianBlur in=\"SourceAlpha\" stdDeviation=\"1\"/>",
        "				<feOffset dx=\"0\" dy=\"0\" result=\"offsetblur\"/>",
        "				<feComponentTransfer>",
        "					<feFuncA type=\"linear\" slope=\"1\"/>",
        "				</feComponentTransfer>",
        "				<feMerge>",
        "					<feMergeNode/>",
        "					<feMergeNode in=\"SourceGraphic\"/>",
        "				</feMerge>",
        "			</filter>",
        "		</defs>",
        "		<path d=\"m 21.988281,18.201172 a 1.0001015,1.0001015 0 0 0 -0.697265,0.294922 l -5.5625,5.585937 a 1.0005858,1.0005858 0 1 0 1.417968,1.41211 L 22,20.621094 l 4.853516,4.873047 a 1.0005858,1.0005858 0 1 0 1.417968,-1.41211 l -5.5625,-5.585937 a 1.0001015,1.0001015 0 0 0 -0.720703,-0.294922 z\" fill=\"#fff\" filter=\"url(#dropshadow)\" />",
        "	</svg>"
    ].join("\n");
    var toTopButtonEle = document.getElementById("toTopButton");
    toTopButtonEle.innerHTML = toTopButtonContent;

    var searchContent = ["	<div id=\"searchToolbar\">",
        "		<div id=\"searchField\"><input id=\"searchInput\" placeholder=\"Search...\" onkeyup=\"var keyCode = event.charCode || event.keyCode; if(keyCode == 13){ tableOfContents.search();} else if(keyCode == 27){ tableOfContents.searchClear();}\" /></div>",
        "		<button id=\"searchButton\" onclick=\"tableOfContents.search();\" >Search</button>",
        "		<button id=\"searchClose\" onclick=\"document.body.classList.remove('search');\">",
        "			<svg width=\"44\" height=\"44\" xmlns=\"http://www.w3.org/2000/svg\">",
        "				<defs>",
        "					<filter id=\"dropshadow\" height=\"130%\" width=\"130%\">",
        "						<feGaussianBlur in=\"SourceAlpha\" stdDeviation=\"1\"/>",
        "						<feOffset dx=\"0\" dy=\"0\" result=\"offsetblur\"/>",
        "						<feComponentTransfer>",
        "							<feFuncA type=\"linear\" slope=\"1\"/>",
        "						</feComponentTransfer>",
        "						<feMerge> ",
        "							<feMergeNode/>",
        "							<feMergeNode in=\"SourceGraphic\"/>",
        "						</feMerge>",
        "					</filter>",
        "				</defs>",
        "				<path d=\"m 13,12 a 1.0000999,1.0000999 0 0 0 -0.697266,1.716797 L 20.585938,22 12.302734,30.283203 a 1.0000999,1.0000999 0 1 0 1.414063,1.414063 L 22,23.414062 l 8.283203,8.283204 a 1.0000999,1.0000999 0 1 0 1.414063,-1.414063 L 23.414062,22 31.697266,13.716797 A 1.0000999,1.0000999 0 0 0 30.970703,12 a 1.0000999,1.0000999 0 0 0 -0.6875,0.302734 L 22,20.585938 13.716797,12.302734 A 1.0000999,1.0000999 0 0 0 13,12 Z\" fill=\"#fff\" filter=\"url(#dropshadow)\" />",
        "			</svg>",
        "		</button>",
        "	</div>",
        "	<div id=\"searchResults\">",
        "	</div>"
    ].join("\n");
    var searchEle = document.getElementById("search");
    searchEle.innerHTML = searchContent;
    tableOfContents.loaded();
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

// Only called on the Search Results Page.
function initializeSearch() {
    // Display maintenance annoucements
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


function loaded() {
    getGitTimestamp();
    betaSoftware();
    showAnnouncement();
}

function showAnnouncement() {
    // start and end should be in GMT time!
    var maintenance = {
        start: new Date("Thu, 06 Sep 2018 13:00:00 GMT"),
        end: new Date("Thu, 06 Sep 2018 22:00:00 GMT")
    };
    
    var now = new Date();
    if (now >= maintenance.end) {
        return;
    }
    
    var ele = document.getElementById("announcement");
    ele.innerHTML = "Maintenance will be performed on the documentation servers between " + maintenance.start.toLocaleString() + " and " + maintenance.end.toLocaleString() + ".  During this time, the Alpha Anywhere help documentation may be temporarily unavailable as we make improvements to our system. Thank you for your patience during this time.";
    ele.style.display = "block";
}

function betaSoftware() {
    var url = window.location.href;
    if (decodeURI(url).search(/beta software/i) !== -1) {
        var content = document.getElementById("doc");
        if (content) {
            var classes = content.getAttribute("class");
            if (classes !== null) {
                classes = classes = " betaSoftware";
            } else {
                classes = "betaSoftware";
            }
            content.setAttribute("class", classes);
        }
    }
}

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

            var ele = document.getElementById('report-issue-timestamp')
            ele.innerHTML = "Page Last Modified on " + dateStr;
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

