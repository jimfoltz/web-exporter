// Copyright 2008 Google Inc.
// All Rights Reserved.

/**
 * @fileoverview treeView.js
 * The TreeView holds a directory listing in HTML using collapsable DIVs.
 * It also shows the full path of the selected directory.
 * You can pass in strings like "C/A/B/D" and it will create the subdirs.
 * 
 * An example call sequence might be:
 *    var treeView = new TreeView(scrollableDivContainer, handleSelected)
 *    treeView.setWorkingDir("C:/A/B/D");
 *
 *
 *  handleSelected(pathName) is called whenever a directory is selected
 *  and is passed the pathname of the selected directory. Note that the
 *  pathname ends in a "/" even if you pass in paths that do not.
 *  The developer can react to selections by adding the subchildren for
 * the node. For example: 
 *
 * function handleSelected(pathName) {
 *   children = new Array();
 *   if (pathName == "C/") {
 *     children[0] = "One Dir";
 *     children[1] = "Two Dir";
 *     children[2] = "Three Dir";
 *   } else if (pathName == "C/Two Dir/") {
 *     children[0] = "A";
 *     children[1] = "B";
 *     children[2] = "C";
 *     children[3] = "D";
 *     children[4] = "E";
 *   }
 *
 *  treeView.addArrayToDir(pathName, children);
 * }
 *
 *
 * Permission to use, copy, modify, and distribute this software for 
 * any purpose and without fee is hereby granted, provided that the above
 * copyright notice appear in all copies.
 *
 * THIS SOFTWARE IS PROVIDED "AS IS" AND WITHOUT ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, WITHOUT LIMITATION, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.
 */

// class name for a treeview node
var TREEVIEW_NODE = "treeViewNode";

// class name for an unselected treeview span node
var TREEVIEW_NODE_UNSELECTED = "treeViewNodeUnselected";

// class name for a selected treeview span node
var TREEVIEW_NODE_SELECTED = "treeViewNodeSelected";

// image names for the folder icons
var TREEVIEW_OPEN_FOLDER_URL = "openFolder.png";
var TREEVIEW_CLOSED_FOLDER_URL = "closedFolder.png";

// used as a prefix for each directory's icon id and span id
var TREEVIEW_ICON = "treeViewIcon/";
var TREEVIEW_SPAN = "treeViewSpan/";

/**
 * @constructor
 * @param {Node} parentNode Where to place the tree in the webpage's HTML
 * @param {Function} getChildren treeView calls this to get the children
 *     of a node. The function takes the parent as a parameter and
 *     returns an array of children nodes.
 */
var TreeView = function(parent, callback) {
  this.currentDir = null;
  this.setWorkingDirCallback = callback;
  this.container = parent;
};


/**
 * Makes a subdirectory under the parent node. If the pathName has 
 *   multiple subnodes, it will make them too. For example:
 *     treeView.makeDir(root, "A/B/C/D");
 *     treeView.makeDir(root, "A1/A2/A3/");  // ending "/" are ok
 * Making a directory does not change the current directory.
 *
 * @param {Element} parentNode Where to make the directory.
 * @param {String} name The name of the new directory.
 */
TreeView.prototype.makeDir = function(parentNode, pathName) {
  if (!pathName || pathName == "") {
    return;
  }

  var pathId = "";

  if (parentNode) {
    pathId = parentNode.id;
  } else {
    parentNode = this.container;
    pathId = "";
  }
 
  // split the pathName by "/" and create the directories
  var dirList = pathName.split("/");
  var dirListLength = dirList.length;
  var newNode = null;
  var newImage = null;
  var newSpan = null;
  for (var i = 0; i < dirListLength; i++) {
    if (dirList[i].length) {
      // ids must be unique, so store the full path
      pathId += dirList[i] + "/";

      // make sure the node does not already exist
      newNode = document.getElementById(pathId);
      if (!newNode) {
        newNode = TreeView.createDiv(parentNode);    
        newNode.className = TREEVIEW_NODE;
        newNode.id = pathId;

        // add the icon
        newImage = TreeView.createImage(newNode);
        newImage.className = TREEVIEW_ICON;
        newImage.id = TREEVIEW_ICON + pathId;
        newImage.src = "../images/" + TREEVIEW_CLOSED_FOLDER_URL;

        // add a span with the name
        newSpan = TreeView.createSpan(newNode);
        newSpan.className = TREEVIEW_NODE_UNSELECTED;
        newSpan.id = TREEVIEW_SPAN + pathId;
        newSpan.innerHTML = dirList[i];
     
        // store a pointer to the javascript treeview object so that
        // we can reference it when the user clicks on the related html.
        newNode.treeViewObj = this;
        newNode.onclick = TreeView.handleClick_;
      }

      // walk down the path so we can make sub-directories
      parentNode = newNode;

    }
  }
};


/**
 * A convenient function to add an array of child directories
 * @param {String} pathname
 * @param {Array} dirList
 */
TreeView.prototype.addArrayToDir = function(pathName, dirList) {
  if (!dirList || dirList.length < 1) {
    return;
  }

  var parentNode = null;  
  if (pathName == undefined || pathName == null) {
    parentNode = null;
  } else {
    parentNode = document.getElementById(pathName);
  }

  var childCount = dirList.length;
  for (var i = 0; i < childCount; i++) {
    this.makeDir(parentNode, dirList[i]);
  }
};


/**
 * Return the current directory path as a string. If it has not been 
 * set, then return "";
 * @return {String} the current directory as a string
 */
TreeView.prototype.getWorkingDir = function() {
  if (this.currentDir) {
    return this.currentDir.id;
  } else {
    return "";
  }
};


/**
 * Set the current directory path. If the subtree does not exist, 
 * create it as well.
 * @param {String} pathname Change the current directory to this pathname
 */
TreeView.prototype.setWorkingDir = function(pathName) {
  var ele = null;


  if (pathName == undefined || pathName == "") {
    return;
  }

  // deselect the old one
  if (this.currentDir) {
    var id = this.currentDir.id;
    ele = document.getElementById(TREEVIEW_SPAN + id);
    if (ele){
      ele.className = TREEVIEW_NODE_UNSELECTED;
    }
  }

  // since makeDir will make only new directories, call it to ensure
  // that the directory exists.
  this.makeDir(null, pathName);

  // we store pathnames with "/" on the end, so if the user
  // passes in a pathname without it, append it so we can find it.
  if (pathName.charAt(pathName.length-1) != "/") {
    pathName += "/";
  }

  // now select it
  this.currentDir = document.getElementById(pathName);
  ele = document.getElementById(TREEVIEW_SPAN + pathName);
  if (ele) {
    ele.className = TREEVIEW_NODE_SELECTED;
  }

  // run up the tree and open all parent nodes
  var ele = this.currentDir;
  var node = null;
  while(ele && ele.className == TREEVIEW_NODE) {
    var childCount = ele.childNodes.length;
    for (var i = 0; i< childCount; i++) {
      node = ele.childNodes[i];
      if (node.className == TREEVIEW_ICON) {
        node.src = "../images/" + TREEVIEW_OPEN_FOLDER_URL;
        break;
      }
    }
    ele = ele.parentNode;
  }

  if (this.setWorkingDirCallback) {
    this.setWorkingDirCallback(pathName);
  }
};


/**
 * @private
 * @param {Element} node Close all the nodes under this node
 */
TreeView.prototype.closeDir_ = function(node) {
  if (!node) {
    return;
  }
  
  var nodeCount = node.childNodes.length;
  var children = [];
  for (var i = 0; i < nodeCount; i++) {
    var subNode = node.childNodes[i];
    if (subNode.className == TREEVIEW_NODE) {
      this.closeDir_(subNode);
      children[children.length] = subNode;
    }
  }
  for(var i=0; i < children.length; i++) {
    node.removeChild(children[i]);
  }
};


/**
 * Toggles the icon to closed
 * @private
 * @param {Element} node  Close the node's icon
 */
TreeView.prototype.closeIcon_ = function(node) {
  if (!node) {
    return ;
  }

  var childCount = node.childNodes.length;
  var childNode = null;
  for (var i = 0; i < childCount; i++) {
    childNode = node.childNodes[i];
    if (childNode.className == TREEVIEW_ICON) {
      childNode.src = "../images/" + TREEVIEW_CLOSED_FOLDER_URL;
      break;
    }
  }
};


/**
 * Reports whether the icon is open or closed.
 * returns false on error (e.g. no node)
 * @private
 * @return {Boolean}
 */
TreeView.prototype.isOpen_ = function(node) {
  if (!node) {
    return false;
  }

  var childCount = node.childNodes.length;
  var childNode = null;
  for (var i = 0; i < childCount; i++) {
    childNode = node.childNodes[i];
    if (childNode.className == TREEVIEW_ICON) {
      return (childNode.src.indexOf(TREEVIEW_OPEN_FOLDER_URL) > -1);
    }
  }

  return false;
};


/** 
 * Utility function that returns whether the given node is the selected one
 * @private
 */
TreeView.prototype.isSelected = function(node) {
    return (node == this.currentDir);
};


/**
 * When the user clicks on a node, toggle the folder closed or open
 * and set the currentDirectory.
 * @private
 * @param {Event} e is a DOM event
 */
TreeView.handleClick_ = function(e) {
  e = e ? e : window.event;

  // don't bubble the event up through the parent nodes
  if (e.stopPropagation) {
    e.stopPropagation();
  } else {
    e.cancelBubble = true;
  }

  var target = TreeView.getEventTarget(e);
  if (target) {
     //run up the tree to find the treeview node
    while (target && target.parentNode && 
           target.className != TREEVIEW_NODE) {
      target = target.parentNode;
    }

    if (target) {
      var treeViewObj = target.treeViewObj;
      var alreadySelected = treeViewObj.isSelected(target);

      if (!alreadySelected) {
        treeViewObj.setWorkingDir(target.id);
      } else {
         if (treeViewObj.isOpen_(target)) {
          treeViewObj.closeDir_(target);
          treeViewObj.closeIcon_(target);
         } else {
          treeViewObj.setWorkingDir(target.id);
        }
      }
    }
  }
  
  return false;
};


/**
 * Utility function to get the target HTML from the event
 * @param {Element} event The event that has the target
 */
TreeView.getEventTarget = function(event) {
  var targetElement = null;

  if (event.target) {
    targetElement = event.target;
  } else {
    targetElement = event.srcElement;
  }

  while (targetElement.nodeType == 3 && targetElement.parentNode ) {
    targetElement = targetElement.parentNode;
  }

  return targetElement;
};


/**
 * Utility function to create a new DIV
 * @param {Element} parentNode Where to hang the new DIV
 * @return {Element} the new DIV
 */
TreeView.createDiv = function(parentNode) {
  var element = document.createElement("DIV");
  if (parentNode) {
    parentNode.appendChild(element);
  }

  return element;
};


/**
 * Utility function to create a new SPAN
 * @param {Element} parentNode Where to hang the new SPAN
 * @return {Element} the new SPAN
 */
TreeView.createSpan= function(parentNode) {
  var element = document.createElement("SPAN");
  if (parentNode) {
    parentNode.appendChild(element);
  }

  return element;
};


/**
 * Utility function to create a new IMG
 * @param {Element} parentNode Where to hang the new image
 * @return {Element} the new IMG
 */
TreeView.createImage = function(parentNode) {
  var element = document.createElement("IMG");
  if (parentNode) {
    parentNode.appendChild(element);
  }

  return element;
};
