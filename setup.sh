#!/bin/bash
# A script that install foodTracker

echo "Welcome to z2m Dashboard v2. Performing first-time install..."

echo "Pm2 is needed for this to work!"

# update update.sh chmod
chmod 700 update.sh

echo "Added z2m to pm2"
pm2 start index.js --name z2m

echo "Done"