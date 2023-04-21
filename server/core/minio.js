/* eslint-disable no-undef */
const Minio = require('minio')
// WIKI.logger.info('----------mini初始化开始,minio 服务地址:' + WIKI.config.minio.endPoint)

const minioClient = new Minio.Client({
  endPoint: WIKI.config.minio.endPoint,
  Region: WIKI.config.minio.Region,
  port: WIKI.config.minio.port,
  useSSL: WIKI.config.minio.useSSL,
  accessKey: WIKI.config.minio.accessKey,
  secretKey: WIKI.config.minio.secretKey
})

module.exports = {
  init() {
    this.minioClient = minioClient
    if (!this.bucketExists()) {
      this.makeBucket()
      this.setBucketPolicy()
    }

    return this
  },
  bucketExists(bucketName = WIKI.config.minio.bucketName) {
    return minioClient.bucketExists(bucketName, function (err) {
      if (err) {
        if (err.code !== 'NoSuchBucket') {
          WIKI.logger.error('bucketExists 方法执行失败 e：', err)
        }
        return false
      }
      return true
    })
  },
  makeBucket(bucketName = WIKI.config.minio.bucketName) {
    minioClient.makeBucket(bucketName, 'us-east-1', function (err) {
      if (err) {
        return false
      }
      WIKI.logger.info('Bucket created successfully in "us-east-1".')
      return true
    })
  },
  putObject(objectName, stream, callback) {
    minioClient.putObject(WIKI.config.minio.bucketName, objectName, stream, callback)
  },
  async putObjectAsync(objectName, stream) {
    const res = await minioClient.putObject(WIKI.config.minio.bucketName, objectName, stream)
    return res
  },
  setBucketPolicy() {
    minioClient.setBucketPolicy(WIKI.config.minio.bucketName, 'readwrite', () => { })
  }

}
