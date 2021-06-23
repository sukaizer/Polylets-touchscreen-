const mountedApp = app.mount("#app");

let windowId = "demo";

function getNumber() {
  var minNumber = 1000; // The minimum number you want
  var maxNumber = 10000; // The maximum number you want
  var randomnumber = Math.floor(Math.random() * (maxNumber + 1) + minNumber); // Generates random number
  return randomnumber; // Returns false just to tidy everything up
}

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

// Create a note with the given content and optional position
function createNote(content, left, top) {
  let style = "";
  if (top !== undefined && left !== undefined)
    style = `style="top: ${top}px; left: ${left}px"`;
  let html = `<div class="note draggable" draggable="true" ${style}>
				<div class="draghandle"></div>
				<div class="note-content">
					${content}
				</div>
			</div>`;
  return html;
}

// Return the HTML content of a note
function getNoteContent(note) {
  return $(note).find(".note-content").html();
}

// Move a note from the content pane to the sidebar
function moveNoteToSidebar(note, sidebar, ev, dnd) {
  // Copy note and append it to sidebar
  let html = createNote(getNoteContent(note));
  $("#sidebar").append(html);

  // Remove it with the 0 timeout otherwise the dragend event is lost (because the note does not exist)
  setTimeout(() => note.remove(), 0);
}

// Move a note from the sidebar to the content pane
function moveNoteToContent(note, sidebar, ev, dnd) {
  // Compute destination position
  // NOTE: this does account for scrolling of content, but not of scrolling in a parent element
  let offset = $("#content").offset();
  let scroll = {
    x: $("#content").scrollLeft(),
    y: $("#content").scrollTop(),
  };
  let x =
    ev.originalEvent.clientX - offset.left + scroll.x - dnd.cursorOffset.x;
  let y = ev.originalEvent.clientY - offset.top + scroll.y - dnd.cursorOffset.y;

  // Copy note and append it to sidebar
  let html = createNote(getNoteContent(note), x, y);
  $("#content").append(html);

  // Remove it with the 0 timeout otherwise the dragend event is lost (because the note does not exist)
  setTimeout(() => note.remove(), 0);
}

// Copy a note from a remote window to the sidebar
function copyNoteToSidebar(xferData, sidebar, ev, dnd) {
  // Copy note and append it to sidebar
  let html = createNote(xferData.content);
  $("#sidebar").append(html);
}

// Copy a note from a remote window to the content pane
function copyNoteToContent(xferData, sidebar, ev, dnd) {
  // Compute destination position
  // NOTE: this does account for scrolling of content, but not of scrolling in a parent element
  let offset = $("#content").offset();
  let scroll = {
    x: $("#content").scrollLeft(),
    y: $("#content").scrollTop(),
  };
  let x =
    ev.originalEvent.clientX - offset.left + scroll.x - xferData.cursorOffset.x;
  let y =
    ev.originalEvent.clientY - offset.top + scroll.y - xferData.cursorOffset.y;

  // Copy note and append it to sidebar
  let html = createNote(xferData.content, x, y);
  $("#content").append(html);
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
    var note = mountedApp.getDraggedNote();
    let xferData = {
      windowId: windowId,
      passage: note.passage,
      annotation: note.annotation,
      id: "a" + getNumber(),
      fileId: note.fileId,
      startIndex: note.startIndex,
      endIndex: note.endIndex,
      startOffset: note.startOffset,
      endOffset: note.endOffset,
    };
    ev.originalEvent.dataTransfer.setData(
      "text/plain",
      JSON.stringify(xferData)
    );
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
    console.log("dragEnter", ev);
    this.dragOver(ev);
  }

  dragOver(ev) {
    this.dropZone = ev.currentTarget;
    let mvt = this.getMovement();
    console.log(ev.type, mvt, ev);
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

      case "content->sidebar": // move note from content pane to sidebar
        // remove note from content and append it to sidebar
        moveNoteToSidebar(this.draggedElem, this.dropZone, ev, this);
        break;

      case "sidebar->content": // move note from sidebar to content pane
        // remove note from sidebar and append it to panel
        moveNoteToContent(this.draggedElem, this.dropZone, ev, this);
        break;

      case "sidebar->sidebar": // move note within sidebar: do nothing
      //break

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
    console.log(ev.type, mvt, ev);
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

      case "->content": // copy remote note to content pane
        // remove note from sidebar and append it to panel
        copyNoteToContent(data, this.dropZone, ev, this);
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
