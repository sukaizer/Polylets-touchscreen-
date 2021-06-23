app.component("annotation-list", {
  /*html*/
  emits: ["update", "del", "selection", "drag"],
  props: ["note", "current"],

  data() {
    return {
      toggled: true,
      display: "▼",
    };
  },

  // template of the html code for the display of the passage object
  template: `
        <template v-if="note.fileId === current">
          <div class="passage draggable" :id="'pass'+note.id" draggable="true">
            <div class="draghandle" @click="dragObject(note.locId)">
              <button class="draghandle-button" @click="del(note.locId)">✕</button>
            </div>
            <div class="quote">
              <a title="retrace quote" class="notes" @click="selectText">{{ note.passage }}</a>
            </div>
            <div class="annotationArea">
              <span class="field-title">Note</span>
              <button class="hide-button" @click="toggle">{{ this.display }}</button>
              <template v-if="toggled">
                <div class="edit-area">
                  <textarea :id="note.id" placeholder="Type here" @input="change($event.target.value,note.locId)"> {{ note.annotation }} </textarea>
                </div>
              </template>
            </div>
          </div>
        </template>
    `,

  // methods related to the passage object
  methods: {
    selectText() {
      this.$emit("selection", this.note);
    },

    getNode() {
      console.log("this is the node");
      console.log(this.note);
    },

    change(value, index) {
      noteObject = {
        note: value,
        i: index,
      };
      this.$emit("update", noteObject);
    },
    del(index) {
      this.$emit("del", index);
    },
    toggle() {
      this.toggled = !this.toggled;
      if (this.toggled) this.display = "▼";
      if (!this.toggled) this.display = "►";
    },
    dragObject(index) {
      this.$emit("drag", index);
    },
  },
});
