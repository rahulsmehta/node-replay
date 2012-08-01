MYDIR=$(dirname $0)

rm -f -r $MYDIR/../logs/ && mkdir $MYDIR/../logs/
rm -f -r $MYDIR/../data/ && mkdir $MYDIR/../data/
rm -f $MYDIR/../logs/capture.log
rm -f $MYDIR/../logs/replay.log
