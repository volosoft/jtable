#!/bin/sh
JSDIR=".."
MANIFEST="./MANIFEST"
DSTFILE="../../lib/jquery.jtable.js"

cat /dev/null > $DSTFILE

for x in $(cat $MANIFEST); do
    cat $JSDIR/$x >> $DSTFILE
    printf "\n\n" >> $DSTFILE
done
