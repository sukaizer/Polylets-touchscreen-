var nbFile = 4;
var allPassages = [];
const files = [];

getData();

// create a passage object which will be added to the sidebar and sets the listeners
function createPassage(data, touch) {
  const passage = document.createElement("div");
  passage.setAttribute("green", "none");
  passage.setAttribute("blue", "none");
  passage.setAttribute("red", "none");
  passage.setAttribute("class", "passage draggable");
  passage.setAttribute("id", data.id);
  passage.setAttribute("draggable", "true");
  passage.setAttribute("data-fileid", data.fileId);
  passage.setAttribute("data-startOffset", data.startOffset);
  passage.setAttribute("data-endOffset", data.endOffset);
  passage.setAttribute("data-startIndex", data.startIndex);
  passage.setAttribute("data-endIndex", data.endIndex);

  const draghandle = document.createElement("div");
  draghandle.setAttribute("class", "draghandle");

  const draghandlebutton = document.createElement("button");
  draghandlebutton.setAttribute("class", "draghandle-button");
  draghandlebutton.appendChild(
    document.createTextNode(String.fromCharCode(10005))
  );

  draghandlebutton.onclick = () => {
    passage.remove();
    for (let i = 0; i < allPassages.length; i++) {
      if (allPassages[i] == passage) {
        allPassages.splice(i, 1);
      }
    }
  };

  draghandlebutton.onmouseover = () => {
    draghandlebutton.style.color = "red";
  };

  draghandlebutton.onmouseleave = () => {
    draghandlebutton.style.color = "black";
  };

  draghandle.appendChild(draghandlebutton);

  const quote = document.createElement("div");
  quote.setAttribute("class", "quote");
  const quoteA = document.createElement("a");
  quoteA.setAttribute("class", "notes");
  quoteA.appendChild(document.createTextNode(data.passage));
  quote.appendChild(quoteA);

  const annotationArea = document.createElement("div");
  annotationArea.setAttribute("class", "annotationArea");
  const title = document.createElement("span");
  title.setAttribute("class", "field-title");
  title.appendChild(document.createTextNode("Note"));
  const hide = document.createElement("button");
  hide.setAttribute("class", "hide-button");
  hide.appendChild(document.createTextNode(String.fromCharCode(9660)));
  hide.onclick = () => {
    if (
      passage.lastElementChild.lastElementChild.style.visibility != "hidden"
    ) {
      passage.lastElementChild.lastElementChild.style.visibility = "hidden";
      hide.innerText = String.fromCharCode(9658);
    } else {
      passage.lastElementChild.lastElementChild.style.visibility = "visible";
      hide.innerText = String.fromCharCode(9660);
    }
  };
  const edit = document.createElement("div");
  edit.setAttribute("class", "edit-area");
  const textarea = document.createElement("p");
  textarea.appendChild(document.createTextNode(data.annotation));
  edit.appendChild(textarea);
  annotationArea.appendChild(title);
  annotationArea.appendChild(hide);
  annotationArea.appendChild(edit);

  passage.appendChild(draghandle);
  passage.appendChild(quote);
  passage.appendChild(annotationArea);
  allPassages.push(passage);

  if (touch) {
    draghandle.addEventListener("touchstart", canvasStart);
    draghandle.addEventListener("touchend", canvasEnd);
    draghandle.addEventListener("touchcancel", canvasCancel);
    draghandle.addEventListener("touchmove", canvasMove);
  } else {
    draghandle.addEventListener("touchstart", handleStart);
    draghandle.addEventListener("touchend", handleEnd);
    draghandle.addEventListener("touchcancel", handleCancel);
    draghandle.addEventListener("touchmove", handleMove);
  }

  return passage;
}

$("#save-button").click(function () {
  console.log("save");
  downloadInnerHtml(fileName, "editor", "text/html");
  zipFile();
});

function buildDOM(element, jsonObject) {
  // element is the parent element to add the children to
  if (typeof jsonObject == "string") {
    jsonObject = JSON.parse(jsonObject);
  }
  if (Array.isArray(jsonObject)) {
    for (var i = 0; i < jsonObject.length; i++) {
      this.buildDOM(element, jsonObject[i]);
    }
  } else {
    var e = document.createElement(jsonObject.tag);
    for (var prop in jsonObject) {
      if (prop != "tag") {
        if (prop == "children" && Array.isArray(jsonObject[prop])) {
          this.buildDOM(e, jsonObject[prop]);
        } else if (prop == "html") {
          e.innerHTML = jsonObject[prop];
        } else {
          e.setAttribute(prop, jsonObject[prop]);
        }
      }
    }
    element.appendChild(e);
  }
}

function iterId() {
  console.log("iteration");
  console.log(iter);
  iter += 1;
}

async function getData() {
  const rf = await fetch("/files");
  const filesData = await rf.json();

  // for (let i = 0; i < nbFile; i++) {
  //     const container = document.createElement('div');
  //     document.getElementById("annotations").append(container);
  //     const doc = document.createElement('p');
  //     doc.appendChild(document.createTextNode("Document " + (i + 1)));
  //     doc.setAttribute("class", "docName");
  //     container.append(doc);
  //     passagesDiv[i] = container;
  // }
  const res = await fetch("/notes");
  const data = await res.json();
  var i = 100;
  for (item of data) {
    document.getElementById("sidebar").append(createPassage(item, false));
    i += 10;
  }
}

//open window when double click
function openWindow(id, startOffset, endOffset, startIndex, endIndex) {
  var myWindow = window.open("", "", "");
  var element = document.createElement("div");
  element.setAttribute("id", "document");
  element.appendChild(files[id - 1]);
  myWindow.document.write(element.innerHTML);

  reselect(myWindow, startOffset, endOffset, startIndex, endIndex);
}

//select passage in new window
function reselect(myWindow, startOffset, endOffset, startIndex, endIndex) {
  //scroll to the position
  //myWindow.document.getElementById("document").scrollTo(0, yPosition);

  //reselect the selection using startIndex and endIndex
  let documentNode = myWindow.document.getElementById("document");
  let node = documentNode.firstElementChild;
  let i = 0;
  let startNode;
  let endNode;

  while (node) {
    if (i == startIndex) {
      startNode = node;
    }
    if (i == endIndex) {
      endNode = node;
    }
    i++;
    node = node.nextElementSibling || node.nextSibling;
  }
  console.log(startNode);
  console.log(endNode);

  //re-create the selection using offset
  const newRange = new Range();
  console.log(startNode.firstChild.firstChild);

  if (startNode.firstChild.nodeName == "STRONG") {
    console.log("start strong");
    newRange.setStart(startNode.firstChild.firstChild, startOffset);
  } else {
    newRange.setStart(startNode.firstChild, startOffset);
  }

  if (endNode.firstChild.nodeName == "STRONG") {
    console.log("end strong");
    newRange.setEnd(endNode.firstChild.firstChild, endOffset);
  } else {
    console.log(endNode.firstChild);
    newRange.setEnd(endNode.firstChild, endOffset);
  }

  let selection = myWindow.window.getSelection();
  selection.removeAllRanges();
  selection.addRange(newRange);
}

function getCursorPosition() {
  var range = quill.getSelection();
  if (range) {
    if (range.length == 0) {
      console.log("User cursor is at index", range.index);
      return range.index;
    } else {
      var text = quill.getText(range.index, range.length);
      console.log("User has highlighted: ", text);
    }
  } else {
    console.log("User cursor is not in editor");
  }
}

// This name will be passed to the destination window during drag-and-drop
// and can be used to distinguish among several source windows
let windowId = "demo";

// Return the id of the closest enclosing dropzone, if any
function getDropZoneId(elem) {
  return $(elem).closest(".dropzone").attr("id");
}

// Move jQuery `elem` by deltaX, deltaY
function moveElem(elem, deltaX, deltaY) {
  let offset = elem.offset();
  offset.left += deltaX;
  offset.top += deltaY;
  elem.offset(offset);
}

function moveNoteToContent(note, sidebar, ev, dnd) {
  // Compute destination position
  // NOTE: this does account for scrolling of content, but not of scrolling in a parent element
  // Copy note and append it to sidebar
  var data = {
    id: note.getAttribute("id"),
    fileId: note.getAttribute("data-fileid"),
    startOffset: note.getAttribute("data-startoffset"),
    endOffset: note.getAttribute("data-endoffset"),
    startIndex: note.getAttribute("data-startindex"),
    endIndex: note.getAttribute("data-endoffset"),
    passage: note.firstElementChild.nextSibling.firstElementChild.innerText,
    annotation: note.lastElementChild.lastElementChild.innerText,
  };
  console.log(data);

  $("#snaptarget").append(createPassage(data, false));

  // Remove it with the 0 timeout otherwise the dragend event is lost (because the note does not exist)
  setTimeout(() => note.remove(), 0);
}

function moveNoteToContent(note, touch) {
  // Compute destination position
  // NOTE: this does account for scrolling of content, but not of scrolling in a parent element
  // Copy note and append it to sidebar
  var data = {
    id: note.getAttribute("id"),
    fileId: note.getAttribute("data-fileid"),
    startOffset: note.getAttribute("data-startoffset"),
    endOffset: note.getAttribute("data-endoffset"),
    startIndex: note.getAttribute("data-startindex"),
    endIndex: note.getAttribute("data-endoffset"),
    passage: note.firstElementChild.nextSibling.firstElementChild.innerText,
    annotation: note.lastElementChild.lastElementChild.innerText,
  };
  console.log(data);

  $("#snaptarget").append(createPassage(data, touch));

  // Remove it with the 0 timeout otherwise the dragend event is lost (because the note does not exist)
  setTimeout(() => note.remove(), 0);
}

// // Return the HTML content of a note
// function getNoteContent(note) {
//   return note.lastElementChild.innerHTML;
// }

// // Return the HTML content of a note
// function getPassageContent(note) {
//   return note.firstElementChild.nextElementSibling.innerHTML;
// }

// Copy a note from a remote window to the sidebar
function copyNoteToSidebar(xferData, sidebar, ev, dnd) {
  // Copy note and append it to sidebar
  $("#sidebar").append(createPassage(xferData, false));
}

// Global holding the current drag-and-drop interaction, if any
let dnd = null;

// Singleton class holding the state for a drag-and-drop interaction
class DragAndDropInteraction {
  draggedElem = null;
  dropZone = null;

  constructor(ev) {
    console.log(ev.type + ": new dnd interaction", ev);
    this.draggedElem = ev.target;
    this.dropZone = null;

    // absolute position of cursor (used for local move)
    this.startPos = {
      x: ev.originalEvent.screenX,
      y: ev.originalEvent.screenY,
    };

    // position of cursor relative to dragged element (used for non-local move)
    let offset = $(this.draggedElem).offset();
    this.cursorOffset = {
      x: ev.originalEvent.pageX - offset.left,
      y: ev.originalEvent.pageY - offset.top,
    };

    // fill out dataTransfor info in case we drag out of the window
    ev.originalEvent.dataTransfer.effectAllowed = "copy";
  }

  // ==== utilities ====

  getMovement() {
    // return a string sourceDropZone->destinationDropZone
    let from = getDropZoneId(this.draggedElem);
    let to = getDropZoneId(this.dropZone);
    if (from && to) return from + "->" + to;
    return null;
  }

  // ==== Event Handlers ===
  drag(ev) {
    // console.log('drag')
  }

  dragEnd(ev) {
    console.log("dragEnd", ev);
    dnd = null; // reset interaction
  }

  dragEnter(ev) {
    //console.log("dragEnter", ev);
    this.dragOver(ev);
  }

  dragOver(ev) {
    this.dropZone = ev.currentTarget;
    let mvt = this.getMovement();
    //console.log(ev.type, mvt, ev);
    if (mvt && mvt !== "sidebar->sidebar") {
      // this signals that we are able to handle a drop here
      ev.preventDefault();
      ev.stopPropagation();
    }
  }

  dragLeave(ev) {
    // console.log('dragLeave', ev)
    // this.dropZone = null
    // ev.preventDefault()
  }

  drop(ev) {
    console.log("drop", ev);
    if (!this.dropZone) return;

    // let e = ev.originalEvent
    // console.log(`client ${e.x} ${e.y} - layer ${e.layerX} ${e.layerY} - offset ${e.offsetX} ${e.offsetY} - screen ${e.screenX} ${e.screenY}`)

    let movement = this.getMovement();
    console.log(movement);
    switch (movement) {
      case "content->content": // move note withing the content pane
        // simply move the note
        moveElem(
          $(this.draggedElem),
          ev.screenX - this.startPos.x,
          ev.screenY - this.startPos.y
        );

        break;

      case "sidebar->snaptarget": // move note from sidebar to content pane
        // remove note from sidebar and append it to panel
        moveNoteToContent(this.draggedElem, this.dropZone, ev, this);
        break;

      case "snaptarget->snaptarget": // move note within sidebar: do nothing
        moveElem(
          $(this.draggedElem),
          ev.screenX - this.startPos.x,
          ev.screenY - this.startPos.y
        );

      default:
        console.log("unknown/unsupported movement ");
    }
  }
}

// Singleton class holding the state for a drag-and-drop interaction
// when dragging from another window
class DropInteraction {
  dropZone = null;

  constructor(ev) {
    console.log(ev.type + ": new drop interaction", ev);
    this.dragOver(ev);
  }

  // ==== utilities ====

  getMovement() {
    // return a string sourceDropZone->destinationDropZone
    let to = getDropZoneId(this.dropZone);
    if (to) return "->" + to;
    return null;
  }

  // ==== Event Handlers ===

  dragEnter(ev) {
    this.dragOver(ev);
  }

  dragOver(ev) {
    this.dropZone = ev.currentTarget;
    let mvt = this.getMovement();
    //console.log(ev.type, mvt, ev);
    if (mvt) {
      // this tells that we can drop remotely
      ev.originalEvent.dataTransfer.dropEffect = "copy";

      // this signals that we are able to handle a drop here
      ev.preventDefault();
      ev.stopPropagation();
    }
  }

  dragLeave(ev) {
    console.log("remote dragLeave", ev);
    ev.preventDefault();
  }

  drop(ev) {
    console.log("remote drop", ev);
    if (!this.dropZone) {
      dnd = null;
      return;
    }

    // Parse transfer data
    let xferData = ev.originalEvent.dataTransfer.getData("text/plain");
    console.log(xferData);
    let data = null;
    if (xferData && xferData.length > 0) data = JSON.parse(xferData);
    if (!data) {
      dnd = null;
      return;
    }

    let movement = this.getMovement();
    console.log(movement);
    switch (movement) {
      case "->sidebar": // copy remote note to sidebar
        // remove note from content and append it to sidebar
        copyNoteToSidebar(data, this.dropZone, ev, this);
        break;

      default:
        console.log("unknown/unsupported movement ");
    }

    dnd = null;
  }
}

$(function () {
  // this disables dragging a note by clicking its content
  $(".note-content").on("mousedown", (ev) => {
    console.log("note-content");
    ev.preventDefault();
  });

  $(".passage-content").on("mousedown", (ev) => {
    console.log("note-content");
    ev.preventDefault();
  });

  // we set these handlers on the container so that they are inherited by any new draggable item
  $("#container").on("dragstart", ".draggable", (ev) =>
    dnd
      ? console.warn("spurious dragstart event")
      : (dnd = new DragAndDropInteraction(ev))
  );
  $("#container").on("drag", ".draggable", (ev) =>
    dnd ? dnd.drag(ev) : console.warn("spurious drag event")
  );
  $("#container").on("dragend", ".draggable", (ev) =>
    dnd ? dnd.dragEnd(ev) : console.warn("spurious dragend event")
  );

  // these handlers are the only ones that are called when we receive a remote drag
  $(".dropzone").on("dragenter", (ev) =>
    dnd ? dnd.dragEnter(ev) : (dnd = new DropInteraction(ev))
  );
  $(".dropzone").on("dragover", (ev) =>
    dnd ? dnd.dragOver(ev) : console.warn("spurious dragover event")
  );
  $(".dropzone").on("dragleave", (ev) =>
    dnd ? dnd.dragLeave(ev) : console.warn("spurious dragleave event")
  );

  $(".dropzone").on("drop", (ev) =>
    dnd ? dnd.drop(ev) : console.warn("spurious drop event")
  );
});

//regarding touch events
var floatingEl = null;
var passage = null;
var clientX = 0;
var clientY = 0;
var canvasEl = null;
var lastX = 0;
var lastY = 0;

function handleStart(evt) {
  if (evt.target !== this) return;
  evt.stopPropagation();
  evt.preventDefault();
  var path = evt.path;
  path.forEach((element) => {
    try {
      if (element.getAttribute("class") == "passage draggable") {
        floatingEl = element.cloneNode(true);
      }
    } catch (error) {}
  });
  floatingEl.removeEventListener("touchstart", handleStart);
  floatingEl.removeEventListener("touchend", handleEnd);
  floatingEl.removeEventListener("touchcancel", handleCancel);
  floatingEl.removeEventListener("touchmove", handleMove);
  floatingEl.style.position = "absolute";
  floatingEl.style.opacity = "0.7";
  floatingEl.style.transform = "scale(1)";
  clientX = evt.touches[0].pageX;
  clientY = evt.touches[0].pageY;
  floatingEl.style.top = clientY + "px";
  floatingEl.style.left = clientX + "px";
  document.body.appendChild(floatingEl);
}

function handleEnd(evt) {
  if (evt.target !== this) return;
  evt.stopPropagation();
  evt.preventDefault();
  var path = evt.path;
  path.forEach((element) => {
    try {
      if (element.getAttribute("class") == "passage draggable") {
        passage = element;
      }
    } catch (error) {}
  });
  var canvas = document.getElementById("snaptarget");
  if (
    clientX >= canvas.offsetLeft &&
    clientX <= canvas.offsetLeft + canvas.offsetWidth &&
    clientY >= canvas.offsetTop &&
    clientY <= canvas.offsetTop + canvas.offsetHeight
  ) {
    moveNoteToContent(passage, true);
  }
  floatingEl.remove();
  floatingEl = null;
  passage = null;
}

function handleMove(evt) {
  if (evt.target !== this) return;
  evt.stopPropagation();
  evt.preventDefault();
  console.log("move");
  clientX = evt.touches[0].pageX;
  clientY = evt.touches[0].pageY;
  console.log("touchpos : " + clientX + "  " + clientY);
  floatingEl.style.top = clientY + "px";
  floatingEl.style.left = clientX + "px";
}

function handleCancel(evt) {
  evt.preventDefault();
  console.log("cancel");
}

function canvasStart(evt) {
  if (evt.target !== this) return;
  evt.preventDefault();
  var path = evt.path;
  path.forEach((element) => {
    try {
      if (element.getAttribute("class") == "passage draggable") {
        canvasEl = $(element);
      }
    } catch (error) {}
  });
  let offset = canvasEl.offset();
  lastX = offset.left;
  lastY = offset.top;
}

function canvasMove(evt) {
  if (evt.target !== this) return;
  evt.preventDefault();
  // clientX = evt.touches[0].pageX;
  // clientY = evt.touches[0].pageY;
  // canvasEl.style.top = clientY + "px";
  // canvasEl.style.left = clientX + "px";

  let offset = canvasEl.offset();
  offset.left += evt.touches[0].pageX - lastX;
  offset.top += evt.touches[0].pageY - lastY;
  canvasEl.offset(offset);
  lastX = offset.left;
  lastY = offset.top;

  console.log(lastX);
}

function canvasCancel(evt) {}

function canvasEnd(evt) {
  canvasEl = null;
}
