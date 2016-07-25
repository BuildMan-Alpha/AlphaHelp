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

