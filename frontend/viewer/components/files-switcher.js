app.component('files-switcher', {

    emits: ["current-file"],
    
    data() {
        return {
            file1: Element,
            file2: Element,
            file3: Element,
            file4: Element,
            fileId: 0
        }
    },

    mounted() {
        this.getData(0);
        this.getData(1);
        this.getData(2);
        this.getData(3);
    },


    /*html*/
    template: `
        <button class="button-bar" id="b1" @click="onAction(1)" @click="emitter(1)"> FILE 1 </button>
        <button class="button-bar" id="b2" @click="onAction(2)" @click="emitter(2)"> FILE 2 </button>
        <button class="button-bar" id="b3" @click="onAction(3)" @click="emitter(3)"> FILE 3 </button>
        <button class="button-bar" id="b4" @click="onAction(4)" @click="emitter(4)"> FILE 4 </button>
    `,
    methods: {
        onAction(index) {
            switch (index) {
                case 1: document.getElementById("content").innerHTML = file1;
                    fileId = 1;
                    break;
                case 2: document.getElementById("content").innerHTML = file2;
                    fileId = 2;
                    break;
                case 3: document.getElementById("content").innerHTML = file3;
                    fileId = 3;
                    break;
                case 4: document.getElementById("content").innerHTML = file4;
                    fileId = 4;
                    break;
            }
        },

        async getData(index) {
            const rs = await fetch('/files');
            const data = await rs.json();
            const element = document.createElement("div");
            this.buildDOM(element, data[index]);
            switch (index) {
                case 0: file1 = element.innerHTML;
                    break;
                case 1: file2 = element.innerHTML;
                    break;
                case 2: file3 = element.innerHTML;
                    break;
                case 3: file4 = element.innerHTML;
                    break;
            }
        },

        emitter(index) {
            this.$emit('current-file', index);
        },

        buildDOM(element, jsonObject) { // element is the parent element to add the children to
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
        },

        updateFile() {
            switch (fileId) {
                case 1: file1 = document.getElementById("content").innerHTML;
                    break;
                case 2: file2 = document.getElementById("content").innerHTML;
                    break;
                case 3: file3 = document.getElementById("content").innerHTML;
                    break;
                case 4: file4 = document.getElementById("content").innerHTML;
                    break;
            }
        }
    }

})