# Copyright 2008 Google Inc.
# All Rights Reserved.

##
# @fileoverview swivelButton.rb creates a SketchUp plugin button
# that makes the camera orbit a model and produce a series of pictures.
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

require File.dirname(__FILE__) + "/bin/RubyZip"

##
#  Treat the swivelButton as a singleton
##
class SwivelButton


@@pluginDirectory = File.dirname(__FILE__)
@@title = "SketchUp Web Exporter"
@@swivelDlg = 0


##
# Main entry point
##
def SwivelButton::init()

  # Somehow we do not have a current directory. Alert the user and end.
  if !File.directory?(@@pluginDirectory)
    alert(@@title + " plugin has encountered an error:\n" +
          "Could not find the plugin directory. " +
          "Please re-install the plugin.")
    return
  end

  # make sure the plugin was installed correctly
  tempImgDirectory = @@pluginDirectory + "/images"
  if !File.directory?(tempImgDirectory) || 
     !File.writable?(tempImgDirectory) 
    alert(@@title + " plugin has encountered an error:\n" +
          "Could not find or could not write temporary images to:\n" +
          "[" + tempImgDirectory + "]\n" + 
          "Please re-install the plugin.")
    return
  end

  cmd = UI::Command.new(@@title) {handleToolbarButtonPress()}
  cmd.small_icon = tempImgDirectory + "/swivelButtontb.png"
  cmd.large_icon = tempImgDirectory + "/swivelButtontb.png"
  cmd.status_bar_text = cmd.tooltip = "Create a set of images orbiting a model"
  cmd.menu_text = @@title
  swivelToolbar = UI::Toolbar.new(@@title) 
  swivelToolbar.add_item(cmd)
  swivelToolbar.show

  UI::menu('Tools').add_item(cmd);
end 


##
# When the user presses the swivel button in the toolbar, this function
# sets up the camera, takes the pictures and displays a progress dialog box.
##
def SwivelButton::handleToolbarButtonPress()
  # initialize the image size
  @@imageWidth = Sketchup.read_default @@title, "defaultImageSize"
  if(!@@imageWidth || @@imageWidth < 50 || @@imageWidth > 600)
    @@imageWidth=400
  end
  @@imageHeight = @@imageWidth

  @@modelName = createModelName()
  # create an image to use for the first shot
  tempImgDirectory = @@pluginDirectory + "/images"
  tempImage =  tempImgDirectory + "/swivelButtonTempImage.jpg"

  # make sure the directory exists
  if !File.directory?(tempImgDirectory) || 
     !File.writable?(tempImgDirectory) ||
     (File.exist?(tempImage) && !File.writable?(tempImage))
    alert(@@title + " plugin has encountered an error:\n" +
          "Could not find or could not write the temporary image to:\n" +
          "[" + tempImage + "]\n" + 
          "Please re-install the plugin.")
    return
  end

  # zoom extents
  zoomInitial()
  # save the image
  # saveModelImage(tempImage, false, false)

  @@swivelDlg = UI::WebDialog.new @@title, false, @@title, 490, 700, 10, 10, false
  @@swivelDlg.set_file @@pluginDirectory + "/html/swivelButton.html"
  # @@swivelDlg.set_size 490, 670
  resizeWindow(490, 670, @@imageWidth, @@imageHeight, @@swivelDlg)
  
  addGenerateImagesButtonCallback()
  addCancelButtonCallback()
  addCloseCallback()
  addOpenPage()
  addGetDirectoryCallback()
  addCreateDirectoryCallback()
  addCaptureNextImageCallback()
  addSaveDialogSettingsCallback()
  addResizeWindowCallback()
  addOpenFolderCallback()

  # Now show the dialog 
  @@swivelDlg.show_modal {
    @@imageDirectory = Sketchup.read_default @@title, "defaultDirectory"
    # make sure the variable was set
    if !@@imageDirectory
      @@imageDirectory = @@pluginDirectory + "/results/"
    end 

    #if it does not exist, make it
    if !File.exist?(@@imageDirectory)
      begin
         Dir.mkdir(@@imageDirectory)
      rescue
         @@imageDirectory = @@pluginDirectory + "/results/"
      end      
    else 
      # see if we can write to it
      if !File.directory?(@@imageDirectory) ||
         !File.writable?(@@imageDirectory)
        @@imageDirectory = @@pluginDirectory + "/results/"
      end
    end 

    #make sure it is a writable directory. Since we default to the 
    #plugin directory, if this fails, then they need to re-install.
    if !File.directory?(@@imageDirectory) ||
       !File.writable?(@@imageDirectory)
      alert(@@title + " plugin has encountered an error:\n" +
            "Could not access the model directory:\n" +
            "[" + @@imageDirectory + "]\n" + 
            "Please re-install the plugin.")
      return
    end

    # read in the image count and convert the string to an integer
    @@imageCount = Sketchup.read_default @@title, "defaultImageCount"
    @@imageCount = @@imageCount.to_i

    if !@@imageCount || @@imageCount < 3
      @@imageCount = 36
    end

    # make sure we have a model name
    @@modelName = createModelName()

    script = "init('" + @@imageDirectory  + "', " + 
                   "'" + @@modelName + "', " +  
                   @@imageCount.to_s + ", " + 
                   modelImageWidth().to_s + 
                   ");"
                   
    @@swivelDlg.execute_script(script)
  }
end # end of handleToolbarButtonPress()


##
# Create the HTML file by appending _index.html to the end of the 
# model name
##
def SwivelButton::getIndexFile() 
  return @@modelName + "_index.html"
end


##
# Return the full path to the HTML file
##
def SwivelButton::getIndexFilePath()
  return @@modelDirectory + "/" + getIndexFile();
end


##
# Add a callback to generate the images.
##
def SwivelButton::addGenerateImagesButtonCallback()
  @@swivelDlg.add_action_callback("handleGenerateImagesButtonPress") do |d, p|
    handleGenerateImagesButtonPress(d,p)
  end
end


##
# Add a callback to cancel the dialog.
##
def SwivelButton::addCancelButtonCallback()
  @@swivelDlg.add_action_callback("cancel") do |dlg, p|
    @@swivelDlg.close()
  end
end 


##
# Add a callback to close the dialog.
##
def SwivelButton::addCloseCallback()
  @@swivelDlg.add_action_callback("close") do |dlg, p|
    @@swivelDlg.close()
  end
end

##
# Add a callback to open a web page
##
def SwivelButton::addOpenPage()
  @@swivelDlg.add_action_callback("openPage") do |dlg, p|
    UI::openURL File.dirname(__FILE__) + "/html/" + p
  end
end

##
# Add a callback to get the sub-directories of a given directory.  
# This will return a comma separated list of all the directories 
# that live directly below the given path.  
##
def SwivelButton::addGetDirectoryCallback()
  @@swivelDlg.add_action_callback("getDirectory") { |dlg, path|
    begin
      d = Dir.new(path); 
    rescue
      return ""
    end
    
    children = Array.new

    d.each do |f| 
      if(File.directory?(d.path + '/' + f) && 
                         f != '.' && f != '..') 
        begin
          tmp = Dir.new(d.path + '/' + f)
          children.push(f) 
        rescue
        end
      end
    end
    dirs = "";
    0.upto(children.length-1) do |i|
      dirs = dirs + "," if(i != 0);
      dirs = dirs + children[i]
    end
    script = "GetDirectoryDialog.rubyUpdateToDirectory('"  + path + "', '" + dirs + "');"
    dlg.execute_script(script)
  }
end 


##
# Add a callback to create a directory.
# The parameter is a comma-separated pair: the directory
# name and the user-supplied directory name.
# Status is 1 if good and 0 if bad
##
def SwivelButton::addCreateDirectoryCallback()
  @@swivelDlg.add_action_callback("makeDir") { |dlg, pathAndName|
    path,name = pathAndName.split(',')

    #status is good
    status = 1;
    begin
      Dir.mkdir path + "/" + name
    rescue
      status = 0;
    end

    pathName = path + "/" + name
    script = "GetDirectoryDialog.rubyCreateDirectory('" + pathName + "', " + 
                                                     status.to_s + ");"
    @@swivelDlg.execute_script(script)
  }
end 


##
# Add a callback to handle image capture requests from javascript 
##
def SwivelButton::addCaptureNextImageCallback()
  @@swivelDlg.add_action_callback("captureNextImage") { |d, p|
    handleCaptureNextImage()
  }
end


##
# Save the model as a set of images. This uses the current camera
# position to generate the image.
##
def SwivelButton::saveModelImage(jpgFile, zoomExtentsPreview, includeGELayers)
  Sketchup.active_model.start_operation "saveModelImage"
  if includeGELayers == false
    # if it's on right now, turn off visibility of the Google Earth layer.
    allLayers = Sketchup.active_model.layers
    allLayers.each {|x|
      if x.name == "Google Earth Snapshot" || x.name == "Google Earth Terrain"
        x.visible = false
      end
    }
  end
      
  # saves a preview image having the proper dimensions to the file specified
  model   = Sketchup.active_model
  myview = model.active_view

  # make sure we're getting the whole picture
  if zoomExtentsPreview == true
    myview.zoom_extents
  end
  
  # force a redraw
  myview.invalidate
  
  # go ahead and write out the file now
  wNow = myview.vpwidth
  hNow = myview.vpheight
  
  # determine the height to preserve the aspect ratio
  height = modelImageWidth*hNow/wNow
  
  jpgFile.gsub!(/\\/,"/")
  oldvalue = Sketchup.active_model.rendering_options["DrawSilhouettes"]
  Sketchup.active_model.rendering_options["DrawSilhouettes"] = false

  # actually draw the thing
  viewresult = myview.write_image(jpgFile,modelImageWidth,
    modelImageHeight,true)

  Sketchup.active_model.rendering_options["DrawSilhouettes"] = oldvalue
  Sketchup.active_model.abort_operation
  return viewresult
end  # end of saveModelImage()


##
# return preview image width (in pixels)
##
def SwivelButton::modelImageWidth
  return @@imageWidth;
end


##
# Return the image height
##
def SwivelButton::modelImageHeight
  return @@imageHeight;
end


##
# Create the model directory name based on the title of the model.
##
def SwivelButton::createModelName()
  modelName = Sketchup.active_model.title

  # make sure it is a valid filename by stripping everything but chars, nums
  modelName = modelName.gsub(/[^a-zA-Z0-9]*/, "")

  # if the name is empty, call it "model"
  if (modelName.length < 1) 
    modelName = "model";
  end

  return modelName
end


##
# This gets called when the user presses on the button in the toolbar
##
def SwivelButton::handleGenerateImagesButtonPress(d,p)
  @@imageDirectory, @@imageCount = p.split(',')
  @@imageCount = @@imageCount.to_i
  @@imageIndex = 0

  @@modelDirectory = @@imageDirectory
  
  fileGlob = @@modelDirectory + "/" + @@modelName + "_i*";
  #
  # Make the new directory
  #
  if File.exist?(@@modelDirectory) == false
    begin
      Dir.mkdir(@@modelDirectory)
    rescue
      alert("Cannot create " + @@modelDirectory + 
                     " Please provide a different name.")
      return
    end
  elsif(Dir[fileGlob].length > 0)
    overwriteStatus = UI::messagebox(@@modelDirectory + 
                      " contains files that will be overwritten. Do you want to continue?",
                      MB_OKCANCEL)
    ok = 1  
    if overwriteStatus != ok
      return
    end
  end

  createHTMLForImages()

  # save the state to disk
  saveDialogSettings()

  setupBeforeMakingScenes()

  # get the first image
  handleCaptureNextImage()

end  # end of handleGenerateImagesButtonPress()


##
# Allow the javascript to save the dialog state
##
def SwivelButton::addSaveDialogSettingsCallback()
  @@swivelDlg.add_action_callback("saveDialogSettings") do |d, p|
    @@imageDirectory,@@imageCount = p.split(',')    
    saveDialogSettings()
  end
end


##
# When the user clicks on a folder, we fire a callback event.
# This adds that callback.
##
def SwivelButton::addOpenFolderCallback()
  @@swivelDlg.add_action_callback("openFolder") do |d, p|
    UI::openURL p
  end
end


##
# Resize the dialog window
##
def SwivelButton::resizeWindow(w, h, imageW, imageH, d)
    @@imageWidth = imageW.to_i
    @@imageHeight = imageH.to_i
    tempImage =  @@pluginDirectory + "/images/swivelButtonTempImage.jpg"
    saveModelImage(tempImage, false, false)
    w = w.to_i
    h = h.to_i
    d.set_size w,h
end


##
# Add a callback to the resizing of the window.
##
def SwivelButton::addResizeWindowCallback()
  @@swivelDlg.add_action_callback("resizeWindow") do |d, p|
    w, h, imageW, imageH = p.split(',')    
    resizeWindow(w, h, imageW, imageH, d)
  end
end


##
# Save the dialog settings
##
def SwivelButton::saveDialogSettings()
  Sketchup.write_default @@title, "defaultDirectory", @@imageDirectory
  Sketchup.write_default @@title, "defaultImageCount", @@imageCount
  Sketchup.write_default @@title, "defaultImageSize", modelImageWidth
end


##
# Callback from javascript to generate the next image
##
def SwivelButton::handleCaptureNextImage()
  if @@imageIndex >= @@imageCount
    @@imageIndex = 0
  end

  @@imageFilename = @@modelDirectory + "/" + @@modelName + "_image" +  
                   (@@imageCount - @@imageIndex - 1).to_s + ".jpg"

  orbitSceneAndSavePicture()
  @@imageIndex = @@imageIndex + 1

  # call the javascript code so it can update the progress bar.
  # if we are done then restore the state
  if (@@imageIndex < @@imageCount) 
    imgCount = @@imageIndex - 1
    script = "getNextImage('" + @@imageFilename + "', " + imgCount.to_s + ")"
    @@swivelDlg.execute_script(script)
  else
    @@swivelDlg.execute_script("showLastImage('" + @@imageFilename + "')")
    restoreState()
    # now store everything in a zip file
    arrayString = ""
    count = (@@imageCount-1)
    for i in 0..count
      arrayString += " '" + @@modelDirectory + "/" + @@modelName +  "_image" + i.to_s + ".jpg',\n"
    end 
    arrayString = arrayString[0..arrayString.rindex(',')-1] # no comma
    # build up the command
    filename = "'" + @@modelDirectory + "/" + getIndexFile() + "'"
    zipfile= "'" + @@modelDirectory + @@modelName + ".zip'"
    cmd = "RZipper.zip " + zipfile + ", " + filename + ", " + arrayString;
    eval(cmd);
  end 
end 


##
# Set up the layers and isometric viewpoints
##
def SwivelButton::setupBeforeMakingScenes()
  preserveState()

	# if it's on right now, turn off visibility of the Google Earth layer.
  allLayers = Sketchup.active_model.layers
  allLayers.each {|x|
    if x.name == "Google Earth Snapshot" || x.name == "Google Earth Terrain"
       x.visible = false
    end
  }

  # zoom extents
  Sketchup.active_model.active_view.zoom_extents

  # invalidate the current view
  Sketchup.active_model.active_view.invalidate

	# get camera positions
	@@endpoints = getCameraPositions(@@imageCount)
  
	# get camera targets
	@@camtargs = getCameraTargets()
end


##
# Draw a segmented circle around the model and return the edges.
# We will use these edges to guide the camera around the model.
##
def SwivelButton::makeCirclePath(numseg)
  eyeNow    = Sketchup.active_model.active_view.camera.eye
  targetNow = Sketchup.active_model.active_view.camera.target
 
  # draw the circle at our elevation (z coord)
  bb = Sketchup.active_model.bounds;
  bbcenter = bb.center;
  
  centerpoint = targetNow;
  zvec = Geom::Vector3d.new(0,0,1)

  viewvec = eyeNow - targetNow
  unitviewvec = viewvec.normalize;

  # add a boundary by backing up a bit more,
  standoff_distance = getStandoffDistance() * 1.1;  
  
  # the eye will lie along the current view line so it is 
  # standoff_distance away from the target
  standoff_vec = unitviewvec;
  standoff_vec.length = standoff_distance;
  standoff_eyepoint = bbcenter + standoff_vec;
 
  new_radius = Math.sqrt(standoff_vec.x*standoff_vec.x + 
                         standoff_vec.y*standoff_vec.y);
  
  centerpoint.z = standoff_eyepoint.z;
  z = centerpoint.z;

  # This is a circle in a plane parallel to the x-y plane with 
  # center = centerpoint
  # radius = new_radius
	edges =	Sketchup.active_model.active_entities.add_circle(centerpoint,zvec,new_radius,numseg);

	return [edges, standoff_eyepoint]
end


##
# Draw a segmented (numseg) circle around the model, then store the 
# vertices as positions for the camera and remove the edges.
##
def SwivelButton::getCameraPositions(numseg)
  # Start a transaction so that we can remove it from the UNDO list
  Sketchup.active_model.start_operation "CreateTempCircle"

	# make a circle's worth of edges
	edges, pointoncircle = makeCirclePath(numseg)

	# go through these edges and build an array of endpoints
	endpoints = []
	edges.each {|thisedge|
		vtxs = thisedge.vertices
		p1 = vtxs[0].position
		endpoints.push(p1)
	}
	Sketchup.active_model.abort_operation

  # now sort based on the pointoncircle
  dist = 10e16 # a big number
  bestIndex = -1
  curIndex = 0
  endpoints.each { |p|
    d = p.distance pointoncircle
    if(d < dist)
      dist = d
      bestIndex = curIndex
    end
    curIndex = curIndex + 1
  }

  pnts = []
  0.upto(endpoints.length-1) { |i|
     pnts.push(endpoints[(i+bestIndex)%endpoints.length])
  }
  
  # ok, now pass back the endpoints that we pulled out
	return pnts
end


##
# Get the locations for where to place the camera.
##
def SwivelButton::getCameraTargets()
	# return the target and the up-target for the current view
	upNow     = Sketchup.active_model.active_view.camera.up
  eyeNow    = Sketchup.active_model.active_view.camera.eye
  targetNow = Sketchup.active_model.active_view.camera.target

  zVec      = Geom::Point3d.new(0.0,0.0,1.0) - Geom::Point3d.new(0.0,0.0,0.0) 
  upTarget  = Geom.intersect_line_line([eyeNow,upNow],[targetNow,zVec])
  if upTarget == nil 
		upTarget = targetNow + Geom::Vector3d.new(0.0,0.0,10000000.0)
  end

	# need to make targetNow be the center, and upTarget should be directly above
	# the center by an appropriate amount (twice the bounding box height, say)
 	bb=Sketchup.active_model.bounds
  pmax = bb.max
	pmin = bb.min
	zdiff = bb.max[2]-bb.min[2]
	pcenter = bb.center
	targetNow = pcenter
	up = Geom::Vector3d.new(0.0,0.0,1.3*zdiff)
	upTarget = pcenter + up
	return [targetNow, upTarget]
end


##
# Compute the diameter that circumscribes the bounding box
##
def SwivelButton::getBBoxDiam()
  bb = Sketchup.active_model.bounds;
  len = (bb.max-bb.min).length;
  return len;
end


## 
# Compute how far away the camera should be to see the entire model.
##
def SwivelButton::getStandoffDistance()
  bboxdiam = getBBoxDiam();
  bboxradius = bboxdiam/2;
  foveff = Sketchup.active_model.active_view.camera.fov * 3.14159265/180.0
  standoff = bboxradius/Math.sin(foveff/2);
  return standoff;
end


##
# Save the state before we start moving the camera
##
def SwivelButton::preserveState()
  @@camera = Sketchup.active_model.active_view.camera;
  @@eyeOrig    = @@camera.eye;
  @@upOrig     = @@camera.up;
  @@targetOrig = @@camera.target;
  @@lengthOrig = @@camera.focal_length;
  @@fovOrig    = @@camera.fov;
  @@imageWidOrig = @@camera.image_width;
end


##
# Once done with the process, restore the state.
##
def SwivelButton::restoreState()
  #Sketchup.active_model.active_view.camera = @@camera;
  Sketchup.active_model.active_view.invalidate
  c2 = Sketchup::Camera.new;
 
  c2.fov = @@fovOrig;
  c2.focal_length = @@lengthOrig;
  c2.image_width = @@imageWidOrig;
  c2.set(@@eyeOrig,@@targetOrig,@@upOrig);

  Sketchup.active_model.active_view.camera = c2;
  
  allLayers = Sketchup.active_model.layers
  allLayers.each {|x|
    if x.name == "Google Earth Snapshot" || x.name == "Google Earth Terrain"
      x.visible = true;
    end
  }
end



##
# Orbit around the model and save each camera shot as an image
##
def SwivelButton::orbitSceneAndSavePicture()
  cTarg  = @@camtargs[0]
  upTarg = @@camtargs[1]

  ep = @@endpoints[@@imageIndex]

  c = Sketchup::Camera.new
  upvec = upTarg-ep
  c.set(ep,cTarg,upvec)

  # now stick this camera on our view
  Sketchup.active_model.active_view.camera = c

  # now take a picture and put it there
  zoomExtentsPreview = false
  includeGELayers = false
  saveModelImage(@@imageFilename, zoomExtentsPreview, includeGELayers)
end


##
# Create the HTML that uses the images as an example for the user.
# This method uses a template that the user can modify.
##
def SwivelButton::createHTMLForImages()
  filename = @@pluginDirectory  + "/html/jsTemplate.html"
  fileString = ''

  # This will also close the file
  File.open(filename, "r") { |f|
    fileString = f.read
  }

  arrayString = "var imageFileNameArray = new Array(\n"
  count = (@@imageCount-1)
  for i in 0..count
    arrayString += " '" + @@modelName +  "_image" + i.to_s + ".jpg',\n"
  end 
  arrayString += "  '" + @@modelName  + "_image" + count.to_s + ".jpg');\n\n"

  # string replace <$IMAGE_ARRAY />  
  fileString = fileString.gsub(/\$IMAGE_ARRAY/, arrayString)
  fileString = fileString.gsub(/\$WIDTH/, modelImageWidth().to_s)
  fileString = fileString.gsub(/\$HEIGHT/, modelImageHeight().to_s)

  # write it out
  filename = @@modelDirectory + "/" + getIndexFile()
  file = File.new(filename, "w")
  file.puts fileString
  file.close
end


##
#  Utility function for diplaying a message
##
def SwivelButton::alert(msg)
  UI::messagebox(msg)
end 


##
# The first time, we set up the camera position.
##
def SwivelButton::zoomInitial()
  Sketchup.active_model.active_view.zoom_extents
  eyeNow    = Sketchup.active_model.active_view.camera.eye
  targetNow = Sketchup.active_model.active_view.camera.target
  upvec     = Sketchup.active_model.active_view.camera.up
  # draw the circle at our elevation (z coord)
  bb = Sketchup.active_model.bounds;
  bbcenter = bb.center;
  
  centerpoint = targetNow;

  viewvec = eyeNow - targetNow
  unitviewvec = viewvec.normalize;

  # add a boundary by backing up a bit more,
  standoff_distance = getStandoffDistance() * 1.1;  
  
  # the eye will lie along the current view line so it is 
  # standoff_distance away from the target
  standoff_vec = unitviewvec;
  standoff_vec.length = standoff_distance;
  standoff_eyepoint = bbcenter + standoff_vec;

  c = Sketchup::Camera.new
  
  c.set(standoff_eyepoint,bbcenter,upvec)
  # now stick this camera on our view
  Sketchup.active_model.active_view.camera = c
end


end  # end of module SwivelButton
