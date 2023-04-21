import request from './index'

// 构建页面树
export function buildPageTree(data) {
  return request({
    url: 'page/buildPageTree',
    method: 'get',
    params: data
  })
}

export function isFoldOnlyPage(data) {
  return request({
    url: 'page/isFoldOnlyOnePage',
    method: 'get',
    params: data
  })
}
// 更新页面基本信息
export function updateBaseInfo(data) {
  return request({
    url: 'page/update/baseInfo',
    method: 'post',
    data: data
  })
}
