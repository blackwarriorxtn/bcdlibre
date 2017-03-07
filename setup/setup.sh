#!/bin/bash

echo "[`date +'%Y-%m-%d %H:%M:%S'`] Begin..."

# Define error handling function
handle_error()
{
  echo "[`date +'%Y-%m-%d %H:%M:%S'`] ERROR: $1" >&2
  exit 1
}

echo "[`date +'%Y-%m-%d %H:%M:%S'`] Check prerequisites..."

echo "[`date +'%Y-%m-%d %H:%M:%S'`] mysql"
mysql --help 1>/dev/null 2>/dev/null || handle_error "Please install mysql (sudo apt-get install mysql-server)!"

echo "[`date +'%Y-%m-%d %H:%M:%S'`] git"
git help 1>/dev/null 2>/dev/null || handle_error "Please install git (sudo apt-get install git)!"


echo "[`date +'%Y-%m-%d %H:%M:%S'`] Options..."
read -s -p "MySQL root password [$MYSQL_ROOT_PASSWORD] ?" MYSQL_ROOT_PASSWORD
if [ "$DEFAULT_MYSQL_CREATE_SAMPLE" = "" ] ; then
  DEFAULT_MYSQL_CREATE_SAMPLE=y
fi
echo ""
read -p "Create sample data [$DEFAULT_MYSQL_CREATE_SAMPLE] ?" MYSQL_CREATE_SAMPLE
if [ "$MYSQL_CREATE_SAMPLE" = "" ] ; then
  MYSQL_CREATE_SAMPLE=$DEFAULT_MYSQL_CREATE_SAMPLE
fi
if [ "$MYSQL_CREATE_SAMPLE" = "Y" ] ; then
  MYSQL_CREATE_SAMPLE=y
fi

echo "[`date +'%Y-%m-%d %H:%M:%S'`] Installing nodejs (refer to https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions)"

sudo apt-get install curl || handle_error "Can't instal curl!"
curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash - || handle_error "Can't install nodejs!"
sudo apt-get install -y nodejs || handle_error "Can't install nodejs!"

bash `dirname $0`/setup_node_modules.sh || handle_error "Can't install node modules!"

# Configure mysql
if [ -f /etc/mysql/my.cnf ] ; then
  echo "[`date +'%Y-%m-%d %H:%M:%S'`] Configuring mysql..."
  # ft_min_word_len : Set minimum word length for full-text search
  grep ft_min_word_len 1>/dev/null 2>/dev/null /etc/mysql/my.cnf

  if [ "$?" != "0" ] ; then
    echo "[`date +'%Y-%m-%d %H:%M:%S'`] Set ft_min_word_len=1..."
    my_backup=/etc/mysql/my.cnf.`date +'%Y%m%d%H%M%S'`
    sudo cp /etc/mysql/my.cnf $my_backup || handle_error "Can't backup my.cnf!"
    # Append ft_min_word_len=1 after [mysqld]
    sudo sed -e '/^\[mysqld\]/aft_min_word_len=1' $my_backup > /tmp/my.cnf.new || handle_error "Can't add ft_min_word_len to /tmp/my.cnf.new!"
    sudo cp /tmp/my.cnf.new /etc/mysql/my.cnf || handle_error "Can't copy /tmp/my.cnf.new to my.cnf!"
    # Restart MySQL
    sudo service mysql restart
  else
    echo "[`date +'%Y-%m-%d %H:%M:%S'`] ft_min_word_len already configured in /etc/mysql/my.cnf"
  fi

  # ft_stopword_file : Set custom stopword_file for full-text search (empty)
  grep ft_stopword_file 1>/dev/null 2>/dev/null /etc/mysql/my.cnf

  if [ "$?" != "0" ] ; then
    echo "[`date +'%Y-%m-%d %H:%M:%S'`] Set ft_stopword_file='mysql_ft_stopword_file.txt'..."
    my_backup=/etc/mysql/my.cnf.`date +'%Y%m%d%H%M%S'`
    sudo cp /etc/mysql/my.cnf $my_backup || handle_error "Can't backup my.cnf!"
    # Append ft_stopword_file='mysql_ft_stopword_file.txt' after [mysqld]
    sudo sed -e '/^\[mysqld\]/aft_stopword_file="/etc/mysql/mysql_ft_stopword_file.txt"' $my_backup > /tmp/my.cnf.new || handle_error "Can't add ft_min_word_len to /tmp/my.cnf.new!"
    sudo cp `dirname $0`/mysql_ft_stopword_file.txt /etc/mysql/mysql_ft_stopword_file.txt || handle_error "Can't copy mysql_ft_stopword_file.txt to /etc/mysql/mysql_ft_stopword_file.txt!"
    sudo cp /tmp/my.cnf.new /etc/mysql/my.cnf || handle_error "Can't copy /tmp/my.cnf.new to my.cnf!"
    # Restart MySQL
    sudo service mysql restart
  else
    echo "[`date +'%Y-%m-%d %H:%M:%S'`] ft_min_word_len already configured in /etc/mysql/my.cnf"
  fi

fi

# Change directory to be able to find .sql files below to execute them
cd `dirname $0`/..

echo "[`date +'%Y-%m-%d %H:%M:%S'`] Creating database (empty)..."
mysql --default-character-set=utf8 --user=root --password="$MYSQL_ROOT_PASSWORD" < db/create_database.sql  || handle_error "Can't create database!"

if [ $MYSQL_CREATE_SAMPLE = "y" ] ; then
  mysql --default-character-set=utf8 --user=root --password="$MYSQL_ROOT_PASSWORD" < db/insert_sample_data.sql || handle_error "Can't create sample data!"
fi

echo "[`date +'%Y-%m-%d %H:%M:%S'`] End."
cd `dirname $0`/..
bash bin/start.sh
