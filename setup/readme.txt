
INSTALL

* Install prerequisites
** mysql 5.5
** git
** nodejs

* Launch setup
** On Windows:
  # Get the source code
  git clone git://github.com/e-dot/bibliopuce.git
  CD /D bibliopuce
  CMD /C setup\setup.bat

** On Linux:
    # Login as root
    sudo adduser bibliopuce
    su - bibliopuce
    # Get the source code
    git clone git://github.com/e-dot/bibliopuce.git
    cd bibliopuce
    bash setup\setup.sh
