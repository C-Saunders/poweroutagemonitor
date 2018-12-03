#!/usr/bin/env bash

# This should be run on the *server*
sudo supervisorctl stop nodeapp
sudo git pull
sudo supervisorctl start nodeapp
