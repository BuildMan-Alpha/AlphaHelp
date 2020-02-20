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
sudo git clone https://github.com/BuildMan-Alpha/AlphaHelp /home/AlphaHelp
sudo git clone https://github.com/BuildMan-Alpha/AlphaHelpGen /home/AlphaHelpGen
sudo mkdir /home/AlphaHelp/generated
cd /home/AlphaHelp/helpserver
sudo npm install
sudo cp settingslocal.js settingslocalinit.js
sudo nodejs initializeserver.js ./settingslocalinit.js
sudo nodejs updateserver.js ./settingslocalinit.js
```
## Create the helpserver Service

Copy the configuration file(s) to the /etc/init folder

```sh
sudo cp  /home/AlphaHelp/helpserver/helpserver.conf /etc/init
sudo cp  /home/AlphaHelp/helpserver/elasticsearch.conf /etc/init
```

Then start the server...

```sh
sudo start helpserver
```
To Refresh the server modules (new release of helpserver npm).

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
