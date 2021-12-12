#!/bin/bash
# A script that updates foodTracker

pm2 stop z2m

# clone repo -> makes new folder
git pull


# install latest npm libs
echo "Installing npm libs"
npm install

# add permissions
echo "Adding permissions to new update.sh"
chmod 700 update.sh

# restart process
echo "Restarting process"
pm2 restart z2m

#refresh directory
echo "Refreshing indexed directories"
cd .

# done
echo "Done"