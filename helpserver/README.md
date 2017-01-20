# Running Helpserver On a Development Machine

After pulling down the AlphaHelp repository to a development machine, you can run the documentation 
server locally.  You will need to have node installed on your system, as well as getting the node_modules.
In the ./AlphaHelp/helpserver folder run

```
npm update
```

For a lightweight version of the help server, run the helpnosearch.js script.

```
node helpnosearch.js
```

The first time in, there will be no generated table-of-contents so you will need to refresh this, otherwise
none of the 'books' will have any child links - this can be done by opening a browser, navigating to 
*127.0.0.1:3002/refresh* , and click on the refresh button, and wait for the page to refresh 
(refresh count will increment).

After the refresh, navigate to the root URL  *127.0.0.1:3002/* , you should be able to navigate the 
documentation site locally now.

For a fully implementation (working search) run helplocal you will need to install and run the 
elasticsearch service on your system. 

```
node helplocal.js
```

## Maintaining the links.json file

The helpserver has a links.json file that it uses to resolve 'robust' links.  If files are moved, these robust links
can be fixed up by running this code:

```
node repopulateLinks.js
```
A robust link can contain the following characters:
* Letters
* Numbers
* Spaces
* Underscores

### Finding Bad or Missing Robust Links


If a robust link contains invalid characters, it will not be included in the links.json file when
repopulateLinks.js is run.

Use the listBannedTopicPages.js tool to find pages that violate the robust link criteria. 
You can also use this tool to list every page that is missing a robust link.

The following example lists every page with a robust link that has invalid characters in it:

```
node listBannedTopicPages.js
```

This example will list every page that has a robust link that contains either an "@" or "[" symbol:

```
node listBannedTopicPages.js -filter=@[
```

This example will list every page that doesn't have a robust link:
```
node listBannedTopicPages.js -logMissing
```

For more information, use the "-help" flag:
```
node listBannedTopicPages.js -help
```

## Maintaining functionList.json

The Function Finder and F1 Help reference the functionList.json file. If functions are added or removed, this file must be updated. This is done by running the following:

```
node updateFunctionRef.js
```

## Updating Known Issues

The help server can integrate issues from GitHub. The genKnownIssuesExtRef.js script pulls the list of open issues from GitHub and generates a JSON object, which can be read by the help server and integrated into search results:

```
node genKnownIssuesExtRef.js > known_issues.json
```

Note: The help server does not automate generating this list of issues, so this script must be run periodically to remove resolved issues and add new issues.

### Required Packages
genKnownIssuesExtRef.js requires the 'htmlparser2' and 'string' packages. These packages can be installed from nmp:

```
npm install htmlparser2
npm install string
```
