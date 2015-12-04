// Copyright 2008 Google Inc.
// All Rights Reserved.

/**
 * @fileoverview createDirectoryDialog.js
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
var CreateDirectoryDialog = new function() {

// the lightbox covers the screen with a semi-transparent div
// so that the user will only interact with the createDirectory controls.
this.lightBox = null;
this.dialog = null;

// pathNameEle is the HTML element we show and may be ellipsized
// pathName is a string and is the full pathname
this.pathNameEle = null;
this.pathName = "";

this.directoryTextBox = null;
this.callback = null;

/**
 * main entry point for the application.
 */
this.init = function() {
  var root = document.body;

  // The lightBox is a semi-transparent canvas we use to hide controls
  CreateDirectoryDialog.lightBox = createLightBox(root);

  // Create the CreateDirectory dialog
  CreateDirectoryDialog.dialog = createCreateDirectoryDialog(root);
};


/**
 * Create a semi-transparent lightBox to cover controls so that 
 * the user cannot click on them.
 * @param {Node} parent
 */
function createLightBox(parent) {
  var lightBox = createDiv(parent);
  lightBox.id = "createDirectoryLightBox";
  hide(lightBox);
  setOpacity(lightBox, 0.60);

  return lightBox;
}


/**
 * @param {Node} parent
 */
function createCreateDirectoryDialog(parent) {
  var ele = null;

  // create a container for the create directory dialog
  var dialog = createDiv(parent);
  dialog.id = "createDirectoryDialog";
  hide(dialog);

  ele = createDiv(dialog);
  ele.id = "createDirectoryLabel";
  ele.innerHTML = "Create Directory";

  CreateDirectoryDialog.pathNameEle = createSpan(dialog); 
  CreateDirectoryDialog.pathNameEle.id = "createDirectoryPathName";
  CreateDirectoryDialog.pathNameEle.innerHTML = "";

  CreateDirectoryDialog.directoryTextBox = createTextBox(dialog, "");
  CreateDirectoryDialog.directoryTextBox.id = "createDirectoryTextBox";
  CreateDirectoryDialog.directoryTextBox.onkeydown = 
    handleCreateDirectoryDialogEnter;

  var buttonsContainer = createDiv(dialog);
  buttonsContainer.id = "createDirectoryButtonsContainer";

  // set up the cancel button
  ele = createButton(buttonsContainer, "Cancel");
  ele.id = "createDirectoryCancelButton";
  ele.onclick = handleCreateDirectoryDialogCancel;

  // set up the ok button
  ele = createButton(buttonsContainer, "OK");
  ele.id = "createDirectoryOkButton";
  ele.onclick = handleCreateDirectoryDialogOk;

  return dialog;
}


/**
 * Show the createDirectory dialog and register the callback
 * to fire when the user has created the new directory.
 *
 * @param {String} pathName is the full path to the current directory
 * @param {Function} callback is the js method we call on completion.
 */
this.show = function(pathName, callback) {

  // Set up the callback for when the user hits "ok"
  CreateDirectoryDialog.callback = callback;
  CreateDirectoryDialog.pathNameEle.innerHTML = ellipseMiddle(pathName, 55);
  CreateDirectoryDialog.pathName = pathName;
  CreateDirectoryDialog.directoryTextBox.value = "";

  // make sure the lightbox and dialog are the right size
  // resize the lightbox and dialog to fit the main window
  var windowWidth  = getWindowWidth() +
    parseInt(document.body.currentStyle.marginLeft) +
    parseInt(document.body.currentStyle.marginRight);

  var windowHeight  = getWindowHeight() +
    parseInt(document.body.currentStyle.marginTop) +
    parseInt(document.body.currentStyle.marginBottom);

  CreateDirectoryDialog.dialog.style.left = px( (windowWidth - 450)/2 - 7);
  CreateDirectoryDialog.dialog.style.top = px( (windowHeight - 110)/2);

  CreateDirectoryDialog.lightBox.style.width = px(windowWidth);
  CreateDirectoryDialog.lightBox.style.height = px(windowHeight + 20);

  show(CreateDirectoryDialog.lightBox);
  show(CreateDirectoryDialog.dialog);

  CreateDirectoryDialog.directoryTextBox.focus();
};


/**
 * if the user hits enter, treat it as hitting the ok button
 */
function handleCreateDirectoryDialogEnter(evt) {
  evt = (evt) ? evt : event;
  var charCode = (evt.charCode) ? evt.charCode : 
                   ((evt.which) ?  evt.which : evt.keyCode);

  if (charCode == 13 || charCode == 3) {
    handleCreateDirectoryDialogOk(evt);    
    return false;
  }

  return true;
}


/**
 * When the user hits the cancel button we hide the dialogs
 * @param {Element}  e is the javascript event
 */
function handleCreateDirectoryDialogCancel(e) {
  hide(CreateDirectoryDialog.lightBox);
  hide(CreateDirectoryDialog.dialog);
}


/**
 * When the user hits the OK button we hide the dialog, call
 * the Ruby script to create the directory and call the callback.
 * @param {Element}  e is the javascript event
 */
function handleCreateDirectoryDialogOk(e) {
  hide(CreateDirectoryDialog.lightBox);
  hide(CreateDirectoryDialog.dialog);

  var newDirName = CreateDirectoryDialog.pathName  + 
  CreateDirectoryDialog.directoryTextBox.value;

  CreateDirectoryDialog.callback(newDirName);
}

};  // end of CreateDirectoryDialog singleton


