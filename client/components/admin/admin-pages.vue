<template lang='pug'>
v-container(fluid, grid-list-lg)
  v-layout(row wrap)
    v-flex(xs12)
      .admin-header
        img.animated.fadeInUp(src='/_assets/svg/icon-file.svg', alt='Page', style='width: 80px;')
        .admin-header-title
          .headline.blue--text.text--darken-2.animated.fadeInLeft Pages
          .subtitle-1.grey--text.animated.fadeInLeft.wait-p2s Manage pages
        v-spacer
        v-btn.animated.fadeInDown.wait-p1s(icon, color='grey', outlined, @click='refresh')
          v-icon.grey--text mdi-refresh
        v-btn.animated.fadeInDown.mx-3(color='primary', outlined, @click='recyclebin', disabled)
          v-icon(left) mdi-delete-outline
          span Recycle Bin
        v-btn.animated.fadeInDown(color='primary', depressed, large, to='pages/visualize')
          v-icon(left) mdi-graph
          span Visualize
      v-card.mt-3.animated.fadeInUp
        .pa-2.d-flex.align-center(:class='$vuetify.theme.dark ? `grey darken-3-d5` : `grey lighten-3`')
          v-text-field(
            solo
            flat
            v-model='search'
            prepend-inner-icon='mdi-file-search-outline'
            label='Search Pages...'
            hide-details
            dense
            style='max-width: 400px;'
            )
          v-spacer
          v-select.ml-2(
            solo
            flat
            hide-details
            dense
            label='Locale'
            :items='langs'
            v-model='selectedLang'
            style='max-width: 250px;'
          )
          v-select.ml-2(
            solo
            flat
            hide-details
            dense
            label='Publish State'
            :items='states'
            v-model='selectedState'
            style='max-width: 250px;'
          )
        v-divider
        v-data-table(
          :items='filteredPages'
          :headers='headers'
          :search='search'
          :page.sync='pagination'
          :items-per-page='15'
          :loading='loading'
          must-sort,
          sort-by='updatedAt',
          sort-desc,
          hide-default-footer
          @page-count="pageTotal = $event"
        )

          template(slot='item', slot-scope='props')
            tr.is-clickable(:active='props.selected')
              td.text-xs-right {{ props.item.id }}
              td
                .body-2: strong {{ props.item.title }}
                .caption {{ props.item.description }}
              td
                v-edit-dialog(
                  :return-value.sync="props.item.path"
                  large
                  @save="save(props.item)"
                  @open="open(props.item)"
                  @close="close(props.item)"
                )  {{ props.item.path }}

                  template( slot='input')
                    div.mt-4.text-h6 Update Path
                    v-text-field(
                      v-model="props.item.path"
                      label="Edit"
                      :rules="[rules.path]"
                      single-line
                      counter
                      autofocus
                    )

              td {{ props.item.createdAt | moment('calendar') }}
              td {{ props.item.updatedAt | moment('calendar') }}

              td
                v-btn(
                  elevation="1"
                  x-small
                  @click="$router.push(`/pages/` + props.item.id)"
                  ) 页面详情

          template(slot='no-data')
            v-alert.ma-3(icon='mdi-alert', :value='true', outlined) No pages to display.
        .text-center.py-2.animated.fadeInDown(v-if='this.pageTotal > 1')
          v-pagination(v-model='pagination', :length='pageTotal')
</template>

<script>
import _ from 'lodash'
import pagesQuery from 'gql/admin/pages/pages-query-list.gql'
import { validPath, illegalPathMsg } from '../../utils/common'
import { updateBaseInfo } from '../../api/page'

export default {
  data() {
    return {
      selectedPage: {},
      pagination: 1,
      pages: [],
      pageTotal: 0,
      headers: [
        { text: 'ID', value: 'id', width: 80, sortable: true },
        { text: 'Title', value: 'title' },
        { text: 'Path(点击可修改路径)', value: 'path' },
        { text: 'Created', value: 'createdAt', width: 250 },
        { text: 'Last Updated', value: 'updatedAt', width: 250 },
        { text: 'Page Detail', sortable: false }
      ],
      search: '',
      selectedLang: null,
      selectedState: null,
      states: [
        { text: 'All Publishing States', value: null },
        { text: 'Published', value: true },
        { text: 'Not Published', value: false }
      ],
      loading: false,
      rules: {
        path: value => {
          return validPath(value) || illegalPathMsg
        }
      },
      oldPath: '',
      oldTitle: '',
      isSaveUpdatedPath: false

    }
  },
  computed: {
    filteredPages() {
      return _.filter(this.pages, pg => {
        if (this.selectedLang !== null && this.selectedLang !== pg.locale) {
          return false
        }
        if (this.selectedState !== null && this.selectedState !== pg.isPublished) {
          return false
        }
        return true
      })
    },
    langs() {
      return _.concat({
        text: 'All Locales',
        value: null
      }, _.uniqBy(this.pages, 'locale').map(pg => ({
        text: pg.locale,
        value: pg.locale
      })))
    }
  },
  methods: {
    async refresh() {
      await this.$apollo.queries.pages.refetch()
      this.$store.commit('showNotification', {
        message: 'Page list has been refreshed.',
        style: 'success',
        icon: 'cached'
      })
    },
    recyclebin() { },
    open(item) {
      this.oldPath = item.path
      this.oldTitle = item.title
    },
    save(item) {
      if (!validPath(item.path)) {
        return this.$store.commit('showNotification', {
          style: 'red',
          message: illegalPathMsg,
          icon: 'alert'
        })
      }
      item.title = item.path.indexOf('/') <= 0 ? item.path : item.path.substr(item.path.lastIndexOf('/') + 1)
      this.isSaveUpdatedPath = true
      let param = {
        ...item
      }
      updateBaseInfo(param).then(resp => {
        this.$store.commit('showNotification', {
          message: '路径修改成功！',
          style: 'success',
          icon: 'check'
        })
      }).catch(err => {
        item.path = this.oldPath
        item.title = this.oldTitle
      })
    },
    close(item) {
      if (!this.isSaveUpdatedPath) {
        item.path = this.oldPath
        item.title = this.oldTitle
      }
    }

  },
  apollo: {
    pages: {
      query: pagesQuery,
      fetchPolicy: 'network-only',
      update: (data) => data.pages.list,
      watchLoading(isLoading) {
        this.loading = isLoading
        this.$store.commit(`loading${isLoading ? 'Start' : 'Stop'}`, 'admin-pages-refresh')
      }
    }
  }
}
</script>

<style lang='scss'>
.admin-pages-path {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  font-family: 'Roboto Mono', monospace;
}
</style>
