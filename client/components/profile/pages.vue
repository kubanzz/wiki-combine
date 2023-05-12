<template lang='pug'>
  v-container(fluid, grid-list-lg)
    v-layout(row wrap)
      v-flex(xs12)
        .profile-header
          img.animated.fadeInUp(src='/_assets/svg/icon-file.svg', alt='Users', style='width: 80px;')
          .profile-header-title
            .headline.primary--text.animated.fadeInLeft {{$t('profile:pages.title')}}
            .subheading.grey--text.animated.fadeInLeft {{$t('profile:pages.subtitle')}}
          v-spacer
          v-btn.animated.fadeInDown.wait-p1s(color='grey', outlined, @click='refresh', large)
            v-icon.grey--text mdi-refresh
      v-flex(xs12)
        v-card.animated.fadeInUp
          v-data-table(
            :items='pages'
            :headers='headers'
            :page.sync='pagination'
            :items-per-page='15'
            :loading='loading'
            must-sort,
            sort-by='updatedAt',
            sort-desc,
            hide-default-footer
          )
            template(slot='item', slot-scope='props')
              tr.is-clickable(:active='props.selected', @click='goToPage(props.item.id)')
                td
                  .body-2: strong {{ props.item.title }}
                  .caption {{ props.item.description }}
                td.admin-pages-path
                  v-chip(label, small, :color='$vuetify.theme.dark ? `grey darken-4` : `grey lighten-4`') {{ props.item.locale }}
                  span.ml-2.grey--text(:class='$vuetify.theme.dark ? `text--lighten-1` : `text--darken-2`') / {{ props.item.path }}
                td
                  <v-switch v-model='props.item.isPublished' color="success" hide-details @click.stop="togglePublish(props)" style="margin-top: 0px;padding-top: 0px"></v-switch>
                td {{ dateFormat(props.item.createdAt)}}
                td {{ dateFormat(props.item.updatedAt)}}
            template(slot='no-data')
              v-alert.ma-3(icon='mdi-alert', :value='true', outlined, color='grey')
                em.caption {{$t('profile:pages.emptyList')}}
          .text-center.py-2.animated.fadeInDown(v-if='this.pageTotal > 1')
            v-pagination(v-model='pagination', :length='pageTotal')

    loader(v-model='dialogProgress', title='发布中', subtitle='请稍等')
</template>

<script>
import gql from 'graphql-tag'
import _ from 'lodash'
import {dateFtt} from '../../utils/date-util'

export default {
  data() {
    return {
      selectedPage: {},
      pagination: 1,
      pages: [],
      loading: false,
      dialogProgress: false
    }
  },
  computed: {
    headers () {
      return [
        { text: this.$t('profile:pages.headerTitle'), value: 'title' },
        { text: this.$t('profile:pages.headerPath'), value: 'path' },
        { text: '发布状态', value: 'isPublished' },
        { text: this.$t('profile:pages.headerCreatedAt'), value: 'createdAt', width: 250 },
        { text: this.$t('profile:pages.headerUpdatedAt'), value: 'updatedAt', width: 250 }
      ]
    },
    pageTotal () {
      return Math.ceil(this.pages.length / 15)
    }
  },
  methods: {
    dateFormat (dateStr) {
      return dateFtt('yyyy-MM-dd hh:mm:ss', new Date(dateStr))
    },
    showProgressDialog(textKey) {
      this.dialogProgress = true
    },
    hideProgressDialog() {
      this.dialogProgress = false
    },
    async refresh() {
      await this.$apollo.queries.pages.refetch()
      this.$store.commit('showNotification', {
        message: this.$t('profile:pages.refreshSuccess'),
        style: 'success',
        icon: 'cached'
      })
    },
    goToPage(id) {
      window.location.assign(`/i/` + id)
    },
    async togglePublish(props) {
      // this.showProgressDialog('publishing')

      let resp = await this.$apollo.mutate({
        mutation: gql`
          mutation (
            $id: Int!
            $isPublished: Boolean!
          ) {
            pages {
              publish(
                id: $id
                isPublished: $isPublished
              ) {
                responseResult {
                  succeeded
                  errorCode
                  slug
                  message
                }
                page {
                  updatedAt
                }
              }
            }
          }
        `,
        variables: {
          id: props.item.id,
          isPublished: props.item.isPublished
        }
      })
      resp = _.get(resp, 'data.pages.publish', {})
      if (_.get(resp, 'responseResult.succeeded')) {
        this.$store.set('page/isPublished', props.item.isPublished)
      } else {
        console.log(' ============== resp：%o', resp)
        let errorMessage = ''
        if (!props.item.isPublished) {
          errorMessage += '取消'
        }
        errorMessage += '发布失败：' + _.get(resp, 'responseResult.message')
        props.item.isPublished = !props.item.isPublished
        alert(errorMessage)
      }
    }
  },
  apollo: {
    pages: {
      query: gql`
        query($creatorId: Int, $authorId: Int) {
          pages {
            list(creatorId: $creatorId, authorId: $authorId) {
              id
              locale
              path
              title
              description
              contentType
              isPublished
              isPrivate
              privateNS
              createdAt
              updatedAt
            }
          }
        }
      `,
      variables () {
        return {
          creatorId: this.$store.get('user/id'),
          authorId: this.$store.get('user/id')
        }
      },
      fetchPolicy: 'network-only',
      update: (data) => data.pages.list,
      watchLoading (isLoading) {
        this.loading = isLoading
        this.$store.commit(`loading${isLoading ? 'Start' : 'Stop'}`, 'profile-pages-refresh')
      }
    }
  }
}
</script>

<style lang='scss'>

</style>
