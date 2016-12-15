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
Installing the help server on ubuntu 14.04.

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
sudo add-apt-repository -y ppa:webupd8team/java
sudo apt-get update
sudo apt-get -y install oracle-java8-installer
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
sudo apt-get install nodejs
sudo apt-get install npm
sudo apt-get install nodejs-legacy
```

## Clone AlphaHelp into the home folder...

Clone alphahelp, make a folder for generated files, initialize and update the elastic search index and table of contents.

```sh
git clone https://github.com/BuildMan-Alpha/AlphaHelp /home/AlphaHelp
mkdir /home/AlphaHelp/generated
cd /home/AlphaHelp/helpserver
npm install
nodejs initializeserver.js
nodejs updateserver.js
```
## Create the helpserver Service

Copy the configuration file to the /etc/init folder

```sh
cp  /home/AlphaHelp/helpserver/helpserver.conf /etc/init
```

Then start the server...

```sh
start helpserver
```
To Refresh the server modules (new release of helpserver npm).

```sh
stop helpserver
cd /home/AlphaHelp/helpserver/node_modules/help_server
npm update
start helpserver
```


Caveat - nodegit 4.0.0 broken in reposity.js - whenever I refresh the npm now I need to execute this line

```sh
cp /home/repository.js node_modules/helpserver/node_modules/nodegit/lib/repository.js
```

This will need to be done until the fix is rolled into the NPM.

## Running in a Testing Environment

If running in a test environment, you do not need to create a service. Navigate to the helpserver
directory and run the system:

```
node helplocal.js
```

## Starting helpserver on Linux

This needs needs to be every time we restart the machine, but also when we are installing helpserver.


```sh
sudo service elasticsearch restart
```

## Handling case sensitive path issues with Git-Unite

There is a utility in 3rdParty to handle fixups should files appear to be missing on the documentation
server.  Linux has a case sensitive file system, while windows does not, so in order to fix inconsistencies 
in GIT caused by this problem, it is necessary to occasionally run git-unite against the folder.

```cmd
C:\dev\3rdParty\Git\git-unite\src\Git.Unite\bin\Debug>Git.Unite.exe C:\dev\AlphaHelp
```
