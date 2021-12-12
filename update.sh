# move database out
echo "moving database"
mv /database ./database

# removing all files
echo "removing all files"
rm -rf /

echo "Downloading new files"
git clone "www.github.com/cr4fish/z2mDashboard.git"

echo "Moving database back in "
mv ./database /database

echo "Refreshing index"
cd .

# making new update.sh executable
chmod 777 update.sh

echo "=== Done ==="