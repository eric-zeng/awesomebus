dropdb transitdata
echo "dropped database transitdata just so we are starting fresh"
createdb transitdata
echo "CREATED DATABASE transitdata"
psql -f createRawGTFSDB.sql transitdata
echo "populated transitdata"
