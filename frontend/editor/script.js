let Inline = Quill.import('blots/inline');
var nbFile = 4;
var passagesDiv = [];
getData();

class HighlightBlot extends Inline {
    static create(id) {
        let node = super.create();
        // Sanitize url if desired
        console.log("id is");
        console.log(id);

        //node.setAttribute('id', "on");
        //highlight thingy=
        node.setAttribute("id", "elementId" + iter);
        //handful for reader
        node.setAttribute("data-fileId", document.getElementById(id).attributes[3].value );
        node.setAttribute("data-startOffset", document.getElementById(id).attributes[4].value );
        node.setAttribute("data-endOffset", document.getElementById(id).attributes[5].value );
        node.setAttribute("data-startIndex", document.getElementById(id).attributes[6].value );
        node.setAttribute("data-endIndex", document.getElementById(id).attributes[7].value );

        node.addEventListener("mouseenter", function(event) {
            highlight(id);
        });

        node.addEventListener("mouseleave", function(event) {
            unhighlight(id);
        });

        return node;
    }
}

HighlightBlot.blotName = 'highlight';
HighlightBlot.tagName = 'a';

var iter = 0;

Quill.register(HighlightBlot);


var toolbarOptions = [
    ['bold', 'italic', 'underline', 'strike'],
    ['link', 'image', 'video', 'formula'],
];

const quill = new Quill('#editor', {
    modules: {
        toolbar : toolbarOptions
    },
    
    theme: 'snow'
});


function downloadInnerHtml(filename, elId, mimeType) {
    var elHtml = document.getElementById(elId).firstElementChild.innerHTML;
    var link = document.createElement('a');
    mimeType = mimeType || 'text/plain';

    link.setAttribute('download', filename);
    link.setAttribute('href', 'data:' + mimeType + ';charset=utf-8,' + encodeURIComponent(elHtml));
    link.click(); 
}

var fileName =  'file.html'; // You can use the .txt extension if you want

$('#save-button').click(function(){
    console.log("save");
    downloadInnerHtml(fileName, 'editor','text/html');
    zipFile();
});

const saver = document.querySelector(".save-button");


async function zipFile() {
    var zip = new JSZip();

    const resNotes = await fetch('/notes');
    const dataNotes = await resNotes.json();

    const reshtml = await fetch('/files');
    const datahtml = await reshtml.json();

    var i = 0;

    for (item of dataNotes) {
        const id = `${item.fileId}`;
        

        const element = document.createElement("div");
        buildDOM(element, datahtml[id]);

        console.log("fileId");
        console.log(element); 
        console.log(element.outerHTML);
        zip.file("file"+i+".html", element.outerHTML);
        i+=1;
    }

    zip.file("Hello.txt", "Hello World\n");
    

    zip.generateAsync({type:"blob"}).then(function(content) {
        // see FileSaver.js
        saveAs(content, "example.zip");
    });

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

function getCursorPosition() {
    var range = quill.getSelection();
    if (range) {
        if (range.length == 0) {
            console.log('User cursor is at index', range.index);
            return range.index;
        } else {
            var text = quill.getText(range.index, range.length);
            console.log('User has highlighted: ', text);
        }
    } else {
        console.log('User cursor is not in editor');
    }
}

function drag(dragevent) {
    var text = dragevent.target.id;
    dragevent.dataTransfer.setData("text", text);
    console.log(dragevent.target.id);
}

function drop(dropevent) {
    dropevent.preventDefault();
    console.log("here drip")
    var note = dropevent.dataTransfer.getData("text");
    console.log(document.getElementById(note));
    const cursor = getCursorPosition();
    // quill.format('highlight', note);
    var highlength = 0;
    if (document.getElementById(note).lastElementChild.lastElementChild.innerText.length != 0) {
        quill.insertText(getCursorPosition(), " [");
        quill.insertText(getCursorPosition(), document.getElementById(note).lastElementChild.lastElementChild.innerText, true);
        quill.insertText(getCursorPosition(), "] ");
        highlength = 4;
    }
    quill.insertText(getCursorPosition(), document.getElementById(note).lastElementChild.firstElementChild.innerText, true);
    quill.insertText(getCursorPosition(), " "); 
    quill.formatText(cursor + document.getElementById(note).lastElementChild.lastElementChild.innerText.length + highlength , document.getElementById(note).lastElementChild.firstElementChild.innerText.length ,'highlight', note);
    iterId();
}

function highlight(id) {
    //document.getElementById(id).className = "hightlighted-element";
    $('#'+id).css({ transform: 'scale(1.2)' });
    $('#'+id).css({ transition: 'transform .2s' });
}

function unhighlight(id) {
    $('#'+id).css({ transform: 'scale(1)' });
}

function iterId() {
    console.log("iteration");
    console.log(iter);
    iter += 1;
}

async function getData() {
    // for (let i = 0; i < nbFile; i++) {
    //     const container = document.createElement('div');
    //     document.getElementById("annotations").append(container);
    //     const doc = document.createElement('p');
    //     doc.appendChild(document.createTextNode("Document " + (i + 1)));
    //     doc.setAttribute("class", "docName");
    //     container.append(doc);
    //     passagesDiv[i] = container;
    // }
    const res = await fetch('/notes');
    const data = await res.json();

    for (item of data) {

        const newAnnot = document.createElement('div');
        const handle = document.createElement('div');
        const content = document.createElement('div');
        const passage = document.createElement('a');
        const note = document.createElement('p');
        const strPassage = document.createTextNode(`${item.passage}`);
        const strNote = document.createTextNode(`${item.annotation}`);

        newAnnot.setAttribute("id", `${item._id}`);
        newAnnot.setAttribute("draggable", "true");
        newAnnot.setAttribute("ondragstart", `drag(event)`);

        newAnnot.setAttribute("data-fileid", `${item.fileId}`);
        newAnnot.setAttribute("data-startOffset", `${item.startOffset}`)
        newAnnot.setAttribute("data-endOffset", `${item.endOffset}`)
        newAnnot.setAttribute("data-startIndex", `${item.startIndex}`)
        newAnnot.setAttribute("data-endIndex", `${item.endIndex}`)

        content.setAttribute("class","content");
        note.setAttribute("class", "annot-note");
        passage.setAttribute("class", "annot-pass");
        newAnnot.setAttribute("class", "note draggable");
        handle.setAttribute("class", "draghandle");

        passage.appendChild(strPassage);
        note.appendChild(strNote);
        content.appendChild(passage);
        content.appendChild(note);
        newAnnot.appendChild(handle);
        newAnnot.appendChild(content);

        console.log(`${item.fileId}`);

        //passagesDiv[`${item.fileId}`-1].append(newAnnot);

        document.getElementById("annotations").append(newAnnot);
    }
}
