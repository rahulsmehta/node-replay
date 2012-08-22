MYDIR=$(dirname $0)

bash $MYDIR/cleanup.sh
clear
node $MYDIR/../replay.js -c | tee $MYDIR/../logs/capture.log
