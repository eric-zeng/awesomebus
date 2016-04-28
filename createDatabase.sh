dropdb transitdata
rm data/allData.csv
touch data/allData.csv
echo "dropped database transitdata just so we are starting fresh"
createdb transitdata
echo "CREATED DATABASE transitdata"
psql -f createRawGTFSDB.sql transitdata
echo "populated transitdata and joined files routes, trips, and shapes to data/allData.csv"