# AlphaHelp
Alpha Software Documentation

##Installing helpserver on Linux

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

##Starting helpserver on Linux

This needs needs to be every time we restart the machine, but also when we are installing helpserver.

```sh
sudo service elasticsearch restart
```
