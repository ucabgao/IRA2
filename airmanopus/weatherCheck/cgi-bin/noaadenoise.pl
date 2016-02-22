#!/usr/bin/perl

#-- ----------------------------------------------------------------------------
#-- From http://egb13.net/
#-- Last updated: 2011-09-02
#-- ----------------------------------------------------------------------------
#-- 
#-- Copyright (c) 2009, 2010 EGB13.net
#-- 
#-- Permission to use, copy, modify, and/or distribute this software for any
#-- purpose with or without fee is hereby granted, provided that the above
#-- copyright notice and this permission notice appear in all copies.
#-- 
#-- THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
#-- WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
#-- MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
#-- ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
#-- WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
#-- ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
#-- OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
#-- 
#-- ----------------------------------------------------------------------------
#-- removes (makes transparent) certain colors in a transparent GIF or PNG file
#-- used to remove noise from NOAA weather radar images, tho at the loss of some
#-- valid low-intensity returns.  Intended for use on the radar-only images from
#-- http://radar.weather.gov/Conus/RadarImg/
#--
#-- lately added "-c" option to specify a single color to remove, used for removing
#-- the black background on images found at http://mesonet.agron.iastate.edu/docs/nexrad_composites/
#--
#-- 2011-09-02: Switched to ImageMagick modules for Windows ActiveState Perl
#--             compatilibity, and added option to FTP the results somewhere.
#-- ----------------------------------------------------------------------------

my $VERSION = '$Revision: 1.3 $' ;

my @noise =	(	
			'#e1e1e1'  #some extraneous white in some instances
		,	'#e3e3e3'
		,	'#e6e6e6'
		,	'#e8e8e8'
		,	'#ebebeb'
		,	'#eeeeee'
		,	'#f0f0f0'
		,	'#ffffff'
		,	'#cccc99'
		,	'#663366'
		, 	'#999966'
		,	'#646464'
		,	'#cc99cc'
		,	'#996699'
		, 	'#ccffff'
		,	'#417473'
		,	'#304550'
		,	'#04e9e7'
		,	'#0300f4'
		,	'#019ff4'
		,	'#02fd02'
		) ;
		

my $darkblue = 	'#000000' ;	# darkest  blue 0300f4

use Image::Magick ;	#-- Graphics::Magick ought to work, too; you'd have to change "Image::" where ever it appears

require 'getopt.pl' ;
sub Usage {	my ($msg) = @_ ;

	print STDERR "$msg" if (defined ($msg) && $msg ne "") ;
	print STDERR "Usage: $0 -i inputfile -o outputfile [-f fuzzfactor] [-x] [-c #xxxxxx] [-R ftp://user:pass@site/path/file [-P passwordfile] ]\n" ;
	print STDERR "    fuzzfactor is an integer (default=32)\n    -x to get the extra bit of blue out\n    -c specifies the ONLY color to remove\n" ;
	print STDERR "\n    The outputfile can be FTP'ed to a remote location specified by the -R option.\n" ;
	print STDERR "    For better security, do not specify the password on the command line, but keep\n" ;
	print STDERR "    it in a separate file referenced with the -P option\n" ;
	exit 1 ;
}
&Getopt('iofcRP') ;

&Usage if (defined ($opt_h) ) ;
&Usage ("Please specify input file\n") if (!defined ($opt_i) ) ;
&Usage ("Please specify output file\n") if (!defined ($opt_i) ) ;
$opt_f = 32 unless defined ($opt_f) ;
&Usage ("Fuzz factor must be an integer.") unless ($opt_f =~ m/^\d+$/) ;
push @noise, $darkblue if (defined ($opt_x) ) ;

if (defined ($opt_c) ) {
	if ($opt_c =~ m/^\#?([0-9a-f]{6})$/i) {		#-- works w/ or w/o the "#" in the argument
		@noise = ( "#".$1 ) ;
	} else {
		&Usage (sprintf "Don't recognize a color value in '%s'; use xxxxxx where 'x' is a hex digit.\n", $opt_c) ;
		exit 1 ;
	}
}


#-- parse FTP destination if supplied
my ($user, $pass, $host, $path, $directory, $rfile) ;
if (defined ($opt_R) ) {
	unless ($opt_R =~ m=ftp://([^/:]*:?)([^@]*)@([^/]+)(/.*)=) {
		print STDERR "Invalid FTP destination.\nUse the form 'ftp://userid:password\@ftp.host.name/path/filename'\n" ;
		print STDERR "E.g.: ftp://user:pass\@some.host.com/pub/files/filename.gif\n" ;
		exit 1 ;
	}
	($user, $pass, $host, $path) = ($1, $2, $3, $4) ;
	($directory, $rfile) = $path =~ m=(.*)/([^/]+)= ;

	if (defined ($opt_P) ) {
		open (PW, $opt_P) || die "$opt_P: $!\n" ;
		$pass = <PW> ;
		$pass =~ s/\s*$// ;
		close PW ;
	}

	use Net::FTP ;
}


my $img = Image::Magick->new;
my $res = $img->Read($opt_i) ;
die "$opt_i: $!\n" if ($res) ;

$img->Set(colorspace => RGB, type => TrueColor) ;
foreach my $color (@noise) {
	$img->Transparent(color => $color, fuzz => $opt_f) ;
}
$res = $img->write(filename => $opt_o) ;
die "$opt_o: $!\n" if ($res) ;

undef $img ;

#-- FTP the image file elsewhere if an FTP URL is given with the -R option
if (defined ($opt_R) ) {
	printf STDERR "Sending %s to %s:%s/%s ... "
		, $opt_o
		, $host
		, $directory
		, $rfile
		;

	my $ftp = Net::FTP->new($host, Debug => 0, Passive => 1)
		|| die "Cannot connect to $host: $@\n";
	$ftp->login($user,$pass)
		|| die "Cannot login ", $ftp->message;
	$ftp->cwd($directory)
		|| die "Cannot change working directory ", $ftp->message;
	$ftp->binary ;
	$ftp->put($opt_o, $rfile)
		|| die "put failed ", $ftp->message;
	$ftp->quit;

	print STDERR "Success\n" ;
}



exit 0 ;

