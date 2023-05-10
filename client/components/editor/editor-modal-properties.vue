<template lang='pug'>
  v-dialog(
    v-model='isShown'
    persistent
    width='1000'
    :fullscreen='$vuetify.breakpoint.smAndDown'
    )
    .dialog-header
      v-icon(color='white') mdi-tag-text-outline
      .subtitle-1.white--text.ml-3 {{$t('editor:props.pageProperties')}}
      v-spacer
      v-btn.mx-0(
        outlined
        dark
        @click='emitSaveEvent'
        )
        v-icon(left) mdi-check
        span {{ $t('common:actions.ok') }}
    v-card(tile)
      v-tabs(color='white', background-color='blue darken-1', dark, centered, v-model='currentTab')
        v-tab {{$t('editor:props.info')}}
        v-tab 页面状态
        v-tab(:disabled='!hasScriptPermission') {{$t('editor:props.scripts')}}
        //- v-tab(disabled) {{$t('editor:props.social')}}
        v-tab(:disabled='!hasStylePermission') {{$t('editor:props.styles')}}
        v-tab-item(transition='fade-transition', reverse-transition='fade-transition')
          v-card-text.pt-5
            .overline.pb-5 {{$t('editor:props.pageInfo')}}
            v-text-field(
              ref='iptTitle'
              outlined
              :label='$t(`editor:props.title`)'
              counter='255'
              v-model='title'
              :disabled='mode === "update" && !hasManagePagesPermission '
              :rules='[rules.required,rules.title]'

              )
            v-text-field(
              outlined
              :label='$t(`editor:props.shortDescription`)'
              counter='255'
              v-model='description'
              persistent-hint
              :hint='$t(`editor:props.shortDescriptionHint`)'
              )
          v-divider
          v-card-text.grey.pt-5(:class='$vuetify.theme.dark ? `darken-3-d3` : `lighten-5`')
            .overline.pb-5 {{$t('editor:props.path')}}
            v-container.pa-0(fluid, grid-list-lg)
              v-layout(row, wrap)
                v-flex(xs12, md2)
                  v-select(
                    outlined
                    :label='$t(`editor:props.locale`)'
                    suffix='/'
                    :items='namespaces'
                    v-model='locale'
                    hide-details
                  )
                v-flex(xs12, md10)
                  v-text-field(
                    outlined
                    :label='$t(`editor:props.path`)'
                    append-icon='mdi-folder-search'
                    v-model='path'
                    :hint='$t(`editor:props.pathHint`)'
                    persistent-hint
                    @click:append='showPathSelector'
                    disabled=true
                    :rules='[rules.required, rules.path]'
                    )
          v-divider
          v-card-text.grey.pt-5(:class='$vuetify.theme.dark ? `darken-3-d5` : `lighten-4`')
            .overline.pb-5 {{$t('editor:props.categorization')}}
            v-chip-group.radius-5.mb-5(column, v-if='tags && tags.length > 0')
              v-chip(
                v-for='tag of tags'
                :key='`tag-` + tag'
                close
                label
                color='teal'
                text-color='teal lighten-5'
                @click:close='removeTag(tag)'
                ) {{tag}}
            v-combobox(
              :label='$t(`editor:props.tags`)'
              outlined
              v-model='newTag'
              :hint='$t(`editor:props.tagsHint`)'
              :items='newTagSuggestions'
              :loading='$apollo.queries.newTagSuggestions.loading'
              persistent-hint
              hide-no-data
              :search-input.sync='newTagSearch'
              )
        v-tab-item(transition='fade-transition', reverse-transition='fade-transition')
          v-card-text
            .overline {{$t('editor:props.publishState')}}
            v-switch(
              :label='$t(`editor:props.publishToggle`)'
              v-model='isPublished'
              color='primary'
              :hint='$t(`editor:props.publishToggleHint`)'
              persistent-hint
              inset
              )
          v-divider
          v-card-text.grey.pt-5(:class='$vuetify.theme.dark ? `darken-3-d3` : `lighten-5`')
            v-container.pa-0(fluid, grid-list-lg)
              v-row
                v-col(cols='6')
                  v-dialog(
                    ref='menuPublishStart'
                    :close-on-content-click='false'
                    v-model='isPublishStartShown'
                    :return-value.sync='publishStartDate'
                    width='460px'
                    :disabled='!isPublished'
                    )
                    template(v-slot:activator='{ on }')
                      v-text-field(
                        v-on='on'
                        :label='$t(`editor:props.publishStart`)'
                        v-model='publishStartDate'
                        prepend-icon='mdi-calendar-check'
                        readonly
                        outlined
                        clearable
                        :hint='$t(`editor:props.publishStartHint`)'
                        persistent-hint
                        :disabled='!isPublished'
                        )
                    v-date-picker(
                      v-model='publishStartDate'
                      :min='(new Date()).toISOString().substring(0, 10)'
                      color='primary'
                      reactive
                      scrollable
                      landscape
                      )
                      v-spacer
                      v-btn(
                        text
                        color='primary'
                        @click='isPublishStartShown = false'
                        ) {{$t('common:actions.cancel')}}
                      v-btn(
                        text
                        color='primary'
                        @click='$refs.menuPublishStart.save(publishStartDate)'
                        ) {{$t('common:actions.ok')}}
                v-col(cols='6')
                  v-dialog(
                    ref='menuPublishEnd'
                    :close-on-content-click='false'
                    v-model='isPublishEndShown'
                    :return-value.sync='publishEndDate'
                    width='460px'
                    :disabled='!isPublished'
                    )
                    template(v-slot:activator='{ on }')
                      v-text-field(
                        v-on='on'
                        :label='$t(`editor:props.publishEnd`)'
                        v-model='publishEndDate'
                        prepend-icon='mdi-calendar-remove'
                        readonly
                        outlined
                        clearable
                        :hint='$t(`editor:props.publishEndHint`)'
                        persistent-hint
                        :disabled='!isPublished'
                        )
                    v-date-picker(
                      v-model='publishEndDate'
                      :min='(new Date()).toISOString().substring(0, 10)'
                      color='primary'
                      reactive
                      scrollable
                      landscape
                      )
                      v-spacer
                      v-btn(
                        text
                        color='primary'
                        @click='isPublishEndShown = false'
                        ) {{$t('common:actions.cancel')}}
                      v-btn(
                        text
                        color='primary'
                        @click='$refs.menuPublishEnd.save(publishEndDate)'
                        ) {{$t('common:actions.ok')}}

        v-tab-item(:transition='false', :reverse-transition='false')
          .editor-props-codeeditor-title
            .overline {{$t('editor:props.html')}}
          .editor-props-codeeditor
            textarea(ref='codejs')
          .editor-props-codeeditor-hint
            .caption {{$t('editor:props.htmlHint')}}

        v-tab-item(transition='fade-transition', reverse-transition='fade-transition')
          v-card-text
            .overline {{$t('editor:props.socialFeatures')}}
            v-switch(
              :label='$t(`editor:props.allowComments`)'
              v-model='isPublished'
              color='primary'
              :hint='$t(`editor:props.allowCommentsHint`)'
              persistent-hint
              inset
              )
            v-switch(
              :label='$t(`editor:props.allowRatings`)'
              v-model='isPublished'
              color='primary'
              :hint='$t(`editor:props.allowRatingsHint`)'
              persistent-hint
              disabled
              inset
              )
            v-switch(
              :label='$t(`editor:props.displayAuthor`)'
              v-model='isPublished'
              color='primary'
              :hint='$t(`editor:props.displayAuthorHint`)'
              persistent-hint
              inset
              )
            v-switch(
              :label='$t(`editor:props.displaySharingBar`)'
              v-model='isPublished'
              color='primary'
              :hint='$t(`editor:props.displaySharingBarHint`)'
              persistent-hint
              inset
              )

        v-tab-item(:transition='false', :reverse-transition='false')
          .editor-props-codeeditor-title
            .overline {{$t('editor:props.css')}}
          .editor-props-codeeditor
            textarea(ref='codecss')
          .editor-props-codeeditor-hint
            .caption {{$t('editor:props.cssHint')}}

    page-selector(:mode='pageSelectorMode', v-model='pageSelectorShown', :path='path', :locale='locale', :open-handler='setPath')
</template>

<script>
import _ from 'lodash'
import { sync, get } from 'vuex-pathify'
import gql from 'graphql-tag'

import CodeMirror from 'codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/htmlmixed/htmlmixed.js'
import 'codemirror/mode/css/css.js'
import { validPath, illegalPathMsg } from '../../utils/common'

/* global siteLangs, siteConfig */

export default {
  props: {
    value: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isPublishStartShown: false,
      isPublishEndShown: false,
      pageSelectorShown: false,
      namespaces: siteLangs.length ? siteLangs.map(ns => ns.code) : [siteConfig.lang],
      newTag: '',
      newTagSuggestions: [],
      newTagSearch: '',
      currentTab: 0,
      newPath: '',
      cm: null,
      rules: {
        required: value => !!value || '该项必填.',
        path: value => {
          return !validPath(value) || illegalPathMsg
        },
        title: value => {
          if (!validPath(value)) {
            return illegalPathMsg
          }

          if (value.includes('/') && !this.hasAdminPermission) {
            return '非管理员不能创建多层级目录。'
          }
          return true
        }
      }
    }
  },
  computed: {
    isShown: {
      get() { return this.value },
      set(val) { this.$emit('input', val) }
    },
    title: sync('page/title'),
    mode: get('editor/mode'),
    description: sync('page/description'),
    locale: sync('page/locale'),
    tags: sync('page/tags'),
    path: sync('page/path'),
    routPath: sync('page/routPath'),
    isPublished: sync('page/isPublished'),
    publishStartDate: sync('page/publishStartDate'),
    publishEndDate: sync('page/publishEndDate'),
    scriptJs: sync('page/scriptJs'),
    scriptCss: sync('page/scriptCss'),
    hasScriptPermission: get('page/effectivePermissions@pages.script'),
    hasStylePermission: get('page/effectivePermissions@pages.style'),
    hasAdminPermission: get('page/effectivePermissions@system.manage'),
    hasManagePagesPermission: get('page/effectivePermissions@pages.manage'),
    pageSelectorMode() {
      return (this.mode === 'create') ? 'create' : 'move'
    }
  },
  beforeMount() {
    this.routPath = this.path
    if (this.mode === 'create') {
      // 目录下创建新页面会自动加上new-page，页面下创建不会加。
      // 此处就是去除page-select页面给this.path自动加上的new-page，然后让this.path最后一个层级跟随this.title变化。
      if (this.path.indexOf('new-page') > -1) {
        this.title = 'new-page'
        this.newPath = this.path.substr(0, this.path.lastIndexOf('new-page'))
        this.routPath = this.newPath
      } else {
        this.newPath = this.path
      }
    } else if (this.mode === 'update') {
      // title和path的最后一个层级需要同步更改
      if (this.path.indexOf('/') > -1) {
        this.newPath = this.path.substr(0, this.path.lastIndexOf('/') + 1)
      } else {
        this.newPath = ''
      }
    }
  },
  watch: {
    title(newValue, oldValue) {
      if (this.mode === 'create') {
        if (this.newPath.substr(-1) === '/') {
          this.path = this.newPath + newValue
        } else {
          this.path = newValue ? (this.newPath + '/' + newValue) : this.newPath
        }
        // 去除前/
        this.path = this.path.indexOf('/') === 0 ? this.path.substr(1) : this.path
      } else if (this.mode === 'update') {
        // 编辑模式
        this.path = this.newPath + this.title
      }
    },
    value(newValue, oldValue) {
      if (newValue) {
        _.delay(() => {
          this.$refs.iptTitle.focus()
        }, 500)
      }
    },
    newTag(newValue, oldValue) {
      const tagClean = _.trim(newValue || '').toLowerCase()
      if (tagClean && tagClean.length > 0) {
        if (!_.includes(this.tags, tagClean)) {
          this.tags = [...this.tags, tagClean]
        }
        this.$nextTick(() => {
          this.newTag = null
        })
      }
    },
    currentTab(newValue, oldValue) {
      if (this.cm) {
        this.cm.toTextArea()
      }
      if (newValue === 2) {
        this.$nextTick(() => {
          setTimeout(() => {
            this.loadEditor(this.$refs.codejs, 'html')
          }, 100)
        })
      } else if (newValue === 4) {
        this.$nextTick(() => {
          setTimeout(() => {
            this.loadEditor(this.$refs.codecss, 'css')
          }, 100)
        })
      }
    }
  },
  methods: {
    emitSaveEvent() {
      this.$emit('save-event', 'editor-modal-properties save event')
    },
    removeTag(tag) {
      this.tags = _.without(this.tags, tag)
    },
    close() {
      this.isShown = false
    },
    showPathSelector() {
      this.pageSelectorShown = true
    },
    setPath({ path, locale }) {
      this.locale = locale
      this.path = path
      this.newPath = this.path
    },
    loadEditor(ref, mode) {
      this.cm = CodeMirror.fromTextArea(ref, {
        tabSize: 2,
        mode: `text/${mode}`,
        theme: 'wikijs-dark',
        lineNumbers: true,
        lineWrapping: true,
        line: true,
        styleActiveLine: true,
        viewportMargin: 50,
        inputStyle: 'contenteditable',
        direction: 'ltr'
      })
      switch (mode) {
        case 'html':
          this.cm.setValue(this.scriptJs)
          this.cm.on('change', c => {
            this.scriptJs = c.getValue()
          })
          break
        case 'css':
          this.cm.setValue(this.scriptCss)
          this.cm.on('change', c => {
            this.scriptCss = c.getValue()
          })
          break
        default:
          console.warn('Invalid Editor Mode')
          break
      }
      this.cm.setSize(null, '500px')
      this.$nextTick(() => {
        this.cm.refresh()
        this.cm.focus()
      })
    }
  },
  apollo: {
    newTagSuggestions: {
      query: gql`
        query ($query: String!) {
          pages {
            searchTags (query: $query)
          }
        }
      `,
      variables() {
        return {
          query: this.newTagSearch
        }
      },
      fetchPolicy: 'cache-first',
      update: (data) => _.get(data, 'pages.searchTags', []),
      skip() {
        return !this.value || _.isEmpty(this.newTagSearch)
      },
      throttle: 500
    }
  }
}
</script>

<style lang='scss'>
.editor-props-codeeditor {
  background-color: mc('grey', '900');
  min-height: 500px;

  >textarea {
    visibility: hidden;
  }

  &-title {
    background-color: mc('grey', '900');
    border-bottom: 1px solid lighten(mc('grey', '900'), 10%);
    color: #FFF;
    padding: 10px;
  }

  &-hint {
    background-color: mc('grey', '900');
    border-top: 1px solid lighten(mc('grey', '900'), 5%);
    color: mc('grey', '500');
    padding: 5px 10px;
  }
}
</style>
