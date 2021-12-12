#!/bin/bash
# A script that updates foodTracker

# move database
echo "Moving database out"
mv database/ ..

# step up
cd ..

#remove old folder
rm -rf z2mDashboard

# clone repo -> makes new folder
git clone https://github.com/cr4yfish/z2mDashboard.git

# move database back into food tracker
echo "Moving database back"
mv database/ z2mDashboard/

# install latest npm libs
echo "Installing npm libs"
cd z2mDashboard
npm install

# add permissions
echo "Adding permissions to new update.sh"
chmod 700 update.sh

# restart process
echo "Restarting process"
pm2 restart z2mDashboard

#refresh directory
echo "Refreshing indexed directories"
cd .

# done
echo "Done"