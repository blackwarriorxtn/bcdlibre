
# INSTALL

## Install prerequisites

* [mysql 5.5](http://dev.mysql.com/downloads/mysql/)
* [git](https://git-scm.com/)
* [nodejs](https://nodejs.org)

Please note that nodejs installation is automated with the setup.sh script (see below).

## Launch setup

### On Windows

#### Get the source code

    git clone https://github.com/e-dot/bcdlibre.git

#### Start setup script

    CD /D bcdlibre
    CMD /C setup\setup.bat

### On Linux (Debian 8):

#### Install prerequisites (as root)

    apt-get install sudo
    apt-get install git
    apt-get install mysql-server

#### Create dedicated user (via sudo)

    sudo adduser bibliopuce
    sudo adduser bibliopuce sudo
    su - bibliopuce

#### Get the source code

    git clone https://github.com/e-dot/bcdlibre.git

#### Start setup script

    cd bcdlibre
    bash setup/setup.sh

### On Linux (Ubuntu Desktop 16.04.2):

#### Install prerequisites (as any user member of the sudo group)

    sudo apt-get install git
    sudo apt-get install mysql-server

#### Login as root - create dedicated user

    sudo adduser bibliopuce
    sudo adduser bibliopuce sudo
    su - bibliopuce

#### Get the source code

    git clone https://github.com/e-dot/bcdlibre.git

#### Start setup script

    cd bcdlibre
    bash setup/setup.sh

## Start automatically (Debian/Ubuntu)  

### On Linux

To start the software automatically when login in as bibliopuce, add the following to the .profile file:

    ...
    # Autostart at login
    cd $HOME/bcdlibre   
    npm start 1>$HOME/bcdlibre.log 2>$HOME/bcdlibre.err &
