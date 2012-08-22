MYDIR=$(dirname $0)

clear
node $MYDIR/../replay.js -r | tee $MYDIR/../logs/replay.log
