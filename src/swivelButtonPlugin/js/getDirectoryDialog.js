// Copyright 2008 Google Inc.
// All Rights Reserved.

/**
 * @fileoverview getDirectoryDialog.js
 *
 * Permission to use, copy, modify, and distribute this software for 
 * any purpose and without fee is hereby granted, provided that the above
 * copyright notice appear in all copies.
 *
 * THIS SOFTWARE IS PROVIDED "AS IS" AND WITHOUT ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, WITHOUT LIMITATION, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.
 */


/**
 * @constructor singleton
 * @param {Element} parentNode Where to place the tree in the webpage's HTML
 * @param {String} name The name of the root
 */
var GetDirectoryDialog = new function() {

// the lightbox covers the screen with a semi-transparent div
// so that the user will only interact with the getDirectory controls.
this.lightBox = null;
this.dialog = null;
this.treeView = null;

this.modelNameEle = null;

// directoryNameEle is the html element and may be ellipsized
// directoryName is a string and is the full directory name
this.directoryNameEle = null;
this.directoryName = "";
this.callback = null;

/**
 * main entry point for the application.
 */
this.init = function() {
  var root = document.body;

  // The lightBox is a semi-transparent canvas we use to hide controls
  GetDirectoryDialog.lightBox = createLightBox(root);

  // Create the GetDirectory dialog
  GetDirectoryDialog.dialog = createGetDirectoryDialog(root);

  // Create the dialog box that allows you to create a new directory
  CreateDirectoryDialog.init();
};


/**
 * Create a semi-transparent lightBox to cover controls so that 
 * the user cannot click on them.
 * @param {Node} parent
 */
function createLightBox(parent) {
  var lightBox = createDiv(parent);
  lightBox.id = "getDirectoryLightBox";
  hide(lightBox);

  lightBox.style.left = px(0);
  lightBox.style.top = px(0);
  setOpacity(lightBox, 0.60);

  return lightBox;
}


/**
 *
 * @param {Node} parent
 */
function createGetDirectoryDialog(parent) {
  var ele = null;

  // create a container for the get directory dialog
  var dialog = createDiv(parent);
  dialog.id = "getDirectoryDialog";
  hide(dialog);

  ele = createDiv(dialog);
  ele.className = "dialogTitle";
  ele.innerHTML = "Change the Location to Export the Model";

  ele = createSpan(dialog);
  ele.id = "getModelLabel";
  ele.innerHTML = "Model Name:";

  GetDirectoryDialog.modelNameEle = createSpan(dialog);
  GetDirectoryDialog.modelNameEle.id = "directoryModelName";

  ele = createDiv(dialog);
  ele.id = "getDirectoryLabel";
  ele.innerHTML = "Directory:";

  GetDirectoryDialog.directoryNameEle = createSpan(ele);
  GetDirectoryDialog.directoryNameEle.id = "getDirectoryDirName";
  GetDirectoryDialog.directoryNameEle.innerHTML = "";

  ele = createDiv(dialog);
  ele.id = "getDirectoryTreeViewContainer";
  GetDirectoryDialog.treeView = new TreeView(ele, GetDirectoryDialog.handleGetSubDirectory);

  // set up the cancel button
  ele = createButton(dialog, "Cancel");
  ele.id = "getDirectoryCancelButton";
  ele.onclick = handleGetDirectoryCancel;

  // set up the create button
  ele = createButton(dialog, "Create A New Directory");
  ele.id = "getDirectoryCreateButton";
  ele.style.width = px(175);
  ele.onclick = handleGetDirectoryCreateDirectory;


  // set up the ok button
  ele = createButton(dialog, "OK");
  ele.id = "getDirectoryOkButton";
  ele.onclick = handleGetDirectoryDialogOk;

  return dialog;
}

/**
 * Show the Get Directory Dialog, allowing the user to adjust the
 * current directory.
 *
 * @param {String} imageDirectory is the current image directory 
 * @param {String} modelName is the name of the model
 * @param {Function} callback is the method we call when the new
 *     directory has been set.
 */
this.show = function(imageDirectory, modelName, callback) {

  GetDirectoryDialog.modelNameEle.innerHTML = modelName;

  // initialize the directory name and set up the callback
  // for when the user hits "ok"
  GetDirectoryDialog.directoryName =  imageDirectory;
  GetDirectoryDialog.directoryNameEle.innerHTML = ellipseMiddle(imageDirectory, 50);
  GetDirectoryDialog.callback = callback;

  GetDirectoryDialog.treeView.setWorkingDir(imageDirectory);

  // resize the lightbox and dialog to fit the main window
  var windowWidth  = getWindowWidth() +
    parseInt(document.body.currentStyle.marginLeft) +
    parseInt(document.body.currentStyle.marginRight);

  var windowHeight  = getWindowHeight() +
    parseInt(document.body.currentStyle.marginTop) +
    parseInt(document.body.currentStyle.marginBottom);

  var dialogWidth = windowWidth - 50;
  GetDirectoryDialog.dialog.style.width = px(dialogWidth);
  GetDirectoryDialog.dialog.style.left = px((windowWidth - dialogWidth)/2 - 7);

  GetDirectoryDialog.lightBox.style.width = px(windowWidth);
  GetDirectoryDialog.lightBox.style.height = px(windowHeight + 20);

  var treeViewContainer = document.getElementById("getDirectoryTreeViewContainer");
  treeViewContainer.style.width = px(dialogWidth - 10);
  treeViewContainer.style.height = px(windowHeight - 200);

  var createDirButton =
    document.getElementById("getDirectoryCreateButton");
  var buttonWidth = parseInt(createDirButton.style.width);
  createDirButton.style.left = px((windowWidth - buttonWidth)/2 - 20);

  show(GetDirectoryDialog.lightBox);
  show(GetDirectoryDialog.dialog);
};


/**
 * Hide the Get Directory dialog box
 */
this.hide = function() {
  hide(GetDirectoryDialog.dialog);
};


/**
 * When the user clicks on a folder, we need to show the subdirectory
 * results and possibly ellipse the name.
 *
 * @param {String} pathName is the full path to the sub-directory.
 */
this.handleGetSubDirectory = function(pathName) {
  GetDirectoryDialog.directoryName = pathName;
  GetDirectoryDialog.directoryNameEle.innerHTML = ellipseMiddle(pathName, 50);

  // call ruby to get the children directories. When ruby is done it
  // will call rubyUpdateToDirectory(pathName, stringOfCommaSeparatedDirs);
  window.location = 'skp:getDirectory@' + pathName;
};


/**
 * handleGetSubDirectory() makes a call to Ruby to get the
 * sub-directories. When Ruby is done it will callback to this function 
 * with the results as a comma-separated string of directories.
 *
 * @param {String} pathName is the full path to the sub-directory.
 * @param {String} stringOfCommaSeparatedDirs we put all the
 *     sub-dirrectories in one long string as CSV.
 */
this.rubyUpdateToDirectory = function(pathName, stringOfCommaSeparatedDirs) {
  var children = stringOfCommaSeparatedDirs.split(",");
  var childCount = children.length;

  if (childCount > 0  && children[0].length > 0) {
    GetDirectoryDialog.treeView.addArrayToDir(pathName, children);
  }
};

/**
 * Hide the dialogs when the user presses the Cancel button.
 */
function handleGetDirectoryCancel() {
  hide(GetDirectoryDialog.lightBox);
  hide(GetDirectoryDialog.dialog);
}

/**
 * When the user clicks on the Create Directory button, we pop up
 * another modal dialog box to get the name of the new directory.
 */
function handleGetDirectoryCreateDirectory() {
  CreateDirectoryDialog.show(GetDirectoryDialog.directoryName,
                             handleCreateDirectoryResults);
}

/**
 * When we get the results of the newlyt created directory name,
 * we tell ruby to go make it.
 * @param {String} newDirectory is the name of the new directory.
 */
function handleCreateDirectoryResults(newDirectory) {
  // call ruby to create the new directory. When ruby is done it
  // will call rubyCreateDirectory(pathName, status);

  var index = newDirectory.lastIndexOf("/");
  if (index < 0) {
    return ;
  }

  var front = newDirectory.substr(0, index);
  var back = newDirectory.slice(index+1);

  window.location = 'skp:makeDir@' + front + ',' + back;
}


/**
 * When we call ruby, we get a status back on whether we could
 * actually create the directory. If good, then we update the UI.
 * Otherwise we let the user know we could not create the directory.
 * @param {String} pathName is the new directory
 * @param {status} Boolean which is true if we created the directory.
 */
this.rubyCreateDirectory = function(pathName, status) {
  if (status) {
    if (pathName && pathName.length > 0) {
      GetDirectoryDialog.treeView.makeDir(null, pathName);
      GetDirectoryDialog.treeView.setWorkingDir(pathName);
    }
  } else {
    alert("Could not create the directory: " + pathName);
  }
};


/**
 * When the user presses ok hide the dialogs and call the callback.
 * @param {Object} e is the event element
 */
function handleGetDirectoryDialogOk(e) {
  hide(GetDirectoryDialog.lightBox);
  hide(GetDirectoryDialog.dialog);

  GetDirectoryDialog.callback(GetDirectoryDialog.directoryName);
                              
}

};  // end of GetDirectoryDialog singleton
