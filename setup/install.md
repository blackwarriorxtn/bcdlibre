
# INSTALL

## Install prerequisites

* [mysql 5.5](http://dev.mysql.com/downloads/mysql/)
* [git](https://git-scm.com/)
* [nodejs](https://nodejs.org)

Please note that nodejs installation is automated with the setup.sh script (see below).

## Launch setup

### On Windows

#### Get the source code

    git clone git://github.com/e-dot/bibliopuce.git

#### Start setup script

    CD /D bibliopuce
    CMD /C setup\setup.bat

### On Linux (Debian 8):

#### Login as root - create dedicated user

    sudo adduser bibliopuce
    adduser bibliopuce sudo
    su - bibliopuce

#### Get the source code

    git clone git://github.com/e-dot/bibliopuce.git

#### Start setup script

    cd bibliopuce
    bash setup\setup.sh
