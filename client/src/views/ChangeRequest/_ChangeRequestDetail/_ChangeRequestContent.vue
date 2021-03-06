<!--
 - @author: Wei Zheng
 - @description: display change request content. Allow admin to edit.
 -->


<template>
  <div class="box">
    <div
      class="box-header with-border mailbox-read-info"
      style="box-shadow: 0 2px 1px rgba(0,0,0,0.1);"
    >
      <label>Title:</label>
      <h4
        v-if="!isAdmin || !editMode"
        class="capitalize"
        style="min-height:30px; margin-left:10px;"
      >{{requestData.title}}</h4>

      <textarea
        v-if="isAdmin && editMode"
        class="form-control"
        style="width:98%; line-height:1; font-size:18px; margin-left:10px;"
        :value="requestData.title"
        @input="setTitle"
      ></textarea>
    </div>
    <div class="box-body" style="min-height:285px;">
      <label>Detail:</label>
      <div style="margin-left:10px;" v-if="!isAdmin || !editMode" v-html="requestData.details"></div>
      <div style=" margin-left:10px;" :class="{'hide' : !editMode}">
        <textarea id="editor" name="editor" style="width: 100%" v-html="requestData.details"></textarea>
      </div>
    </div>
    <div class="box-footer" v-if="isAdmin">
      <div>
        <transition name="slide-left" mode="out-in">
          <button v-if="!editMode" @click="toggleEditMode" class="btn btn-secondary" key="1">
            <i class="fa fa-edit"></i> Edit
          </button>
          <div v-else key="2" class="btn-group">
            <button type="button" class="btn btn-primary" @click="saveEdit">
              <i class="fa fa-check"></i> Save
            </button>
            <button type="button" class="btn btn-secondary" @click="toggleEditMode">
              <i class="fa fa-close"></i> Cancel
            </button>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script>
import { mapMutations, mapActions, mapGetters } from 'vuex';
import HTTP from '@/http';

export default {
  props: {
    requestData: Object,
    user: Object
  },
  computed: {
    ...mapGetters('userStore', ['isAdmin'])
  },
  data() {
    return {
      editor: null,
      newContent: {},
      editMode: false
    };
  },

  watch: {
    requestData() {
      this.newContent.title = this.requestData.title;
      this.editor.setData(this.requestData.details);
    }
  },

  created() {
    this.setTab('content');
  },

  mounted() {
    var self = this;
    if (this.isAdmin) {
      //initialize editor
      ClassicEditor.create(document.querySelector('#editor'), {
        toolbar: [
          'bold',
          'italic',
          'bulletedList',
          'numberedList',
          'blockQuote',
          'link',
          'mediaEmbed',
          'undo',
          'redo'
        ]
      })
        .then(editor => {
          self.editor = editor;
          // bind edited data
          editor.model.document.on('change', () => {
            self.newContent.details = editor.getData();
          });
        })
        .catch(e => self.setGlobalError(e));
    }
  },

  methods: {
    ...mapMutations('crStore', ['setTab']),
    ...mapActions('errorStore', ['setGlobalError']),

    //toggle edit mode
    toggleEditMode() {
      this.editMode = !this.editMode;
    },

    setTitle(el) {
      this.newContent.title = el.target.value;
    },
    //save the edited content
    saveEdit() {
      if (this.isAdmin) {
        HTTP()
          .put(`/change-request/${this.$route.params.id}`, this.newContent)
          .then(({ data }) => {
            this.requestData.details = data.details;
            this.requestData.title = data.title;
            this.newContent = {};
            this.toggleEditMode();
          })
          .catch(e => {
            //show error if fail
            this.setGlobalError(e);
          });
      }
    }
  }
};
</script>

<style>
</style>
