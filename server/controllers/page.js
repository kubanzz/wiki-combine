const express = require('express')
const router = express.Router()
const _ = require('lodash')

/**
 * 构建页面导航树
 */
router.get('/buildPageTree', async (req, res, next) => {
  let locale = req.query.locale
  let path = req.query.path
  WIKI.logger.info('路径：' + path + '开始执行-----buildPageTree方法----')
  if (!locale) { locale = WIKI.config.lang.code }

  let curPage = await WIKI.models.knex('pageTree').first().where({
    path: path,
    localeCode: locale
  })
  try {
    if (!curPage) {
      throw new WIKI.Error.PageIsNotExist()
    }

    curPage.locale = curPage.localeCode
    if (!curPage.isFolder && (!curPage.ancestors || curPage.ancestors.length < 1)) {
      return res.status(200).json({
        childTree: [],
        activePage: curPage,
        code: 200
      })
    }

    let ancestors = _.isString(curPage.ancestors) ? JSON.parse(curPage.ancestors) : curPage.ancestors
    ancestors = ancestors || []
    let pids = ancestors
    if (curPage.isFolder) {
      pids = ancestors.concat(curPage.id)
    } else {
      curPage.children = undefined
    }

    // 取到子树各个节点的第一层子类
    let childrens = await WIKI.models.knex('pageTree').where(builder => {
      builder.where('localeCode', locale)
      builder.whereIn('parent', pids)
      builder.whereNotIn('id', ancestors.concat(curPage.id))
    }).orderBy([{ column: 'isFolder', order: 'desc' }, 'title']) || []

    // 过滤权限
    childrens.filter(r => {
      return WIKI.auth.checkAccess(req.user, ['read:pages'], {
        path: r.path,
        locale: r.localeCode
      })
    })
    childrens = childrens.map(r => {
      return {
        ...r,
        parent: r.parent || 0,
        locale: r.localeCode,
        children: r.isFolder ? [] : undefined
      }
    })

    // 取得页面当前path的所有上级path，如果当前path为目录也取出来
    let parentPage = await WIKI.models.knex('pageTree').where(builder => {
      builder.where('localeCode', locale)
      builder.whereIn('id', pids)
    }).orderBy([{ column: 'id', order: 'asc' }, 'title']) || []

    // 过滤权限
    parentPage.filter(r => {
      return WIKI.auth.checkAccess(req.user, ['read:pages'], {
        path: r.path,
        locale: r.localeCode
      })
    })

    parentPage = parentPage.map(r => {
      return {
        ...r,
        parent: r.parent || 0,
        locale: r.localeCode
      }
    })

    // 将父子path连接起来构建树结构
    for (let i = 0; i < parentPage.length - 1; i++) {
      parentPage[i].children = [parentPage[i + 1]]
    }

    parentPage.forEach(r => {
      r.children = Array.isArray(r.children) ? r.children : []
      childrens.forEach(c => {
        if (c.parent === r.id) {
          r.children.push(c)
        }
      })
      // 如果当前页面path是目录,并且包含内容则需要给它加上一个同名页面元素
      addPageFolderPage(r)
    })

    if (parentPage.length > 0 && !curPage.isFolder) {
      parentPage[parentPage.length - 1].children.push(curPage)
    }

    return res.status(200).json({
      childTree: parentPage,
      activePage: curPage,
      code: 200
    })
  } catch (err) {
    WIKI.logger.error('buildPageTree fail err:', err)
    return res.status(200).json({
      message: err.message ? err.message : '服务器出现异常',
      code: err.code ? err.code : 500
    })
  }
})

router.get('/isFoldOnlyOnePage', async (req, res, next) => {
  WIKI.logger.info('--------isFoldOnlyPage 判断开始 path:' + req.query.path)
  const path = req.query.path
  let curPage = await WIKI.models.knex('pageTree').first().where({
    path: path
  })
  try {
    if (!curPage) {
      throw new WIKI.Error.PageIsNotExist()
    }

    let flodPages = await WIKI.models.knex('pageTree').first().where({
      parent: curPage.parent
    })

    let isFoldOnlyOnePage = false
    if (flodPages && flodPages.id) {
      isFoldOnlyOnePage = true
    }

    return res.status(200).json({
      isFoldOnlyOnePage: isFoldOnlyOnePage,
      code: 200
    })
  } catch (err) {
    return res.status(200).json({
      message: err.message ? err.message : '服务器出现异常',
      code: err.code ? err.code : 500
    })
  }
})

router.post('/update/baseInfo', async (req, res, next) => {
  try {
    await WIKI.models.pages.updatePageBaseMsg({
      ...req.body,
      user: req.user
    })
    return res.status(200).json({
      message: '',
      code: 200,
      data: {
        succeeded: true
      }
    })
  } catch (err) {
    return res.status(200).json({
      message: err.message ? err.message : '服务器updatePage出现异常',
      code: err.code ? err.code : 500
    })
  }
})

/**
 * addPageFolderPage
 */
function addPageFolderPage(obj) {
  if (obj.isFolder && obj.pageId > 0) {
    let activePage = {}
    activePage = Object.assign({}, obj)
    activePage.children = undefined
    obj.children = Array.isArray(obj.children) ? obj.children.concat(activePage) : [activePage]
  }
  return obj
}

module.exports = router
