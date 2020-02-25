# AlphaHelp
Alpha Software Documentation

# Guidelines

Metadata stored in pages

values for tags : (can be one or more)
  + common - common to web and desktop.
  + web - web server only functionality
  + desktop - desktop only functionality
  + legacy - page is marked as legacy (omitted)
  + review - page is marked for review.
  + dbf - common DBF tag, tag these to make it easier to filter out DBF functions.


# Installation on Ubuntu
Installing the help server on ubuntu 14.04.6 LTS

## Prerequisites

If 'sudo add-apt-repository' fails - you will first need to install this. 

```sh
sudo apt-get install python-software-properties
sudo apt-get install apt-file
apt-file update
apt-file search add-apt-repository
sudo apt-get install software-properties-common
```

## Installing helpserver on Linux

First, installing Elasticsearch is required - install java8 before installing elastic search.

```sh
sudo add-apt-repository ppa:openjdk-r/ppa
sudo apt-get update
sudo apt-get -y install openjdk-8-jdk
wget -O - http://packages.elasticsearch.org/GPG-KEY-elasticsearch | sudo apt-key add -
echo 'deb http://packages.elasticsearch.org/elasticsearch/1.4/debian stable main' | sudo tee /etc/apt/sources.list.d/elasticsearch.list
sudo apt-get update
sudo apt-get -y install elasticsearch=1.4.4
```

Edit the install uncomment line 'network.host: localhost' to restrict access to the elasticsearch service to just the host machine

```sh
sudo vi /etc/elasticsearch/elasticsearch.yml
```

If you don't have a different editor here is a quick summary of the commands you will need

cursor keys (to navigate) work as expected to move to the file location. 
x - delete character cursor is over
:wq - this sequence of characters writes the file and exist vi.

Then, start the elastic search service:

```sh
sudo start elasticsearch
```

## Installing GIT

To install git, which is required for getting and refreshing the help repo:

```sh
sudo apt-get update
sudo apt-get install git
```

## Installing node

To install node, execute the following.  nodejs-legacy must also be installed because nodegit has dependencies on 'node', not 'nodejs'.

```sh
sudo apt-get update
curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo apt-get install npm
sudo apt-get install nodejs-legacy
```

## Clone AlphaHelp into the home folder...

Clone alphahelp, make a folder for generated files, initialize and update the elastic search index and table of contents.

```sh
sudo git clone https://github.com/BuildMan-Alpha/AlphaHelp /home/AlphaHelp
sudo git clone https://github.com/BuildMan-Alpha/AlphaHelpGen /home/AlphaHelpGen
sudo mkdir /home/AlphaHelp/generated
sudo mkdir /home/AlphaHelp/generated/topics
sudo mkdir /home/AlphaHelp/generated/plaintext
sudo mkdir /home/AlphaHelp/transform/generated
sudo mkdir /home/AlphaHelp/transform/generated/topics
sudo mkdir /home/AlphaHelp/transform/generated/plaintext
cd /home/AlphaHelp/helpserver
sudo npm install
```



### If npm complains about nodegit

Make sure version 0.26.1 of nodegit is installed (should be resolved in future versions of helpserver):

```sh
sudo npm install nodegit@0.26.1
```

If the nodegit install fails because libstdc++ is missing, install it. The error message from nodegit will have instructions on how to install libstdc++. Below are the commands for installing libstdc++ version 4.9:

```sh
sudo add-apt-repository ppa:ubuntu-toolchain-r/test
sudo apt-get update
sudo apt-get install libstdc++4.9-dev
```

## Create the helpserver Service

Copy the configuration file(s) to the /etc/init folder

```sh
sudo cp  /home/AlphaHelp/helpserver/helpserver.conf /etc/init
sudo cp  /home/AlphaHelp/helpserver/elasticsearch.conf /etc/init
sudo cp  /home/AlphaHelp/helpserver/transform.conf /etc/init
```

Then, initialize the server. Replace "settings.json" with the name of the JSON file that contains the helpserver settings.

```sh
sudo nodejs initializeserver.js ./settings.json
sudo nodejs updateserver.js ./settings.json
```

If Initialization fails with CERT_UNTRUSTED, run the commands below. Then try initializing the server again.

```sh
sudo npm config set strict-ssl false
```

## Install xsltproc

Install xsltproc if it is not already installed:

```sh
sudo apt-get install xsltproc
```
## Start the helpserver Service

Then start the server...

```sh
sudo start helpserver
```

## Initialize the Helpserver TOC and Search Indicies

The first time in, there will be no generated table of contents. If you are running the helpserver with elasticsearch, the search index for the help system will also not exist. Before you can start browsing and searching the help system, you must initilize the index and TOC. The system can be initilized by refreshing the help index:

```sh
curl --insecure -d "" https://127.0.0.1/refresh
curl --insecure -d "" https://127.0.0.1/TransFormDocumentation/refresh
```

## Refreshing Server Modules

To refresh the server modules (new release of helpserver npm).

```sh
sudo stop helpserver
cd /home/AlphaHelp/helpserver/node_modules/help_server
sudo npm update
sudo start helpserver
```

Caveat - nodegit 4.0.0 broken in reposity.js - whenever I refresh the npm now I need to execute this line

```sh
sudo cp /home/repository.js node_modules/helpserver/node_modules/nodegit/lib/repository.js
```

This will need to be done until the fix is rolled into the NPM.

## Running in a Testing Environment

If running in a test environment, you do not need to create a service. Navigate to the helpserver
directory and run the system:

```
sudo node helplocal.js
```

## Starting helpserver on Linux

This needs needs to be every time we restart the machine, but also when we are installing helpserver.


```sh
sudo service elasticsearch restart
```

## Troubleshooting Linux server

If the help server crashes, there are a number of logs to show what went wrong.
The first place to look is the helpserver crash log file which exists in a generated file called
helpserver_error.log.  The command to see the contents of this log file is this:

```
cat /home/AlphaHelp/generated/helpserver_error.log 
```

The node.js log exists here (this captures the output from the helpserver process, including tracking regeneration of indexes for pages).
To see these dump node.log using this command:

```
cat /var/log/node.log
```

The Log for the helpserver service exists in a file called helpserver.log - in the upstart subfolder here:

```
cat /var/log/upstart/helpserver.log
```

If the logs are too big, 'rm' them and retry - if there is still a problem, the logs will be regenerated.

## Setting GIT Webhook for Repository

Log in as buildman@alphasoftware.com to set the repository links on the AlphaHelp project

```
https://github.com/BuildMan-Alpha/AlphaHelp/settings/hooks
```

Add the server to the webhooks - remember to copy the secret from your 'settings.json' file in the helpserver folder.

## Handling case sensitive path issues with Git-Unite

There is a utility in 3rdParty to handle fixups should files appear to be missing on the documentation
server.  Linux has a case sensitive file system, while windows does not, so in order to fix inconsistencies 
in GIT caused by this problem, it is necessary to occasionally run git-unite against the folder.

```cmd
C:\dev\3rdParty\Git\git-unite\src\Git.Unite\bin\Debug>Git.Unite.exe C:\dev\AlphaHelp
```
