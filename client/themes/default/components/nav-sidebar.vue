<template lang="pug">
  div
    .pa-3.d-flex(:class='$vuetify.theme.dark ? `grey darken-5` : `blue darken-3`')
      v-btn(
        depressed
        :color='$vuetify.theme.dark ? `grey darken-4` : `blue darken-2`'
        style='min-width:0;'
        @click='goHome'
        :aria-label='$t(`common:header.home`)'
        )
        v-icon(size='20') mdi-home

      v-btn.ml-3(
        disabled:true
        depressed
        :color='$vuetify.theme.dark ? `grey darken-4` : `blue darken-2`'
         style='flex: 1 1 100%;'
         max-width=168
        )
        v-icon(left) mdi-navigation
        .body-2.text-none 主菜单
    v-divider

    v-treeview.ml-n2(
        color='white'
        dense
        hoverable
        activatable
        return-object
        open-on-click
        :open.sync='open'
        item-key='id'
        item-text='title'
        :active.sync='active'
        :items='categoryList'
        :load-children="loadChildren"
        @update:active="updateActive"

           )
        template( v-slot:prepend="{ item, open }" )
          v-icon.pr-2(v-if="item.isFolder && item.children" ) {{ open ? 'mdi-folder-open' : 'mdi-folder' }}
          v-icon.pr-2(v-else) mdi-file-document-outline

        template(v-slot:label="{ item }")
          div(class='tree-item')
            a(v-if="!item.children" :href="'/'+item.locale+'/'+item.path")
              span {{item.title}}
            span(v-else) {{item.title}}

</template>

<script>
import _ from 'lodash'
import gql from 'graphql-tag'
import { get } from 'vuex-pathify'
import sessionStorageUtil from '../../../utils/sessionStorageUtil'
import {buildPageTree} from '../../../api/page'

/* global siteLangs */

export default {
  props: {
    color: {
      type: String,
      default: 'primary'
    },
    dark: {
      type: Boolean,
      default: true
    },
    items: {
      type: Array,
      default: () => []
    },
    navMode: {
      type: String,
      default: 'MIXED'
    }
  },
  data() {
    return {
      currentMode: 'custom',
      currentItems: [],
      currentParent: {
        id: 0,
        title: '/ (root)'
      },
      isPageTreeSkip: false,
      parents: [],
      loadedCache: [],
      categoryList: [],
      open: [],
      active: [],
      currentPage: []

    }
  },
  computed: {
    path: get('page/path'),
    locale: get('page/locale')

  },
  methods: {
    switchMode (mode) {
      this.currentMode = mode
      window.localStorage.setItem('navPref', mode)
      if (mode === `browse` && this.loadedCache.length < 1) {
        // this.loadFromCurrentPath()
      }
    },
    updateActive(active) {
      if (this.active.length > 0 && this.currentPage.length > 0 && active[0].id === this.currentPage[0].id) {
        return
      }
      if (active.length < 1) {
        this.active = this.currentPage
      } else {
        this.currentPage = active
        this.isPageTreeSkip = true
        const item = active[0]
        window.location.assign(`/${item.locale}/${item.path}`)
      }
    },
    async loadChildren (item) {
      let children = await this.getChildTree(item)
      children.forEach(item => {
        if (!item.isFolder) {
          item.children = undefined
        }
      })
      if (item.pageId > 0) {
        let newItem = JSON.parse(JSON.stringify(item))
        newItem.children = undefined
        children.push(newItem)
      }
      item.children = children
    },
    async getChildTree(item) {
      const resp = await this.$apollo.query({
        query: gql`
          query ($parent: Int, $locale: String!) {
            pages {
              tree(parent: $parent, mode: ALL, locale: $locale) {
                id
                path
                title
                isFolder
                pageId
                parent
                locale
                children
                isPublished
              }
            }
          }
        `,
        fetchPolicy: 'network-only',
        variables: {
          parent: item.id,
          locale: this.locale
        }
      })
      console.log(' =================== resp：%o', _.get(resp, 'data.pages.tree'))
      return _.get(resp, 'data.pages.tree', [])
    },
    async fetchBrowseItems (item) {
      this.$store.commit(`loadingStart`, 'browse-load')
      if (!item) {
        item = this.currentParent
      }

      if (this.loadedCache.indexOf(item.id) < 0) {
        this.currentItems = []
      }

      if (item.id === 0) {
        this.parents = []
      } else {
        const flushRightIndex = _.findIndex(this.parents, ['id', item.id])
        if (flushRightIndex >= 0) {
          this.parents = _.take(this.parents, flushRightIndex)
        }
        if (this.parents.length < 1) {
          this.parents.push(this.currentParent)
        }
        this.parents.push(item)
      }
      this.currentParent = item
      this.loadedCache = _.union(this.loadedCache, [item.id])
      this.currentItems = await this.getChildTree(item)
      this.$store.commit(`loadingStop`, 'browse-load')
    },
    buildTree() {
      console.debug('---------------开始构建子树 buildTree ------')
      return buildPageTree({
        locale: this.locale,
        path: this.path
      })
    },

    async loadFromCurrentPath() {
      console.debug('---------------开始构造页面树------------------')
      try {
        let tree = await this.getChildTree({
          id: 0,
          title: '/ (root)'
        })
        this.categoryList = tree
      } catch (err) {
        console.error('构造页面树失败：' + JSON.stringify(err))
        return
      }
      console.debug('----------一级树 查询完毕----this.path：' + this.path)
      let childrens = []
      if (this.path !== 'home') {
        // console.log('opens：%o', this.open)
        // let data = await this.buildTree() || {}
        // console.info('----------子树构建完成 --------  %o', data)
        // // // gql
        // childrens = data.childTree || []

        // this.open = childrens
        // if (data.activePage && JSON.stringify(data.activePage) !== '{}') {
        //   // this.active = this.active.concat(data.activePage)
        // }
        // console.info('----------------  %o', this.open)
        // this.currentPage = this.active
      }
      this.categoryList.forEach(item => {
        if (!item.isFolder) {
          item.children = undefined
        } else if (childrens.length > 0 && childrens[0].path === item.path) {
          item.children = childrens[0].children || []
        }
      })
      console.debug('---------------页面树构建完成------------------')
    },

    goHome () {
      sessionStorageUtil.clear()
      window.location.assign(siteLangs.length > 0 ? `/${this.locale}/home` : '/')
    },
    beforeunloadFn(e) {
      const pageTree = {
        key: 'pageTree',
        value: JSON.stringify(this.categoryList),
        expires: 10 * 1000}
      const openFolder = {
        key: 'openFolder',
        value: JSON.stringify(this.open),
        expires: 10 * 1000}
      const activePage = {
        key: 'activePage',
        value: JSON.stringify(this.active),
        expires: 10 * 1000}
      if (this.isPageTreeSkip) {
        sessionStorageUtil.setItem(pageTree)
        sessionStorageUtil.setItem(openFolder)
        sessionStorageUtil.setItem(activePage)
      } else {
        sessionStorageUtil.clear()
      }
    }
  },
  destroyed() {
    window.removeEventListener('beforeunload', this.beforeunloadFn)
  },
  mounted () {
    console.log('---------------mounted------------------')
    this.currentParent.title = `/ ${this.$t('common:sidebar.root')}`
    this.currentMode = 'browse'

    this.$store.commit(`loadingStart`, 'browse-load')
    // 从本地缓存加载数据
    const pageTree = JSON.parse(sessionStorageUtil.getItem('pageTree'))
    const openFolder = JSON.parse(sessionStorageUtil.getItem('openFolder'))
    const activePage = JSON.parse(sessionStorageUtil.getItem('activePage'))
    if (pageTree && openFolder && activePage) {
      console.log(this.path + '页面加载,走本地缓存')
      this.categoryList = pageTree
      this.open = openFolder
      this.active = activePage
      this.currentPage = activePage
    } else {
      this.loadFromCurrentPath()
    }
    this.$store.commit(`loadingStop`, 'browse-load')

    window.addEventListener('beforeunload', this.beforeunloadFn)
  }
}
</script>

<style lang="scss" scoped>
.v-treeview{
  .tree-item {
    font-weight: 500;
    line-height: 1rem;
    font-size: 0.8rem;
  }
  a {
    text-decoration: none;
  }
  &.theme--dark{
    a {
      color: white;
    }
  }
}
</style>
