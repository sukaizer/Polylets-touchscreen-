var data = [];
var files = [];
var row = 2;
var col = 3;


//drag single element
function drag(dragevent) {
    var text = dragevent.target.id;
    dragevent.dataTransfer.setData("text", text);

}

//drag entire document
function dragDoc(dragevent) {
  const doc = dragevent.target.parentNode.id;
  dragevent.dataTransfer.setData("text", doc);
  console.log(doc);
};


//drop single element
function drop(dropevent) {
  const note = document.getElementById(dropevent.dataTransfer.getData("text"));
  console.log("note");
  console.log(note);
  if (note.lastElementChild.className != "element") {
    dropevent.target.appendChild(note);
  } else if (dropevent.target.tagName == "TD") {
    const targetAttr = dropevent.target.attributes
    autofill(note, targetAttr[1].value, targetAttr[2].value)
  }
  $(document).trigger("changetext");
}

//avoiding default dnd behavior
function p(dropevent) {
  dropevent.preventDefault();
}


//autofill
function autofill(note, trow, tcol) {
  elem = note.childNodes
  trow = parseInt(trow, 10);
  while (elem.length >1) {
    if (trow > row) {
      addRow();
    }
    cell = getCell(tcol, trow);
    cell.append(elem[1])
    trow += 1;
      
  }
  elem[0].remove();
}




function iterId() {
    iter += 1;
}

getData();
async function getData() {

    const rf = await fetch('/files');
	const filesData = await rf.json();

	for (let index = 0; index < 4; index++) {
		var element = document.createElement("div");
		element.setAttribute("id", "document");
		this.buildDOM(element, filesData[index]);
		files[index] = element;
	}


    const res = await fetch('/notes');
    const data = await res.json();

	var list = [];

	for (i in data) {
		const id = data[i].fileId;
		if (list[id] == null) {
			list[id] = [];	
		} 
		list[id].push(data[i]);
	}

	//add div per document
	for (i in list) {
		if (list[i] != null) {
			const newDoc = document.createElement('div');
			newDoc.setAttribute("id", "docFolder" + i)
			const h3 = document.createElement('h3');
			h3.innerHTML = "Document " + i;
			h3.setAttribute("id", "Document"+i)
			h3.setAttribute("draggable", "true");
			h3.setAttribute("ondragstart", "dragDoc(event)");
			newDoc.appendChild(h3);
			document.getElementById("annotations").append(newDoc);
		}
	}

	//adding each element in the annotation tab
    for (item of data) {
        const newAnnot = document.createElement('div');
        const passage = document.createElement('a');
        const note = document.createElement('p');
        const strPassage = document.createTextNode(`${item.passage}`);
        const strNote = document.createTextNode(`${item.annotation}`);

        newAnnot.setAttribute("id", `${item._id}`);
        newAnnot.setAttribute("draggable", "true");
        newAnnot.setAttribute("ondragstart", "drag(event)");
        const fileId = `${item.fileId}`;
        newAnnot.setAttribute("data-fileid", fileId);
        newAnnot.setAttribute("data-startOffset", `${item.startOffset}`)
        newAnnot.setAttribute("data-endOffset", `${item.endOffset}`)
        newAnnot.setAttribute("data-startIndex", `${item.startIndex}`)
        newAnnot.setAttribute("data-endIndex", `${item.endIndex}`)

		newAnnot.ondblclick = () => {
            openWindow(newAnnot.getAttribute("data-fileid"),
						newAnnot.getAttribute("data-startOffset"),
						newAnnot.getAttribute("data-endOffset"),
						newAnnot.getAttribute("data-startIndex"),
						newAnnot.getAttribute("data-endIndex"),);
        }

        note.setAttribute("class", "annot-note");
        passage.setAttribute("class", "annot-pass");
        newAnnot.setAttribute("class", "element");

        passage.appendChild(strPassage);
        note.appendChild(strNote);
        newAnnot.appendChild(passage);
        newAnnot.appendChild(note);

        document.getElementById("docFolder" + fileId).append(newAnnot);
    }

    //initialize table
    $(document).trigger("changetext");
};


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
function reselect(myWindow, startOffset, endOffset, startIndex, endIndex)  {
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
        } if (i == endIndex) {
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
    }
    else {
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




//send data to server
async function sendToServer() {
	const delay = ms => new Promise(res => setTimeout(res, ms));

	const options = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(data)
	};
	fetch('/tbl', options);
	await delay(1000);
}




function buildDOM(element, jsonObject) { // element is the parent element to add the children to
    if (typeof jsonObject == "string") {
        jsonObject = JSON.parse(jsonObject);
    }
    if (Array.isArray(jsonObject)) {
        for (var i = 0; i < jsonObject.length; i++) {
            this.buildDOM(element, jsonObject[i]);
        }
    }
    else {
        var e = document.createElement(jsonObject.tag);
        for (var prop in jsonObject) {
            if (prop != "tag") {
                if (prop == "children" && Array.isArray(jsonObject[prop])) {
                    this.buildDOM(e, jsonObject[prop]);
                }
                else if (prop == "html") {
                    e.innerHTML = jsonObject[prop];
                }
                else {
                    e.setAttribute(prop, jsonObject[prop]);
                }
            }
        }
        element.appendChild(e);
    }
}



const td = document.getElementsByTagName("td");
for (cell of td ) {
  cell.setAttribute('ondrop', `drop(event)`);
}


function tableCoordinate() {
	for (i = 1 ; i <= row ; i++) {
		for (j = 1 ; j <= col ; j++) {
			$('.tbl tr:nth-child('+i+') td:nth-child('+j+')').each(function() {
				$(this).attr('data-row', i);
        		$(this).attr('data-col', j);
			})
			$('.tbl tr:nth-child('+i+') td:nth-child('+j+') div').each(function() {
				$(this).attr('data-row', i);
        		$(this).attr('data-col', j);
			})
		}
	}
}

//add a new row
function addRow() {
  $("tbody").append(document.createElement("tr"));
  for (i = 0 ; i < col ; i++) {
    $("tr:last-child").append(document.createElement("td"));
  }
  const butt = document.createElement("button");
  butt.innerHTML = "X"
  butt.setAttribute("class", "del-row")
  butt.setAttribute("onclick", "deleteRow("+row+")");
  row += 1;
  $(".document").append(butt);
  $(document).trigger("changetext");
}


//add a new column
function addCol() {
  $("tr").each(function() {
    $(this).append(document.createElement("td"));
  })
  const butt = document.createElement("button")
  butt.innerHTML = "X"
  butt.setAttribute("class", "del-col")
  butt.setAttribute("onclick", "deleteCol("+col+")");
  $(".document").prepend(butt);
  col += 1;
  $(".tbl colgroup").append(document.createElement("col"))
  $(document).trigger("changetext");
}


//export into editor
async function exportToEditor() {
	//create data
	for (i = 1 ; i <= col ; i++) {
		$('.tbl tr td:nth-child('+i+') div').each(function(index) {  
      const tis = $(this)[0];
      const note = {
        id : "tableId" + i,
        docId : tis.id,
        fileId : tis.attributes[3].value,
        startOffset : tis.attributes[4].value,
        endOffset : tis.attributes[5].value,
        startIndex : tis.attributes[6].value,
        endIndex : tis.attributes[7].value,
        row: tis.attributes[9].value,
        col: tis.attributes[10].value, 
      }
      data.push(note);
		})
	}
  sendToServer();
  data = [];
}


//getting a cell of the table with its coordinates
function getCell(x, y) {
  tr = document.getElementsByTagName("tr");
  yaxis = tr[y-1]
  first = yaxis.firstElementChild;
  for (i = 1 ; i < x ; i++) {
    first = first.nextElementSibling;
  }
  return first;
}


//delete a column a the table
function deleteCol(c) {
  // Getting the table
  var tbl = document.getElementById('tbl'); 
  
  // Getting the rows in table.
  var row = tbl.rows;  

  // Removing the column at index(col).  
  for (var j = 0; j < row.length; j++) {
      // Deleting the ith cell of each row.
      row[j].deleteCell(c);
  }

  //delete button
  const butt = document.getElementsByClassName("del-col");
  butt[c].remove();

  $(document).trigger("changetext");
  col -= 1;
}


function deleteRow(r) {
	//delete row
	var tr = document.getElementsByTagName("tr");
	tr[r].remove();
	//delete button
	const butt = document.getElementsByClassName("del-row");
	butt[r].remove();
	$(document).trigger("changetext");
	row -= 1;
}



//add column
$(".tbl tr:nth-child(1) td").each(function(index) {
  //columns
  const buttCol = document.createElement("button")
  buttCol.innerHTML = "X"
  buttCol.setAttribute("class", "del-col")
  buttCol.setAttribute("onclick", "deleteCol("+index+")");
  $(".document").prepend(buttCol);
  $(".tbl colgroup").append(document.createElement("col"))
})


$("tr").each(function(id) {
  //rows
  const buttRow =document.createElement("button");
  buttRow.innerHTML = "X"
  buttRow.setAttribute("class", "del-row")
  buttRow.setAttribute("onclick", "deleteRow("+id+")");
  $(".document").append(buttRow)
})



//drag to add row
$(".new-row").on("dragenter", function(event) {
  addRow();
});

//drag to add column
$(".new-column").on("dragenter", function(event) {
  addCol();
});


//add dnd attribute and updates things
$(document).on("changetext", function() {
  $("td").attr("ondrop", "drop(event)");
  tableCoordinate();
  //update col
  $(".del-col").each(function(id) {
    $(this).attr("onclick", "deleteCol("+id+")");
	const i = id+1;
	const pos = $(".tbl tr:nth-child(1) td:nth-child("+i+")").position().left;
	$(this).css({top: 5 +'px', left: pos + 45 + 'px', position:'absolute'});
  })
  //update rows
  $(".del-row").each(function(id) {
	const tds = document.getElementsByTagName("tr");
	const h = tds[id].getBoundingClientRect().top;
    $(this).attr("onclick", "deleteRow("+id+")");
	$(this).css({top: h -140 +'px', left: '5px', position:'absolute'});
  })
})




//export button
$(".exporter").on("click", function(event) {
	exportToEditor();
	var href = $("a[href='../editor']").attr('href');
	window.location.href = href;
})



 //selectable table using jQuery 
 $(function () {
	var isMouseDown = false;
	$(".tbl td").mousedown(function () {
      isMouseDown = true;
      $(this).toggleClass("highlighted");
      console.log("start");
      console.log(this);
      startCell = this; //get the startCell 

      return false; // prevent text selection
      })
	  .mouseover(function () {
		if (isMouseDown) {
		  $(this).toggleClass("highlighted");
		}
	  })
	  .bind("selectstart", function () {
		return false; // prevent text selection in IE
	  });

	// $(document)
	$(".tbl td")
	  .mouseup(function () {
		isMouseDown = false;
		console.log("end");
		console.log(this);
		//endCell = this; //get the end cell 
		//call the auto-fill function 
		//offset = parseInt(endCell.id.slice(-1)) - parseInt(startCell.id.slice(-1));
		//autoFill(1, startCell.id, offset); 
	  });
  });