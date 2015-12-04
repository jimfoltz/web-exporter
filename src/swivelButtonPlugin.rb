# Copyright 2008 Google Inc.
# All Rights Reserved.

##
# @fileoverview swivel.rb is the entry point for the swivel 
# sketchup plugin. This plugin  makes the camera orbit a model and
# produce a series of pictures. 
# These pictures can then be used with the generated HTML/javascript to
# view the object in a web page.
#
# Permission to use, copy, modify, and distribute this software for 
# any purpose and without fee is hereby granted, provided that the above
# copyright notice appear in all copies.
#
# THIS SOFTWARE IS PROVIDED "AS IS" AND WITHOUT ANY EXPRESS OR
# IMPLIED WARRANTIES, INCLUDING, WITHOUT LIMITATION, THE IMPLIED
# WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.
##

require "swivelButtonPlugin/swivelButton.rb"


##
# Create the orbitalImaging button in the SketchUp app
##
def createPlugin()
  SwivelButton.init()
end

##
# Main entry point -- create the plugin
##
createPlugin()
