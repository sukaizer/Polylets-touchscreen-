var clicked = [];
var unpinned = [];
var firstEnter = [];

var referenceObjects = [];
var passages = [];
var files = [];

var file;

var recupererFichiers = function () {
    file = document.getElementById('myfiles').files[0]
    if (file) {
    var reader = new FileReader();
    reader.readAsText(file, "UTF-8");
    reader.onload = function (evt) {
        document.getElementById("document").innerHTML = evt.target.result;
        getData();
    }
    reader.onerror = function (evt) {
        document.getElementById("document").innerHTML = "error reading file";
    }
}
}

document.querySelector("#myfiles").onchange = recupererFichiers;


function save(i) {
    var div = referenceObjects[i];
    if (!clicked[i]) {
        var element = document.getElementById("snaptarget");
        var rect = element.getBoundingClientRect();
        div.style.top = rect.top +'px';
        div.style.left = rect.left + 'px';
        div.hidden = false;
        $('#'+i).draggable({
            disable: true,
            containment: "#snaptarget",
            snap: ".annotationBar",
            snapmode:"inner"
        });
        drag(i);
    }
}

function openWindow(i) {
    var myWindow = window.open("", "", "");
    var element = document.createElement("div");
    element.setAttribute("id", "document");
    element.appendChild(files[passages[i].fileId - 1]);
    myWindow.document.write(element.innerHTML);
    console.log(passages[i]);
    reselect(myWindow, passages[i]);
}

function drag(i) {
    $(function () {
        var div = referenceObjects[i];
        if (unpinned[i]) {
            unpinned[i] = false;
            $('#'+i).draggable("option", "disabled", true);
            div.style.cursor = 'default';
            div.style.borderWidth = 0 + 'px';
        } else {
            clicked[i] = true;
            $('#'+i).draggable("option", "disabled", false);
            div.style.cursor = 'move';
            div.style.borderWidth = 5 +'px';
        }
    })
}

function unpin(i) {
    $(function () {
        clicked[i] = false;
        unpinned[i] = true;
    })
}


async function getData() {
    const rs = await fetch('/files');
    const filesData = await rs.json();
    
    for (let index = 0; index < 4; index++) {
        var element = document.createElement("div");
        element.setAttribute("id", "document");
        this.buildDOM(element, filesData[index]);
        files[index] = element;
    }

    var el;
    var prefix = 'elementId';
    for (var i = 0; el = document.getElementById(prefix + i); i++) {
        passages[i] = {
            fileId : el.getAttribute("data-fileid"),
            startOffset : el.getAttribute("data-startoffset"),
            endOffset: el.getAttribute("data-endoffset"),
            startIndex : el.getAttribute("data-startindex"),
            endIndex: el.getAttribute("data-endindex"),
        }

        const newRef = document.createElement('div');
        newRef.setAttribute("id", i);
        newRef.setAttribute("class", "draggable");
        newRef.style.borderColor = "#"+Math.floor(Math.random()*16777215).toString(16);
        newRef.onclick = () => {
            save(newRef.getAttribute("id"));
        }

        newRef.ondblclick = () => {
            openWindow(newRef.getAttribute("id"));
        }

        newRef.style.position = "absolute";
        newRef.hidden = true;
        const refBut = document.createElement('a');
        refBut.setAttribute("class", "unpin");
        refBut.appendChild(document.createTextNode("UNPIN"));
        refBut.onclick = () => {
            unpin(newRef.getAttribute("id"));
        }
        newRef.appendChild(refBut);
        
        const passageContent = document.createElement('div');
        passageContent.setAttribute("class", "passage-content");
        passageContent.innerHTML = el.textContent;
        newRef.style.overflow = scroll;
        newRef.appendChild(passageContent); 

        document.getElementById("referenceObjects").append(newRef);
        referenceObjects[i] = newRef;

        el.addEventListener("mouseenter", function (event) {
            if (!clicked[newRef.getAttribute("id")]) {
                newRef.style.top = event.clientY - 10 + 'px'; //or whatever 
                newRef.style.left = event.clientX - 10   + 'px'; // or whatever
            } else {
                $('#' + newRef.getAttribute("id")).css({ transform: 'scale(1.5)' });
                $('#' + newRef.getAttribute("id")).css({ trasition: 'transform .6s' });
            }
            newRef.hidden = false;
            event.target.style.color = "orange";
        }, false);
        
        el.addEventListener("mouseleave", function (event) {
            event.target.style.color = "";
            if (clicked[newRef.getAttribute("id")]) {
                $('#'+newRef.getAttribute("id")).css({ transform: 'scale(1)' });
            }
        }, false);


        newRef.addEventListener("mouseleave", function (event) {
            if (clicked[newRef.getAttribute("id")]) {
                newRef.hidden = false;
            } else {
                newRef.hidden = true;
            }
        }, false);
        clicked[i] = false;
        unpinned[i] = false;
    }
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

function reselect(myWindow, selectionObject) {
    //scroll to the position 
    //myWindow.document.getElementById("document").scrollTo(0, selectionObject.yPosition); 

    //reselect the selection using startIndex and endIndex 
    let documentNode = myWindow.document.getElementById("document"); 
    let node = documentNode.firstElementChild; 
    let i = 0; 
    let startNode;
    let endNode; 

    while (node) {
        if (i == selectionObject.startIndex){
            startNode = node; 
        }if(i == selectionObject.endIndex){
            endNode = node; 
        }
        i ++; 
        node = node.nextElementSibling || node.nextSibling;
    }
    console.log(startNode); 
    console.log(endNode); 

    //re-create the selection using offset 
    const newRange = new Range(); 
    console.log(startNode.firstChild.firstChild);

    if (startNode.firstChild.nodeName == "STRONG"){
        console.log("start strong");
        newRange.setStart(startNode.firstChild.firstChild, selectionObject.startOffset); 
    }
    else{
        newRange.setStart(startNode.firstChild, selectionObject.startOffset); 
    }

    if (endNode.firstChild.nodeName == "STRONG"){
        console.log("end strong");
        newRange.setEnd(endNode.firstChild.firstChild, selectionObject.endOffset); 
    } else {
        console.log(endNode.firstChild);
        newRange.setEnd(endNode.firstChild, selectionObject.endOffset); 
    }
    
    let selection = myWindow.window.getSelection();
    selection.removeAllRanges(); 
    selection.addRange(newRange);            
}