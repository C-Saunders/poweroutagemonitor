#!/usr/bin/env bash

# This should be run on the *server*
sudo supervisorctl stop nodeapp
sudo git checkout .
sudo git pull
npm install
npm run build
sudo supervisorctl start nodeapp
