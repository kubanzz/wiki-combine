// 设置客户端jwt过期时间
function getJwtExpires() {
  return new Date(new Date() * 1 + 48 * 60 * 60 * 1000)
}

export default {
  getJwtExpires
}
