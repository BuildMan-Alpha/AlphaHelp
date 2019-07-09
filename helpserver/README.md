# Running Helpserver On a Development Machine

## Prerequisites

The following will need to be installed or downloaded locally:

 - npm
 - a clone of this repository

## Install node modules

After pulling down the AlphaHelp repository to a development machine, you can run the documentation 
server locally.  You will need to have node installed on your system, as well as getting the node_modules.
In the ./AlphaHelp/helpserver folder run

```
npm update
```


## Install xsltproc

You will need to install xsltproc as well:

```
npm install xsltproc
```

## Running the helpserver

### Copy xsltproc_win Files to helpfiles

If you are running helpserver.js on a Windows system, copy all of the files from the AlphaHelp/helpserver/xsltproc_win directory into AlphaHelp/helpserver. These files are not tracked under git and will be ignored when copied into the helpserver folder.

### Create the Folder Structure

Add the following directories:

- AlphaHelp/generated
- AlphaHelp/generated/topics

### Running the helpserver

For a lightweight version of the help server, run the helpserver.js script with the -nosearch parameter. You can run the following command from within AlphaHelp/helpserver to run the helserver without search:

```
node helpserver.js -nosearch
```

The first time in, there will be no generated table-of-contents so you will need to refresh this, otherwise
none of the 'books' will have any child links - this can be done by opening a browser, navigating to 
*127.0.0.1:3002/refresh* , and click on the refresh button, and wait for the page to refresh 
(refresh count will increment).

After the refresh, navigate to the root URL  *127.0.0.1:3002/* , you should be able to navigate the 
documentation site locally now.

For a fully implementation (working search) run helpserver.js with the -local parameter. You will need to install and run the 
elasticsearch service on your system.

```
node helpserver.js -local
```

## Troubleshooting

### Error: ENOENT: no such file or directory, open 'C:\GitHub\AlphaHelp\generated\topics\_guides_index.xml_html_all'

You did not create the generated and/or generated/topics folders.

### Error: not found: xsltproc

You did not install xsltproc and/or did not copy the files from the AlphaHelp/helpserver/xsltproc_win directory into AlphaHelp/helpserver.

## Maintaining the Links list.json file

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

The the -f (or -file) can be used to specify where to read the input link list from --- found in the "generated" directory for the helpserver. EG:

```
node repopulateLinks.js -f ../transform/generated/list.json
```

You can also specify the output location of the links.json and aliases.json files using the -o or -output argument. The location must end in a "/":

```
node repopulateLinks.js -f ../transform/generated/list.json -o ../transform/
```

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
genKnownIssuesExtRef.js requires the 'htmlparser2' package. This package can be installed from nmp:

```
npm install htmlparser2
```

### Checklist If the Helpserver stops Updating 

1. Log in to the helpserver
2. Change to the help folder -  
```
cd /home/AlphaHelp
```
3. Perform a manual git pull - 
```
git pull
```
4. If the git pull brought down files, the git agent must have stopped responding - restart the server.
5. Jiggle the handle:
```
restart helpserver
```
6. Force an update by doing a post from localhost.  
```
curl -d "" http:/127.0.0.1/refresh
```
