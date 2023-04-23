<template lang="pug">
  v-dialog(
    v-model='isShown'
    max-width='850px'
    overlay-color='blue darken-4'
    overlay-opacity='.7'
    )
    v-card.page-selector(:minWidth=818)
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
            v-btn(icon, tile, href='https://docs.requarks.io/guide/pages#folders', target='_blank')
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
                //- template(slot='append', slot-scope='{ item, open, leaf }')
                //-   v-icon(@click='createFolder(item)') mdi-plus
                <template v-slot:label="{ item }"  @click="(event) => onUpdateActive(event, item)">
                  <v-hover v-slot:default="{ hover }">
                    <div>
                      <span v-if="!item.editing">{{item.title}}</span>
                      <v-icon v-if="hover && !item.editing && hasAdminPermission" class="mdi mdi-plus" @click="createFolder(item)" style="margin-left: 70%"></v-icon>
                      //- v-card-actions.grey.pa-2(:class='$vuetify.theme.dark ? `darken-2` : `lighten-1`',  v-if="item.editing")
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
                    v-list-item(:key='`page-` + page.id', :value='page' , :disabled="!hasAdminPermission")
                      v-list-item-icon: v-icon mdi-text-box
                      v-list-item-title {{page.title}}
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
        v-btn.px-4(color='primary', @click='open', :disabled='!isValidPath')
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
      treeViewCacheId: 0,
      searchLoading: false,
      currentLocale: siteConfig.lang,
      currentFolderPath: '',
      currentPath: 'new-page',
      currentPage: null,
      currentNode: [0],
      openNodes: [0],
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

        if (this.openNodes.indexOf(newValue[0]) < 0) { // auto open and load children
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
    async onUpdateActive(event, item) {
      this.currentNode = [item.id]
      event.stopPropagation()
      console.log('this.openNodes：' + this.openNodes)
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
      if (item.isLoaded) {
        return
      }
      console.log('构建目录树')

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
      const itemFolders = _.filter(items, ['isFolder', true]).map(f => ({...f, children: []}))
      const itemPages = _.filter(items, i => i.pageId > 0)

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
    async createFolder(item) {
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
      // 保持当前文件夹下拉状态
      if (this.openNodes.indexOf(0) === -1) {
        await this.openNodes.push(0)
      }
      if (this.openNodes.indexOf(item.id) === -1) {
        await this.openNodes.push(item.id)
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
            if (item.path !== undefined) {
              newFolder.path += item.path
            }
            newFolder.path += ('/' + input.value)
            console.log('item.path：' + newFolder.path)
            let uploadFolderId = await this.uploadFolder(input, item, folderId)
            newFolder.id = uploadFolderId
            await this.fetchFolders(item)
          }
        })

        input.addEventListener('keydown', async (event) => {
          if (event.key === 'Enter' || event.key === 'Esc') {
            if (newFolder.editing === true) {
              newFolder.editing = false
              if (item.path !== undefined) {
                newFolder.path += item.path
              }
              newFolder.path += ('/' + input.value)
              let uploadFolderId = await this.uploadFolder(input, item, folderId)
              newFolder.id = uploadFolderId
              await this.fetchFolders(item)
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

</style>
