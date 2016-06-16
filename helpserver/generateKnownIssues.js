var http = require('https');

var options = {
    host: "api.github.com",
    path: "/repos/AlphaSoftware/AlphaAnywhere/issues?state=open&sort=created&direction=asc",
    method: 'GET',
    headers: {'User-Agent': 'request','Accept':'application/vnd.github.html+json'}
};

callback = function(response) {
    var str = '';
    var md = '';

    response.on('data', function (chunk) {
        str += chunk;
    });

    response.on('end', function () {
        var jsonObj = JSON.parse(str);
        var md = '<html>\n<head>\n'
        md += '<meta name="description" content="A list of open, known issues with the Alpha Anywhere" />\n';
        md += '<title>Known Issues</title>\n';
        md += '</head>\n<body>\n<h1>Known Issues</h1>\n';
        md +='<p>This page lists the currently known issues in Alpha Anywhere that are open. Issues are tracked using GitHub. You will find a list of "labels" for each issue. These lables indicate the associated feature in Alpha Anywhere and the type of issue - bug, enhancement, etc. Clicking a label will display a list of all open issues with the same label.</p><p>For a list of all issues, including issues that are closed, visit the <a href="https://github.com/alphasoftware/AlphaAnywhere/issues">Alpha Anywhere GitHub Issues List</a>.</p>\n'
        for (var i = 0; i < jsonObj.length; i++) {
            var issue = jsonObj[i];

            md += "<h2>#" + issue["number"] + " " + issue["title"] + "</h2>\n";
            var labels = ""
            for (var j = 0; j < issue["labels"].length; j++) {
                if (j > 0) {
                    labels += ", ";
                }
                var url = 'https://github.com/alphasoftware/AlphaAnywhere/issues?q=is:issue is:open label:"'+issue["labels"][j]["name"]+'"';
                url = encodeURI(url);
                labels += '<a href="' + url +'" title="Click to view all issues tagged with this label.">' + issue["labels"][j]["name"] + '</a>';
            }
            if (labels.length > 0) {
                labels = "<p><strong>Labels:</strong> "  + labels + "</p>";
            }
            md += labels;
            md += issue["body_html"];
            md += "<p><a href=\""+issue["html_url"]+"\">View Issue " + issue["number"] + " on GitHub</a></p>";
            md += "<hr>";

        }
        md += "</body>\n</html>"
        console.log(md);
    });
};
http.request(options,callback).end();
