// Copyright 2008 Google Inc.
// All Rights Reserved.

/**
 * @fileoverview swivelButtonBase.js A set of common functions.
 *
 * Permission to use, copy, modify, and distribute this software for 
 * any purpose and without fee is hereby granted, provided that the above
 * copyright notice appear in all copies.
 *
 * THIS SOFTWARE IS PROVIDED "AS IS" AND WITHOUT ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, WITHOUT LIMITATION, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.
 */

function getWindowWidth() {
  if (window.innerWidth != undefined) {
    return window.innerWidth;
  }

  if (window.document.body.offsetWidth != undefined) { 
    return document.body.offsetWidth;
  }

  return -1;
};


function getWindowHeight() {
  if (window.innerHeight != undefined) {
    return window.innerHeight;
  }

  if (window.document.body.offsetHeight != undefined) { 
    return document.body.offsetHeight;
  }

  return -1;
};

function getWidth(node) {
  var width = 0;
  while (node) {
    width += node.offsetLeft;
    node = node.offsetParent;
  }

  return width;
}


function getHeight(node) {
  var height = 0;
  while (node) {
    height += node.offsetLeft;
    node = node.offsetParent;
  }

  return height;
}


function getLeft(node) {
  var left = 0;
  while (node) {
    left += node.offsetLeft;
    node = node.offsetParent;
  }

  return left;
}


function getTop(node) {
  var top = 0;
  while (node) {
    top += node.offsetTop;
    node = node.offsetParent;
  }

  return top;
}


function px(numPixels) {
  return Math.round(numPixels) + "px";
};


function show(element) {
  if(element) {
    element.style.display = "block";
  }
}


function hide(element) {
  if(element) {
    element.style.display = "none";
  }
}


/**
 * Sets the opacity of the element to the given value (between 0 and 1).
 */
function setOpacity(element, opacity) {
  element.style.filter = "alpha(opacity=" + Math.round(opacity*100) + ")";
  element.style.opacity = opacity;
}


function createDiv(parent) {
  var element = document.createElement("DIV");
  if (parent != undefined) {
    parent.appendChild(element);
  }

  return element;
}


function createSpan(parent) {
  var element = document.createElement("SPAN");
  if (parent != undefined) {
    parent.appendChild(element);
  }

  return element;
}


function createImage(parent) {
  var element = document.createElement("IMG");
  if (parent != undefined) {
    parent.appendChild(element);
  }

  return element;
}


function createTable(parent) {
  var element = document.createElement("TABLE");
  if (parent != undefined) {
    parent.appendChild(element);
  }

  return element;
}


function createTableRow(parent) {
  return parent.insertRow();
}


function createTableCell(parent) {
  return parent.insertCell();
}


function createButton(parent, opt_value) {
  var element = document.createElement("INPUT");
  element.type = "button";
  element.className = "button";

  if (opt_value) {
    element.value = opt_value;
  }

  if (parent != undefined) {
    parent.appendChild(element);
  }

  return element;
}


function createTextBox(parent, opt_value) {
  var element = document.createElement("INPUT");
  element.type = "text";
  element.className = "textBox";

  if (opt_value) {
    element.value = opt_value;
  }

  if (parent != undefined) {
    parent.appendChild(element);
  }

  return element;
}


/**
 * Ellipses the middle of the name
 */
function ellipseMiddle(path, index) {

  // cut the string in half, roughly
  var cut = Math.floor(index/2);

  if (path.length > index) {
     path = path.substr(0, cut) + " ... " + 
            path.substr(path.length - cut, cut);
  }
  
  return path;
}
