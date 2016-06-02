# bibliopuce

Small library software (borrowing and returning books management)

Logiciel de gestion d'une petite bibliothèque (gestion d'emprunt de livres)

## Features

* Catalog management
  * Autocomplete book information based on ISBN
  * Compatible with barcode reader
* User management
* Borrowing management
* Support multiple languages
  * english
  * french
* Open source and free forever
* Based on Web technologies and architecture:
  * Written in dynamic scripting languages (Javascript and SQL)
  * Front-end: [HTML5](https://en.wikipedia.org/wiki/HTML5), [jQuery](https://jquery.com/), [Bootstrap](http://getbootstrap.com/), [Twitter's typeahead](https://twitter.github.io/typeahead.js/)
  * Back-end: [Nodejs](https://nodejs.org/en/), [MySQL](https://www.mysql.com/)
* Runs on Linux (Debian 8) and Windows

## Screenshots

### Main menu

![Main menu](doc/screenshot/main_menu_fr.png?raw=true "Main menu (french version)")

### Add book in Catalog (autocompletion based on ISBN)

* When adding a book to your library, you can type in the ISBN or use a barcode reader:
![Add book](doc/screenshot/add_book_en_01.png?raw=true "Add book with autocompletion based on Web Services requests (english version)")
* multiple Web Services are called and information is filled in automatically:
![Add book](doc/screenshot/add_book_en_02.png?raw=true "Add book with autocompletion based on Web Services requests (english version)")

## Install Bibliopuce

Please read [setup/install.md](setup/install.md)


## Start Bibliopuce

### On Windows

    cd bibliopuce
    bin\start.bat

### On Linux

    su - bibliopuce
    cd bibliopuce
    bin/start.sh
