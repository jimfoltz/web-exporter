// Copyright 2008 Google Inc.
// All Rights Reserved.

/**
 * @fileoverview swivelButton.js
 *
 * Permission to use, copy, modify, and distribute this software for 
 * any purpose and without fee is hereby granted, provided that the above
 * copyright notice appear in all copies.
 *
 * THIS SOFTWARE IS PROVIDED "AS IS" AND WITHOUT ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, WITHOUT LIMITATION, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.
 */

var getImageCountSection = null;
var imageWidthInput = null;
var imageSection = null;
var spinningImageSection = null;
var statusSection = null;
var statusText = "";

// imageDirectoryEle is the HTML representation with possible ellipses
// imageDirectory is the full string name with a "/" on the end
var imageDirectoryEle = null;
var imageDirectory = "";


var iframe = null;
var stopped = false;
var modelName = null;
var imageWidth = 400;

/**
 * main entry point for the application.
 */
function init(imageDirectoryIn, modelNameIn, imageCountIn, imageWidthIn) {

  // if they are not using IE then issue an error and end
  if (navigator.userAgent.indexOf("MSIE") == -1) {
    alert ("Unfortunately this plugin does not work with your " + 
           "browser at this time.");
    window.location='skp:cancel';
    return false;
  }

  // save the model directory and name
  modelName = modelNameIn;
  imageDirectory = imageDirectoryIn;
  
  var ele = null;
  var root = document.body;
  statusSection = document.getElementById("status");
  statusText = statusSection.innerHTML;

  // save and set up the image size
  imageWidth = imageWidthIn;
  imageWidthInput = document.getElementById("imageWidthInput");
  imageWidthInput.value = imageWidth;

  spinningImageSection = document.getElementById("spinningImage");
  spinningImageSection.style.width = imageWidth + "px";

  iframe = document.getElementById("resultsFrame");

  setImageCount(imageCountIn);
  resizeImage();
  
  imageDirectoryEle = document.getElementById("outputDirectory");
  imageDirectoryEle.innerHTML = ellipseMiddle(imageDirectory + modelName, 40);

  GetDirectoryDialog.init();

  var angleMenu = document.getElementById("angleMenu");
  angleMenu.style.display = "none";
}

/**
 * Returns the currently selected number of images.
 */
function getImageCount() {
  var currentAngle = document.getElementById("currentAngle");
  var imageCount = Math.floor(360 / currentAngle.innerHTML);
  return imageCount;
}

/**
 * Sets the image count select box to the closest value to that given.
 * @param {Number} value is the current angle and we make sure it is
 *     one of the prescribed choices.
 */
function setImageCount(value) {
  var currentAngle = document.getElementById("currentAngle");
  var angle = (value >= 72) ? 5 :
              (value >= 36) ? 10 :
              (value >= 18) ? 20 :
              (value >= 12) ? 30 :
              45;
    
  handleAngleMenu(angle);
  currentAngle.innerHTML = angle;
}


/**
 * Called when the user wants to open the folder containing
 * the results.
 */
function handleOpenFolder() {
  window.location = "skp:openFolder@" + imageDirectory 
}


/**
 * Used to resize the image and the dialog.
 */
function resizeImage() {
  var IMAGE_MIN_SIZE = 100;
  var IMAGE_MAX_SIZE = 600;  

  // validity checking
  var imageW = parseInt(imageWidthInput.value);
  if(imageW < IMAGE_MIN_SIZE || imageW > IMAGE_MAX_SIZE) {
    imageWidthInput.value = imageWidth;

    alert("image size is not valid; it must be between " + 
          IMAGE_MIN_SIZE + " and " + IMAGE_MAX_SIZE);

    imageWidthInput.select();
    imageWidthInput.focus();

    return true;
  }
  imageWidth = imageW;

    
  spinningImageSection.style.width = imageWidth + "px";
  spinningImageSection.style.height = imageWidth + "px";
  
  spinningImageSection.parentNode.innerHTML = 
      "<img id='spinningImage' style='width:" + 
        imageWidth + "px;height:" + imageWidth +"px;'" +
      " src='../images/swivelButtonTempImage.jpg'>";
  
  spinningImageSection = document.getElementById("spinningImage");
  
  document.getElementById("ruler").style.width = imageWidth + "px";

  var windowWidth = imageWidth + 80 < 490 ? 490 : imageWidth + 80;
  var windowHeight = imageWidth + 270;
  window.location = "skp:resizeWindow@" + 
                    windowWidth + "," + 
                    windowHeight + "," + imageW + "," + imageW;

  return false;
}

/**
 * Called when the user wants to change the directory.
 */
function pickDirectory() {
  hide(document.getElementById("outputImageSelect"));
  GetDirectoryDialog.show(imageDirectory, modelName, 
                          handlePickDirectoryResults);
}


/**
 *  Set the display and save the results
 * @param {String} directoryResults is the name of the directory in
 *     which to place the images and html.
 */
function handlePickDirectoryResults(directoryResults) {
  imageDirectory = directoryResults;
  imageDirectoryEle.innerHTML = ellipseMiddle(imageDirectory + modelName, 45);

  // save the results through ruby
  var imageCount = getImageCount();
  var params = imageDirectory + "," + imageCount;
  window.location = 'skp:saveDialogSettings@' + params;
}


/**
 * If return has been pressed, execute the given function
 * @param {Object} e is the event
 * @param {Function} f is the function to call.
 */
function checkReturn(e,f) {
  var e = e ? e : window.event;
  // validate that the user typed a number  
  var unicode = e.charCode ? e.charCode : e.keyCode;
  if(unicode == 13) {
    f();
  }
}


/**
 * When the user changes the number of images to generate, this
 * validates the entry.
 * @param {Object} e is the event
 */
function pickImageCount(e) {
  var e = e ? e : window.event;

  // validate that the user typed a number  
  var unicode = e.charCode ? e.charCode : e.keyCode;
   
  //if the key is not a backspace
  if (unicode != 8) { 
    //if the key is not a number disable the key
    if (unicode < 48 || unicode > 57) {
      return false;
    }
  }

  return true;    
}



/**
 * When the cancel button is pressed this closes the window.
 */
function handleCancel() {
  stopped = true; 
  window.location='skp:cancel';

  return false;
}


/**
 * When the close button is pressed this closes the window.
 */
function handleClose() {
  stopped = true; 
  window.location='skp:close';

  return false;
}


/**
 * When the create button is pressed this starts the process.
 */
function handleCreateButton() {
  // Now validate the number range
  var imageCount = getImageCount();
  if (imageCount < 3 || imageCount > 360) {
    alert("Error: Image Count = " + imageCount + " but it must be between 3 and 360.");
    return false;
  }

  // This will make ruby initialize the sketchup state and take the first
  // image. Then Ruby will call the javascript getNext() so that
  // javascript can update its progress bar and tell ruby to getNext() again.
  var parameter = imageDirectory + "," + imageCount;
  window.location="skp:handleGenerateImagesButtonPress@" + parameter;

  return false;
}

/**
 * Makes a call to the ruby swivel code to move the camera and
 * take a picture, then advance the counter for the next picture.
 * @param {String} imageURL is the url of the image that we save.
 * @param {Number} is the image index (e.g. if we are saving 1-36
 *     images, this coulde be number 12).
 */
function getNextImage(imageURL, imageIndex) {
  hide(document.getElementById("modelNameSection"));
  hide(document.getElementById("ruler"));
  hide(document.getElementById("segmentTable"));
  hide(document.getElementById("changeLocationTable"));
  hide(document.getElementById("resizeBtn"));
  hide(document.getElementById("createButton"));
  hide(document.getElementById("resizeDiv"));
  hide(document.getElementById("imageOptions"));
  

  // hide the create button now that we are creating. We have to do this
  // here since Ruby must first determine whether the directory is valid.
  var createButton = document.getElementById("createButton");

  if(stopped) {
    show(createButton);
    window.location='skp:cancel';
    return;
  } else {
    ele = document.getElementById("cancelButton");
    ele.style.marginTop = "20px";
    ele.style.marginLeft = "200px";

    hide(createButton);
  }

  imageIndex++;
  var imageCountNumber = getImageCount();

  spinningImageSection.src = imageURL;
  statusSection.innerHTML = "<center>image " + imageIndex + " of " + 
                            imageCountNumber + "</center>";

  if (imageIndex < imageCountNumber) {
    setTimeout("callRubyGetNextImage();", 10);
  }
}

/**
 * When we show the last image, we change the UI to have some new 
 * buttons.
 */
function showLastImage(imageURL) {
  var imgCount = getImageCount();
  spinningImageSection.src = imageURL;
  statusSection.innerHTML = statusText;

  // hide the original splash image and load in an iframe of the page
  // they created.
  hide(spinningImageSection);

  iframe.src = imageDirectory + "/" + modelName + "_index.html";
  iframe.style.width = imageWidth + "px";
  iframe.style.height = iframe.style.width;
  show(iframe);

  var ele = null;

  ele = document.getElementById("ruler");
  hide(ele);

  ele = document.getElementById("segmentTable");
  hide(ele);

  ele = document.getElementById("changeFolderTable");
  hide(ele);

  ele = document.getElementById("createButton");
  hide(ele);

  ele = document.getElementById("cancelButton");
  hide(ele);

  // now show the finish table  
  ele = document.getElementById("finishTable");
  show(ele);
}


/**
 *  Capture the next image
 */
function callRubyGetNextImage() {
  window.location = 'skp:captureNextImage';
}


/**
 * Toggle showing the drop-down menu that lets you pick the angle.
 */
function showAngleMenu() {
  var angleMenu = document.getElementById("angleMenu");
  var currentAngleElement = document.getElementById("currentAngle");

  if (angleMenu.style.display == "none") {
    angleMenu.style.display = "block";
    angleMenu.style.left = getLeft(currentAngleElement) + "px";
    angleMenu.style.top = getTop(currentAngleElement) + 
                          currentAngleElement.offsetHeight + "px";
  } else {
    angleMenu.style.display = "none";
  }

  return false;
}

/**
 * Set the angle.
 * @param {Number} angle is the angle that the user set as an increment 
 *     to move the camera (e.g. 10 means 36 pictures to cover 360 degrees).
 */
function handleAngleMenu(angle) {
  var currentAngle = document.getElementById("currentAngle");
    currentAngle.innerHTML = angle;

  var s = document.getElementById("numRequiredPictures");
  s.innerHTML = Math.floor(360 / angle);

  angleMenu.style.display = "none";

  return false;
}
