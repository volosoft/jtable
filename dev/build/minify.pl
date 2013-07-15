#!/usr/bin/perl
use strict;
use warnings;

use JavaScript::Minifier qw(minify);

my $srcfile = "../../lib/jquery.jtable.js";
my $dstfile = "../../lib/jquery.jtable.min.js";

open(I, '<', $srcfile) or die "Could not open $srcfile: $!\n";
open(O, '>', $dstfile) or die "Could not open $dstfile: $!\n";
minify(input => *I, outfile => *O);
close(I);
close(O);
