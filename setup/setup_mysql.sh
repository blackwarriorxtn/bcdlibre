#!/bin/bash

# Define error handling function
handle_error()
{
  echo "[`date +'%Y-%m-%d %H:%M:%S'`] ERROR: $1" >&2
  exit 1
}

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

cd `dirname $0`/..
