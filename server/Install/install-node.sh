#!/bin/sh
##############################################################
#
# Author: Ruslan Khissamov, email: rrkhissamov@gmail.com
#
# Thank you: Alexey Kupershtokh
# http://apptob.org/
##############################################################
# Update System
echo 'System Update'
apt-get -y update
echo 'Update completed'
# Install help app
apt-get -y install libssl-dev git-core pkg-config build-essential curl gcc g++
# Download & Unpack Node.js - v. 0.6.8
echo 'Download Node.js - v. 0.6.8'
mkdir /tmp/node-install
cd /tmp/node-install
wget http://nodejs.org/dist/v0.6.8/node-v0.6.8.tar.gz
tar -zxf node-v0.6.8.tar.gz
echo 'Node.js download & unpack completed'
# Install Node.js
echo 'Install Node.js'
cd node-v0.6.8
./configure && make && checkinstall --install=yes --pkgname=nodejs --pkgversion "0.6.8" --default
echo 'Node.js install completed'
apt-get install npm