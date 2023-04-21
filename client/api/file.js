import request from './index'

// 上传图片
export function uploadImage(data) {
  return request({
    url: 'upload/image',
    headers: {'Content-Type': 'application/json; charset=UTF-8'}, // 设置响应头
    method: 'POST',
    data: data
  })
}
