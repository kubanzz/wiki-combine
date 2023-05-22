<template lang="pug">
  v-dialog(
    v-model='isShown'
    max-width='850px'
    overlay-color='blue darken-4'
    overlay-opacity='.7'
    )
    v-card.page-selector(v-if='mode !== `batch-move`' :minWidth=818)
      .dialog-header.is-blue
        v-icon.mr-3(color='white') mdi-page-next-outline
        .body-1(v-if='mode === `create`') {{$t('common:pageSelector.createTitle')}}
        .body-1(v-else-if='mode === `move`') {{$t('common:pageSelector.moveTitle')}}
        .body-1(v-else-if='mode === `select`') {{$t('common:pageSelector.selectTitle')}}
        v-spacer
        v-progress-circular(
          indeterminate
          color='white'
          :size='20'
          :width='2'
          v-show='searchLoading'
          )
      .d-flex
        v-flex.grey(xs5, :class='$vuetify.theme.dark ? `darken-4` : `lighten-3`')
          v-toolbar(color='grey darken-3', dark, dense, flat)
            .body-2 {{$t('common:pageSelector.virtualFolders')}}
            v-spacer
            v-btn(v-if="path === `home` && mode === 'move'" icon, tile, href='https://docs.requarks.io/guide/pages#folders', target='_blank')
              v-icon mdi-help-box
          div(style='height:400px;')
            vue-scroll(:ops='scrollStyle')

              v-treeview(
                :key='`pageTree-` + treeViewCacheId'
                :active.sync='currentNode'
                :open.sync='openNodes'
                :items='tree'
                :load-children='fetchFolders'
                expand-icon='mdi-menu-down-outline'
                item-id='path'
                item-text='title'
                dense
                activatable=true
                )
                template(slot='prepend', slot-scope='{ item, open, leaf }')
                  v-icon mdi-{{ open ? 'folder-open' : 'folder' }}
                <template v-slot:label="{ item }">
                  <v-hover v-slot:default="{ hover }">
                    <div>
                      <span v-if="!item.editing">{{item.title}}</span>
                      <span class="icon-group">
                        <v-icon v-if="hover && !item.editing && hasAdminPermission" :class="{ 'icon-operate': hover }" class="mdi mdi-plus" @click="createFolder(item, false)" style="margin-right: 0.3em;"></v-icon>
                        <v-icon v-if="item.id != 0 && hover && !item.editing && hasAdminPermission" :class="{ 'icon-operate': hover }" class="mdi mdi-pencil" @click="editFolder(item)"></v-icon>
                      </span>
                      <v-text-field v-if="item.editing" v-model="item.title" :ref="`input-${item.id}`" :id="`input-${item.id}`" hide-details solo hide-details dense flat clearable>
                      </v-text-field>
                    </div>
                  </v-hover>
                </template>
        v-flex(xs7)
          v-toolbar(color='blue darken-2', dark, dense, flat)
            .body-2 {{$t('common:pageSelector.pages')}}
          div(v-if='currentPages.length > 0 ', style='height:400px;')
            vue-scroll(:ops='scrollStyle')
              v-list.py-0(dense)
                v-list-item-group(
                  v-model='currentPage'
                  color='primary'
                  )
                  template(v-for='(page, idx) of currentPages')
                    <div style="display: flex; align-items: center; justify-content: center;">
                      v-list-item(:key='`page-` + page.id', :value='page' , :disabled="!hasAdminPermission")
                        v-list-item-icon: v-icon mdi-text-box
                        v-list-item-title {{page.title}}
                    </div>
                    v-divider(v-if='idx < pages.length - 1')
          v-alert.animated.fadeIn(
            v-else
            text
            color='orange'
            prominent
            icon='mdi-alert'
            )
            .body-2 {{$t('common:pageSelector.folderEmptyWarning')}}

      //- v-card-actions.grey.pa-2(:class='$vuetify.theme.dark ? `darken-2` : `lighten-1`', v-if='!mustExist')
      //-   v-select(
      //-     solo
      //-     dark
      //-     flat
      //-     background-color='grey darken-3-d2'
      //-     hide-details
      //-     single-line
      //-     :items='namespaces'
      //-     style='flex: 0 0 100px; border-radius: 4px 0 0 4px;'
      //-     v-model='currentLocale'
      //-     )
      //-   v-text-field(
      //-     ref='pathIpt'
      //-     solo
      //-     hide-details
      //-     prefix='/'
      //-     v-model='currentPath'
      //-     flat
      //-     clearable
      //-     style='border-radius: 0 4px 4px 0;'
      //-   )
      v-card-chin
        v-spacer
        v-btn(text, @click='close') {{$t('common:actions.cancel')}}
        v-btn.px-4(v-if="mode === 'move'" color='primary', @click='open', :disabled='!isValidPath')
          v-icon(left) mdi-check
          span {{$t('common:actions.move')}}
        v-btn.px-4(v-else-if="mode !== 'batch-move'" color='primary', @click='open', :disabled='!isValidPath')
          v-icon(left) mdi-check
          span {{$t('common:actions.select')}}

    v-card.page-selector(v-else-if='mode === `batch-move`' :minWidth=818)
      .dialog-header.is-blue
        v-icon.mr-3(color='white') mdi-page-next-outline
        .body-1 {{$t('common:pageSelector.moveTitle')}}
        v-spacer
        v-progress-circular(
          indeterminate
          color='white'
          :size='20'
          :width='2'
          v-show='searchLoading'
          )
      .d-flex
        v-flex.grey(xs6, :class='$vuetify.theme.dark ? `darken-4` : `lighten-3`')
          v-toolbar(color='grey darken-3', dark, dense, flat)
            .body-2 {{$t('源文件夹')}}
            v-spacer
            v-btn(v-if="mode === 'batch-move'", @click="deleteDialog = true" icon, tile, target='_blank')
              v-icon mdi-delete
            <v-dialog v-model="deleteDialog" width="20%" persistent @click:outside="deleteDialog = false">
              <v-card>
                <v-card-title>
                  <span class="headline">确定删除?</span>
                </v-card-title>

                <v-card-actions>
                  <v-btn color="darken-1" text @click='batchDelete'>确定</v-btn>
                  <v-spacer></v-spacer>
                  <v-btn color="blue darken-1" text @click="deleteDialog = false">取消</v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
          div(style='height:400px;')
            vue-scroll(:ops='scrollStyle')

              v-treeview(
                :key='`pageTree-` + treeViewCacheId'
                ref="moveSourceTreeview"
                :active.sync='currentNode'
                :open.sync='openNodes'
                :items='tree'
                :load-children='fetchFoldersAndPages'
                :open-on-click='openOnClick'
                expand-icon='mdi-menu-down-outline'
                item-id='path'
                item-text='title'
                dense
                )
                template(slot='prepend', slot-scope='{ item, open, leaf }')
                  <div style="display: flex; align-items: center; justify-content: center;">
                    v-checkbox(v-if='mode === `batch-move` && item.id  !== 0'
                      hide-details class="mr-2" style="display: contents;" v-model="item.checked" @change="onCheckboxChange($event, item)" @click.stop)
                    v-icon mdi-{{leaf ? (item.isFolder ? (open ? 'folder-open' : 'folder') : 'text-box') : (open ? 'folder-open' : 'folder')}}
                  </div>
                <template v-slot:label="{ item }">
                  <v-hover v-slot:default="{ hover }">
                    <div>
                      <span v-if="!item.editing">{{item.title}}</span>
                      //- v-card-actions.grey.pa-2(:class='$vuetify.theme.dark ? `darken-2` : `lighten-1`',  v-if="item.editing")
                      <v-text-field v-if="item.editing" v-model="item.title" :ref="`input-${item.id}`" :id="`input-${item.id}`" hide-details solo hide-details dense flat clearable>
                      </v-text-field>
                    </div>
                  </v-hover>
                </template>
        //- v-flex(xs7)
        //-   v-toolbar(color='blue darken-2', dark, dense, flat)
        //-     .body-2 {{$t('common:pageSelector.pages')}}
        //-   div(v-if='currentPages.length > 0 ', style='height:400px;')
        //-     vue-scroll(:ops='scrollStyle')
        //-       v-list.py-0(dense)
        //-         v-list-item-group(
        //-           v-model='currentPage'
        //-           color='primary'
        //-           )
        //-           template(v-for='(page, idx) of currentPages')
        //-             <div style="display: flex; align-items: center; justify-content: center;">
        //-               v-list-item(:key='`page-` + page.id', :value='page' , :disabled="!hasAdminPermission")
        //-                 div
        //-                   v-checkbox(v-if='mode === `batch-move` && path === `home`' v-model="page.checked" hide-details @change="onCheckboxChange($event, page)"
        //-                     class="mr-2" style = "display: contents; width: auto;")
        //-                 v-list-item-icon: v-icon mdi-text-box
        //-                 v-list-item-title {{page.title}}
        //-             </div>
        //-             v-divider(v-if='idx < pages.length - 1')
        //-   v-alert.animated.fadeIn(
        //-     v-else
        //-     text
        //-     color='orange'
        //-     prominent
        //-     icon='mdi-alert'
        //-     )
        //-     .body-2 {{$t('common:pageSelector.folderEmptyWarning')}}

        v-flex(xs6)
          v-toolbar(color='blue darken-2', dark, dense, flat)
            .body-2 {{$t('目标文件夹')}}
            v-spacer
            v-btn(v-if="path === `home` && mode === 'move'" icon, tile, href='https://docs.requarks.io/guide/pages#folders', target='_blank')
              v-icon mdi-help-box
          div(style='height:400px;')
            vue-scroll(:ops='scrollStyle')

              v-treeview(
                :key='`pageTree-` + treeViewCacheId'
                :active.sync='batchMove_currentNode'
                ref="moveTargetTreeview"
                @update:active="onNodeActivated"
                :open.sync='batchMove_openNodes'
                :items='batchMove_tree'
                :load-children='fetchFolders'
                expand-icon='mdi-menu-down-outline'
                item-id='path'
                item-text='title'
                dense
                activatable=true
                )
                template(slot='prepend', slot-scope='{ item, open, leaf }')
                  v-icon(v-if="item.isFolder === true || item.id === 0") mdi-{{ open ? 'folder-open' : 'folder' }}
                <template v-slot:label="{ item }">
                  <v-hover v-if="item.isFolder === true || item.id === 0" v-slot:default="{ hover }">
                    <div>
                      <span v-if="!item.editing">{{item.title}}</span>
                      <span class="icon-group">
                        <v-icon v-if="hover && !item.editing && hasAdminPermission" :class="{ 'icon-operate': hover }" class="mdi mdi-plus" @click="createFolder(item, true)" style="margin-right: 0.3em;"></v-icon>
                        <v-icon v-if="item.id != 0 && hover && !item.editing && hasAdminPermission" :class="{ 'icon-operate': hover }" class="mdi mdi-pencil" @click="editFolder(item)"></v-icon>
                      </span>
                      <v-text-field v-if="item.editing" v-model="item.title" :ref="`input-${item.id}`" :id="`input-${item.id}`" hide-details solo dense flat clearable>
                      </v-text-field>
                    </div>
                  </v-hover>
                </template>

      v-card-chin
        v-spacer
        v-btn(text, @click='close') {{$t('common:actions.cancel')}}
        v-btn.px-4(v-if="mode === 'batch-move'" color='primary', @click='batchMove', :disabled='!isValidPath')
          v-icon(left) mdi-check
          span {{$t('common:actions.move')}}
        v-btn.px-4(v-else-if="mode !== 'batch-move'" color='primary', @click='open', :disabled='!isValidPath')
          v-icon(left) mdi-check
          span {{$t('common:actions.select')}}
</template>

<script>
import _ from 'lodash'
import gql from 'graphql-tag'
import { get } from 'vuex-pathify'

const localeSegmentRegex = /^[A-Z]{2}(-[A-Z]{2})?$/i

/* global siteLangs, siteConfig */

export default {
  props: {
    value: {
      type: Boolean,
      default: false
    },
    path: {
      type: String,
      default: 'new-page'
    },
    locale: {
      type: String,
      default: 'en'
    },
    mode: {
      type: String,
      default: 'create'
    },
    openHandler: {
      type: Function,
      default: () => {}
    },
    mustExist: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      deleteDialog: false,
      treeViewCacheId: 0,
      searchLoading: false,
      currentLocale: siteConfig.lang,
      currentFolderPath: '',
      currentPath: 'new-page',
      currentPage: null,
      currentNode: [0],
      openNodes: [0],
      openOnClick: true,
      batchMove_currentPath: '',
      batchMove_currentNode: [0],
      batchMove_openNodes: [0],
      checkBoxSelectedArray: [],
      batchMove_tree: [
        {
          id: 0,
          title: '/' + ' (root)',
          children: []
        }
      ],
      tree: [
        {
          id: 0,
          title: '/' + ' (root)',
          children: []
        }
      ],
      pages: [],
      all: [],
      namespaces: siteLangs.length ? siteLangs.map(ns => ns.code) : [siteConfig.lang],
      scrollStyle: {
        vuescroll: {},
        scrollPanel: {
          initialScrollX: 0.01, // fix scrollbar not disappearing on load
          scrollingX: false,
          speed: 50
        },
        rail: {
          gutterOfEnds: '2px'
        },
        bar: {
          onlyShowBarOnScroll: false,
          background: '#999',
          hoverStyle: {
            background: '#64B5F6'
          }
        }
      }
    }
  },
  computed: {
    hasAdminPermission: get('page/effectivePermissions@system.manage'),
    isShown: {
      get() { return this.value },
      set(val) { this.$emit('input', val) }
    },
    currentPages () {
      return _.sortBy(_.filter(this.pages, ['parent', _.head(this.currentNode) || 0]), ['title', 'path'])
    },
    isValidPath () {
      if (!this.currentPath) {
        return false
      }
      if (this.mustExist && !this.currentPage) {
        return false
      }
      const firstSection = _.head(this.currentPath.split('/'))
      if (firstSection.length <= 1) {
        return false
      } else if (localeSegmentRegex.test(firstSection)) {
        return false
      } else if (
        _.some(['login', 'logout', 'register', 'verify', 'favicons', 'fonts', 'img', 'js', 'svg'], p => {
          return p === firstSection
        })) {
        return false
      } else {
        return true
      }
    }
  },
  watch: {
    isShown (newValue, oldValue) {
      if (newValue && !oldValue) {
        this.currentPath = this.path
        this.currentLocale = this.locale
        _.delay(() => {
          // this.$refs.pathIpt.focus()
        })
      }
    },
    currentNode (newValue, oldValue) {
      if (newValue.length < 1) { // force a selection
        this.$nextTick(() => {
          this.currentNode = oldValue
        })
      } else {
        const current = _.find(this.all, ['id', newValue[0]])

        let index = this.openNodes.indexOf(newValue[0])
        if (index < 0) { // auto open and load children
          if (current) {
            if (this.openNodes.indexOf(current.parent) < 0) {
              this.$nextTick(() => {
                this.openNodes.push(current.parent)
              })
            }
          }
          this.$nextTick(() => {
            this.openNodes.push(newValue[0])
          })
        }

        this.currentPath = _.compact([_.get(current, 'path', ''), _.last(this.currentPath.split('/'))]).join('/')
      }
    },
    batchMove_currentNode (newValue, oldValue) {
      console.log('batchMove_currentNode --- ' + newValue + ' --- ' + oldValue)
      if (newValue.length < 1) { // force a selection
        this.$nextTick(() => {
          this.batchMove_currentNode = oldValue
        })
      } else {
        const current = _.find(this.all, ['id', newValue[0]])

        let index = this.batchMove_openNodes.indexOf(newValue[0])
        if (index < 0) { // auto open and load children
          if (current) {
            if (this.batchMove_openNodes.indexOf(current.parent) < 0) {
              this.$nextTick(() => {
                this.batchMove_openNodes.push(current.parent)
              })
            }
          }
          this.$nextTick(() => {
            this.batchMove_openNodes.push(newValue[0])
          })
        }

        //- this.batchMove_currentPath = _.compact([_.get(current, 'path', ''), _.last(this.batchMove_currentPath.split('/'))]).join('/')
      }
    },
    currentPage (newValue, oldValue) {
      if (!_.isEmpty(newValue)) {
        this.currentPath = newValue.path
        // 创建模式下给新增路径添加默认值(此处只给页面元素添加page-select列表右侧) ，比如在/home 下点击新增页面路径默认为 /home/page
        if (this.mode === 'create') {
          this.currentPath += '/new-page'
        }
      }
    },
    currentLocale (newValue, oldValue) {
      this.$nextTick(() => {
        this.tree = [
          {
            id: 0,
            title: '/ (root)',
            children: []
          }
        ]
        this.currentNode = [0]
        this.openNodes = [0]
        this.pages = []
        this.all = []
        this.treeViewCacheId += 1
      })
    }
  },
  methods: {
    async batchDelete() {
      console.debug(' checkBoxSelectedArray：%o', this.checkBoxSelectedArray)
      const deleteObjectArray = this.checkBoxSelectedArray.map(obj => {
        return { path: obj.path, title: obj.title, isFolder: obj.isFolder }
      })

      if (deleteObjectArray.length === 0) {
        this.$store.commit('showNotification', {
          message: '请选择要删除的文件',
          style: 'error',
          icon: 'check'
        })
        this.deleteDialog = false
        return
      }
      const resp = await this.$apollo.mutate({
        mutation: gql`
          mutation (
            $deleteObjectArray: [SourceObject]!
          ) {
            pages {
              batchDelete (
                deleteObjectArray: $deleteObjectArray
              ) {
                responseResult {
                  succeeded
                  errorCode
                  slug
                  message
                }
              }
            }
          }
        `,
        variables: {
          deleteObjectArray: deleteObjectArray
        }
      })

      const result = _.get(resp, 'data.pages.batchDelete').responseResult
      if (result.succeeded) {
        for (let i = 0; i < this.checkBoxSelectedArray.length; i++) {
          let obj = this.checkBoxSelectedArray[i]
          this.removeItemById(this.tree, obj.treeId)
          this.removeItemById(this.batchMove_tree, obj.treeId)
        }
        this.checkBoxSelectedArray = []
        this.deleteDialog = false
      }

      this.$store.commit('showNotification', {
        message: result.message,
        style: 'success',
        icon: 'check'
      })
    },
    onNodeActivated(item) {
      const target = this.all.find(obj => obj.id === item[0])
      if (target) {
        this.batchMove_currentPath = target.path
      } else {
        if (item[0] === undefined || item[0] === 0) {
          this.batchMove_currentPath = '/'
        } else {
          console.log('目标文件夹不存在，请重新选择')
        }
      }
      console.debug('all：%o --- target：%o', this.all, item)
    },
    async batchMove() {
      if (this.checkBoxSelectedArray.length === 0) {
        this.$store.commit('showNotification', {
          message: '请选择要移动的文件夹',
          style: 'error',
          icon: 'check'
        })
        return
      }
      if (this.batchMove_currentPath === '') {
        this.$store.commit('showNotification', {
          message: '请选择目标文件夹',
          style: 'error',
          icon: 'check'
        })
        return
      }
      const sourceObjectArray = this.checkBoxSelectedArray.map(obj => {
        return { path: obj.path, isFolder: obj.isFolder }
      })
      console.log('移动文件：%o --- 目的地文件夹：%o --- 当前树结构：%o', this.checkBoxSelectedArray, this.batchMove_currentPath, this.all)

      const resp = await this.$apollo.mutate({
        mutation: gql`
          mutation (
            $sourceObjectArray: [SourceObject]!
            $targetPath: String!
          ) {
            pages {
              batchMove (
                sourceObjectArray: $sourceObjectArray
                targetPath: $targetPath
              ) {
                responseResult {
                  succeeded
                  errorCode
                  slug
                  message
                }
              }
            }
          }
        `,
        variables: {
          sourceObjectArray: sourceObjectArray,
          targetPath: this.batchMove_currentPath
        }
      })

      console.debug('tree：%o', this.tree)
      console.debug('batch-move-resp：%o', resp)
      const result = _.get(resp, 'data.pages.batchMove')

      let respStyle = 'error'
      if (result.responseResult.succeeded === true) {
        console.log('openOnClick：%o', this.openOnClick)

        if (this.openNodes.indexOf(0) === -1) this.openNodes.push(0)
        if (this.batchMove_openNodes.indexOf(0) === -1) this.batchMove_openNodes.push(0)

        // 需要刷新的节点即为当前打开的 + 当前选中的
        let openNodesCopy = this.openNodes.slice()
        let batchMoveOpenNodesCopy = this.batchMove_openNodes.slice()

        if (openNodesCopy.indexOf(this.batchMove_currentNode[0]) === -1) await openNodesCopy.push(this.batchMove_currentNode[0])
        if (batchMoveOpenNodesCopy.indexOf(this.batchMove_currentNode[0]) === -1) await batchMoveOpenNodesCopy.push(this.batchMove_currentNode[0])

        await openNodesCopy.sort((a, b) => a - b)
        await batchMoveOpenNodesCopy.sort((a, b) => a - b)

        console.log('排序后的数组：%o', openNodesCopy)
        for (let i = 0; i < openNodesCopy.length; i++) {
          console.debug('开始查找前节点数据：id：%o --- tree：%o', openNodesCopy[i], this.tree)
          let item = await this.findTreeItemById(this.tree, openNodesCopy[i])
          if (item) {
            await this.fetchFoldersAndPages(item)
          } else {
            console.log('找不到树节点 id：%o --- tree：%o', openNodesCopy[i], this.tree)
          }
        }

        for (let i = 0; i < batchMoveOpenNodesCopy.length; i++) {
          let item = await this.findTreeItemById(this.batchMove_tree, batchMoveOpenNodesCopy[i])
          if (item) {
            await this.fetchFolders(item)
          }
        }

        let currentIndexLeft = this.openNodes.indexOf(this.batchMove_currentNode[0])
        let currentIndexRight = this.batchMove_openNodes.indexOf(this.batchMove_currentNode[0])
        if (currentIndexLeft !== -1) {
          this.openNodes.splice(currentIndexLeft, 1)
        }
        if (currentIndexRight !== -1) {
          this.batchMove_openNodes.splice(currentIndexRight, 1)
        }

        await this.openNodes.push(this.batchMove_currentNode[0])
        await this.batchMove_openNodes.push(this.batchMove_currentNode[0])
        this.checkBoxSelectedArray = []

        await this.$refs.moveSourceTreeview.updateAll()
        this.openNodes = openNodesCopy
        this.batchMove_openNodes = batchMoveOpenNodesCopy

        respStyle = 'success'
      }

      console.debug('文件迁移后：tree：%o === this.batchMove_tree：%o', this.tree, this.batchMove_tree)
      this.$store.commit('showNotification', {
        message: result.responseResult.message,
        style: respStyle,
        icon: 'check'
      })
    },
    async reloadOpenNodes() {
      _.sortBy(this.openNodes)
      _.sortBy(this.batchMove_openNodes)
      console.log('reloadOpenNodes：this.openNodes：%o === this.batchMove_openNodes：%o', this.openNodes, this.batchMove_openNodes)
      for (let i = 0; i < this.openNodes.length; i++) {
        let sourceTreeOpenItem = await this.findTreeItemById(this.tree, this.openNodes[i])
        await this.fetchFoldersAndPages(sourceTreeOpenItem)
      }
      for (let i = 0; i < this.batchMove_currentNode.length; i++) {
        let targetTreeOpenItem = await this.findTreeItemById(this.batchMove_tree, this.batchMove_openNodes[i])
        await this.fetchFolders(targetTreeOpenItem)
      }
    },
    findTreeItemById (tree, id) {
      for (let i = 0; i < tree.length; i++) {
        const node = tree[i]
        if (node.id === id) {
          return node
        }
        if (node.children) {
          const foundNode = this.findTreeItemById(node.children, id)
          if (foundNode) {
            return foundNode
          }
        }
      }
      return null
    },
    removeItemById(tree, id) {
      for (let i = 0; i < tree.length; i++) {
        const item = tree[i]
        if (item.id === id) {
          tree.splice(i, 1)
          return true
        }
        if (item.children && this.removeItemById(item.children, id)) {
          return true
        }
      }
      return false
    },
    addToTree(tree, nodeId, newNode) {
      for (let node of tree) {
        if (node.id === nodeId) {
          if (!node.children) {
            node.children = []
          }
          newNode.path = node.path + '/' + _.last(newNode.path.split('/'))
          newNode.parent = node.id
          node.children.push(newNode)
          return true
        }
        if (node.children && node.children.length > 0) {
          const added = this.addToTree(node.children, nodeId, newNode)
          if (added) {
            return true
          }
        }
      }
      return false
    },
    onCheckboxChange(event, item) {
      const isChecked = event
      if (isChecked) {
        let ancestors = item.ancestors
        const isFatherInSeleted = this.checkBoxSelectedArray.some(item => ancestors.includes(item.treeId))
        if (!isFatherInSeleted) {
          this.checkBoxSelectedArray.push({
            treeId: item.id,
            pageId: item.pageId,
            title: item.title,
            path: item.path,
            isFolder: item.isFolder,
            ancestors: item.ancestors,
            parent: item.parent
          })
        }
      } else {
        let index = this.checkBoxSelectedArray.findIndex(obj => obj.treeId === item.id)
        if (index !== -1) {
          this.checkBoxSelectedArray.splice(index, 1)
        }
      }
      console.log('checkBoxSelectedArray：%o ---- event：%o ---- item：%o', this.checkBoxSelectedArray, event, item)
    },
    close() {
      this.isShown = false
    },
    open() {
      const exit = this.openHandler({
        locale: this.currentLocale,
        path: this.currentPath,
        id: (this.mustExist && this.currentPage) ? this.currentPage.pageId : 0
      })
      if (exit !== false) {
        this.close()
      }
    },
    async fetchFolders (item) {
      console.log('构建【fetchFolders】目录树，item：{}', item)
      if (item.isLoaded) {
        return
      }

      this.searchLoading = true
      const resp = await this.$apollo.query({
        query: gql`
          query ($parent: Int!, $mode: PageTreeMode!, $locale: String!) {
            pages {
              tree(parent: $parent, mode: $mode, locale: $locale) {
                id
                path
                title
                isFolder
                pageId
                parent
              }
            }
          }
        `,
        fetchPolicy: 'network-only',
        variables: {
          parent: item.id,
          mode: 'ALL',
          locale: this.currentLocale
        }
      })
      const items = _.get(resp, 'data.pages.tree', [])
      const itemFolders = _.filter(items, ['isFolder', true]).map(f => ({...f, children: [], checked: false}))
      const itemPages = _.filter(items, i => i.pageId > 0).map(f => ({...f, checked: false}))

      console.log('itemFolders：%o', itemFolders)
      if (itemFolders.length > 0) {
        item.children = itemFolders
      } else {
        item.children = undefined
      }
      this.pages = _.unionBy(this.pages, itemPages, 'id')
      this.all = _.unionBy(this.all, items, 'id')

      this.searchLoading = false
    },
    async fetchFoldersAndPages (item) {
      console.log('构建【fetchFoldersAndPages】目录树，item：{}', item)
      if (item.isLoaded) {
        return
      }

      this.searchLoading = true
      const resp = await this.$apollo.query({
        query: gql`
          query ($parent: Int!, $mode: PageTreeMode!, $locale: String!) {
            pages {
              tree(parent: $parent, mode: $mode, locale: $locale) {
                id
                path
                title
                isFolder
                pageId
                parent
                ancestors
              }
            }
          }
        `,
        fetchPolicy: 'network-only',
        variables: {
          parent: item.id,
          mode: 'ALL',
          locale: this.currentLocale
        }
      })
      const items = _.get(resp, 'data.pages.tree', []).filter(f => f.path !== 'home')
      const itemFolders = _.filter(items, ['isFolder', true]).map(f => ({...f, children: [], checked: false}))
      const itemPages = _.filter(items, i => i.pageId > 0).map(f => ({...f, checked: false}))

      console.log('itemFolders：%o ===== itemPages：%o', itemFolders, itemPages)
      if (itemFolders.length > 0 || itemPages.length > 0) {
        item.children = [...itemFolders, ...itemPages]
      } else {
        item.children = undefined
      }
      this.pages = _.unionBy(this.pages, itemPages, 'id')
      this.all = _.unionBy(this.all, items, 'id')

      this.searchLoading = false
    },
    async editFolder(item) {
      item.editing = true
      const oldTitleName = item.title
      // 等待tree-view下拉目录渲染完毕
      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })
      this.$nextTick(() => {
        let input = document.getElementById(`input-${item.id}`)
        console.log('item：%o ===== input：%o', item, input)

        //- input.focus()
        //- input.select()

        input.addEventListener('blur', async () => {
          if (item.editing === true) {
            item.editing = false
            let inputVal = input.value.trim()
            console.debug('inputVal：[%s]', inputVal)
            if (inputVal === '') {
              item.title = oldTitleName
              this.$store.commit('showNotification', {
                message: '文件夹名不允许为空',
                style: 'error',
                icon: 'check'
              })
            } else {
              await this.renameFolder(item, inputVal, oldTitleName)
            }
          }
        })

        input.addEventListener('keydown', async (event) => {
          if (event.key === 'Enter' || event.key === 'Esc') {
            if (item.editing === true) {
              item.editing = false
              let inputVal = input.value.trim()
              console.debug('inputVal：[%s]', inputVal)
              if (inputVal === '') {
                item.title = oldTitleName
                this.$store.commit('showNotification', {
                  message: '文件夹名不允许为空',
                  style: 'error',
                  icon: 'check'
                })
              } else {
                await this.renameFolder(item, inputVal, oldTitleName)
              }
            }
          }
        })
      })
    },
    async renameFolder(item, newName, oldName) {
      let oldPath = item.path
      let newPath = _.initial(item.path.split('/')).join('/') + ('/' + newName)

      // 去除地址前后的'/'
      newPath = newPath.trim().replace(/^\/|\/$/g, '')
      oldPath = oldPath.trim().replace(/^\/|\/$/g, '')

      let sourceFileItem = this.findTreeItemById(this.tree, item.parent)
      let sourceFileList = sourceFileItem ? sourceFileItem.children : []

      let targetFileItem = this.findTreeItemById(this.batchMove_tree, item.parent)
      let targetFileList = targetFileItem ? targetFileItem.children : []

      console.log('sourceFileList：%o ===== targetFileList：%o', sourceFileList, targetFileList)
      let fileList = [...sourceFileList, ...targetFileList]
      let index = fileList.findIndex(file => file.path === newPath)
      console.debug('filelist: %o', fileList)
      if (index !== -1) {
        this.$store.commit('showNotification', {
          message: '重复文件名：' + item.title,
          style: 'error',
          icon: 'check'
        })
        item.title = oldName
        return
      }
      console.log('newPath：' + newPath)

      if (oldPath === newPath) return
      await this.updateFolderName(oldPath, newPath, item.isFolder)

      //- let sourceUpdateItem = this.findTreeItemById(this.tree, item.parent)
      //- let targetUpdateItem = this.findTreeItemById(this.batchMove_tree, item.parent)
      //- this.fetchFoldersAndPages(sourceUpdateItem)
      //- this.fetchFolders(targetUpdateItem)

      console.debug(' item：%o', item)

      let openNodes = this.openNodes
      let batchMoveOpenNodes = this.batchMove_openNodes

      if (openNodes.indexOf(0) === -1) openNodes.push(0)
      if (batchMoveOpenNodes.indexOf(0) === -1) batchMoveOpenNodes.push(0)

      if (openNodes.indexOf(item.parent) === -1) openNodes.push(item.parent)
      if (batchMoveOpenNodes.indexOf(item.parent) === -1) batchMoveOpenNodes.push(item.parent)

      await openNodes.sort()
      await batchMoveOpenNodes.sort()

      console.log(' openNodes：%o ================  batchMove_openNodes：%o', openNodes, batchMoveOpenNodes)
      for (let i = 0; i < openNodes.length; i++) {
        let item = await this.findTreeItemById(this.tree, openNodes[i])
        console.debug('%o--sourceTree: %o === targetTree-%o: %o', item, this.tree, this.batchMove_tree)
        if (this.mode === 'batch-move') await this.fetchFoldersAndPages(item)
        else await this.fetchFolders(item)
      }

      for (let i = 0; i < batchMoveOpenNodes.length; i++) {
        let item = await this.findTreeItemById(this.batchMove_tree, batchMoveOpenNodes[i])
        await this.fetchFolders(item)
      }
    },
    async updateFolderName(oldPath, newPath, isFolder) {
      let resp = await this.$apollo.mutate({
        mutation: gql`
          mutation (
            $oldPath: String!,
            $newPath: String!,
            $isFolder: Boolean!
          ) {
            pages {
              updateFolderPath(
                oldPath: $oldPath,
                newPath: $newPath
                isFolder: $isFolder
              ) {
                responseResult {
                  succeeded
                  errorCode
                  slug
                  message
                }
              }
            }
          }
      `,
        variables: {
          oldPath: oldPath,
          newPath: newPath,
          isFolder: isFolder
        }
      })
      console.log('update folder name resp：', resp)
      resp = _.get(resp, 'data.pages.updateFolderPath.responseResult', {})

      if (resp.succeeded === true) {
        this.$store.commit('showNotification', {
          message: resp.message,
          style: 'success',
          icon: 'check'
        })
      } else {
        this.$store.commit('showNotification', {
          message: resp.message,
          style: 'error',
          icon: 'check'
        })
      }
    },
    async createFolder(item, batchMoveFlag = false) {
      this.newName = ''

      const folderId = Math.floor(Math.random() * 1000000000)
      const newFolder = {
        id: folderId,
        title: '',
        children: [],
        editing: true,
        isFolder: true,
        path: '',
        parent: item.id
      }
      await this.fetchFolders(item)
      if (!item.children) {
        item.children = []
      }
      await item.children.push(newFolder)

      let openNodes = this.openNodes
      if (batchMoveFlag) {
        openNodes = this.batchMove_openNodes
      }
      // 保持当前文件夹下拉状态
      if (openNodes.indexOf(0) === -1) {
        await openNodes.push(0)
      }
      if (openNodes.indexOf(item.id) === -1) {
        await openNodes.push(item.id)
      }

      // 等待tree-view下拉目录渲染完毕
      await new Promise(resolve => {
        setTimeout(resolve, 500)
      })

      this.$nextTick(() => {
        const input = document.getElementById(`input-${newFolder.id}`)
        input.focus()
        input.select()
        input.addEventListener('blur', async () => {
          if (newFolder.editing === true) {
            newFolder.editing = false
            let inputVal = input.value.trim()
            if (inputVal === '') {
              this.$store.commit('showNotification', {
                message: '文件夹名不允许为空',
                style: 'error',
                icon: 'check'
              })
              item.children.pop()
            } else {
              if (item.path !== undefined) {
                newFolder.path += item.path
              }
              newFolder.path += ('/' + input.value)
              console.log('item.path：' + newFolder.path)
              let uploadFolderId = await this.uploadFolder(input, item, folderId)
              newFolder.id = uploadFolderId
              await this.fetchFolders(item)

              console.log(' batchMoveFlag：' + batchMoveFlag)
              let sourceTreeItem = this.findTreeItemById(this.tree, item.id)
              if (sourceTreeItem && batchMoveFlag) await this.fetchFoldersAndPages(sourceTreeItem)
            }
          }
        })

        input.addEventListener('keydown', async (event) => {
          if (event.key === 'Enter' || event.key === 'Esc') {
            if (newFolder.editing === true) {
              newFolder.editing = false
              let inputVal = input.value.trim()
              if (inputVal === '') {
                this.$store.commit('showNotification', {
                  message: '文件夹名不允许为空',
                  style: 'error',
                  icon: 'check'
                })
                item.children.pop()
              } else {
                if (item.path !== undefined) {
                  newFolder.path += item.path
                }
                newFolder.path += ('/' + input.value)
                console.log('item.path：' + newFolder.path)
                let uploadFolderId = await this.uploadFolder(input, item, folderId)
                newFolder.id = uploadFolderId
                await this.fetchFolders(item)

                console.log(' batchMoveFlag：' + batchMoveFlag)
                let sourceTreeItem = this.findTreeItemById(this.tree, item.id)
                if (sourceTreeItem && batchMoveFlag) await this.fetchFoldersAndPages(sourceTreeItem)
              }
            }
          }
        })
      })
    },
    async uploadFolder(input, item, folderId) {
      console.log('this.currentNode：' + this.currentNode)
      const inputValue = input.value
      if (inputValue === '' || inputValue === undefined) {
        console.log('删除文件名为空的文件夹, id-{}', input.id)
        item.children = item.children.filter(child => child.id !== folderId)
        return
      }

      const targetItem = item.children.filter(child => child.id === folderId)
      console.log('targetItem：{}', targetItem[0].path)

      let resp = await this.$apollo.mutate({
        mutation: gql`
          mutation (
            $path: String!,
            $locale: String!
          ) {
            pages {
              addPageTree(
                path: $path,
                locale: $locale
              ) {
                responseResult {
                  succeeded
                  errorCode
                  slug
                  message
                },
                pageId
              }
            }
          }
      `,
        variables: {
          path: targetItem[0].path,
          locale: this.$store.get('page/locale')
        }
      })
      console.log('add page resp：', resp)
      resp = _.get(resp, 'data.pages.create', {})
    }
  }
}
</script>

<style lang='scss'>

.page-selector {
  .v-treeview-node__label {
    font-size: 13px;
  }
  .v-treeview-node__content {
    cursor: pointer;
  }
}

.icon-group {
  position: absolute;
  right: 2em;
}

.icon-operate:hover {
  transform: scale(1.2);
}
</style>
