
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

#### Install prerequisites

    apt-get install sudo
    apt-get install git
    apt-get install mysql-server

#### Login as root - create dedicated user

    sudo adduser bibliopuce
    adduser bibliopuce sudo
    su - bibliopuce

#### Get the source code

    git clone https://github.com/e-dot/bcdlibre.git

#### Start setup script

    cd bcdlibre
    bash setup/setup.sh

## Start automatically

### On Linux

To start the software automatically when login in as bibliopuce, add the following to the .profile file:

    ...
    # Autostart at login
    cd $HOME/bibliopuce
    npm start 1>$HOME/bibliopuce.log 2>$HOME/bibliopuce.err &
