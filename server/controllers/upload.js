const { v4: uuid } = require('uuid')
const express = require('express')
const router = express.Router()
const _ = require('lodash')
const multer = require('multer')
const path = require('path')
const sanitize = require('sanitize-filename')
/* global WIKI */

/**
 * Upload files
 */
router.post('/u', (req, res, next) => {
  multer({
    dest: path.resolve(WIKI.ROOTPATH, WIKI.config.dataPath, 'uploads'),
    limits: {
      fileSize: WIKI.config.uploads.maxFileSize,
      files: WIKI.config.uploads.maxFiles
    }
  }).array('mediaUpload')(req, res, next)
}, async (req, res, next) => {
  if (!_.some(req.user.permissions, pm => _.includes(['write:assets', 'manage:system'], pm))) {
    return res.status(403).json({
      succeeded: false,
      message: 'You are not authorized to upload files.'
    })
  } else if (req.files.length < 1) {
    return res.status(400).json({
      succeeded: false,
      message: 'Missing upload payload.'
    })
  } else if (req.files.length > 1) {
    return res.status(400).json({
      succeeded: false,
      message: 'You cannot upload multiple files within the same request.'
    })
  }
  const fileMeta = _.get(req, 'files[0]', false)
  if (!fileMeta) {
    return res.status(500).json({
      succeeded: false,
      message: 'Missing upload file metadata.'
    })
  }

  // Get folder Id
  let folderId = null
  try {
    const folderRaw = _.get(req, 'body.mediaUpload', false)
    if (folderRaw) {
      folderId = _.get(JSON.parse(folderRaw), 'folderId', null)
      if (folderId === 0) {
        folderId = null
      }
    } else {
      throw new Error('Missing File Metadata')
    }
  } catch (err) {
    return res.status(400).json({
      succeeded: false,
      message: 'Missing upload folder metadata.'
    })
  }

  // Build folder hierarchy
  let hierarchy = []
  if (folderId) {
    try {
      hierarchy = await WIKI.models.assetFolders.getHierarchy(folderId)
    } catch (err) {
      return res.status(400).json({
        succeeded: false,
        message: 'Failed to fetch folder hierarchy.'
      })
    }
  }

  // Sanitize filename
  fileMeta.originalname = sanitize(fileMeta.originalname.toLowerCase().replace(/[\s,;#]+/g, '_'))

  // Check if user can upload at path
  const assetPath = (folderId) ? hierarchy.map(h => h.slug).join('/') + `/${fileMeta.originalname}` : fileMeta.originalname
  if (!WIKI.auth.checkAccess(req.user, ['write:assets'], { path: assetPath })) {
    return res.status(403).json({
      succeeded: false,
      message: 'You are not authorized to upload files to this folder.'
    })
  }

  // Process upload file
  await WIKI.models.assets.upload({
    ...fileMeta,
    mode: 'upload',
    folderId: folderId,
    assetPath,
    user: req.user
  })
  res.send('ok')
})

router.get('/u', async (req, res, next) => {
  res.json({
    ok: true
  })
})

router.post('/upload/image', (req, res, next) => {
  let base64File = req.body.file || ''
  let fileName = req.body.fileName || ''
  let filePath = req.body.filePath || ''

  let fileBlob = dataURLToBlob(base64File)
  let uucode = uuid().replace(/-/g, '')
  fileName = fileName.split('.')[0] + uucode + '.' + fileName.split('.')[1]
  let objName = filePath + '/' + fileName
  WIKI.minio.putObject(objName, fileBlob, (err, data) => {
    if (err) {
      WIKI.logger.error('图片上传minio失败')
      return res.status(200).json({
        code: 500,
        succeeded: false,
        message: '图片粘贴失败。'
      })
    } else {
      let imageUrl = 'http://' + WIKI.config.minio.Region + ':' + WIKI.config.minio.port + '/' + WIKI.config.minio.bucketName + '/' + objName
      return res.status(200).json({
        code: 200,
        imageUrl: imageUrl,
        succeeded: true,
        message: 'upload image success!'
      })
    }
  })
})

/**
*Base64字符串转二进制
*/
function dataURLToBlob(fileDataURL) {
  let arr = fileDataURL.split(',')
  const imgBuffer = Buffer.from(arr[1], 'base64')
  let Readable = require('stream').Readable
  let result = new Readable()
  result.push(imgBuffer)
  result.push(null)
  return result
}

module.exports = router
