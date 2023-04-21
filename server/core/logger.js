// const _ = require('lodash')
const winston = require('winston')
require('winston-daily-rotate-file')

/* global WIKI */

module.exports = {
  loggers: {},
  init(uid) {
    const loggerFormats = [
      winston.format.label({ label: uid }),
      winston.format.errors({ stack: true }),
      winston.format.timestamp()
    ]

    if (WIKI.config.logFormat === 'json') {
      loggerFormats.push(winston.format.json())
    } else {
      loggerFormats.push(winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }))
      loggerFormats.push(winston.format.colorize())
      loggerFormats.push(winston.format.printf(({ level, message, label, timestamp, stack }) => {
        // 如果有错误栈，直接返回
        if (stack) return `${timestamp} ${level}: ${stack}`
        // 提取文件名，方法名和行号
        const { filename, method, line } = /\(?([^\s]+):(\d+):\d+\)?(?:\s+([^:]+))?\s*/.exec(message) || {}
        // 格式化日志消息
        return `${timestamp} ${level}${label ? ` [${label}]` : ''}: ${method ? `${method}@${filename}:${line}` : message}`
      }))
    }

    const defaultOptions = {
      datePattern: 'YYYY-MM-DD',
      // zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
    }

    const logger = winston.createLogger({
      level: WIKI.config.logLevel,
      format: winston.format.combine(...loggerFormats)
    })

    // Init Console (default)

    logger.add(new winston.transports.Console({
      name: WIKI.config.logLevel,
      level: WIKI.config.logLevel,
      prettyPrint: true,
      colorize: true,
      silent: false,
      timestamp: true,
      ...defaultOptions

    }))

    logger.add(new winston.transports.DailyRotateFile({
      name: WIKI.config.logLevel,
      level: WIKI.config.logLevel,
      prettyPrint: true,
      colorize: true,
      silent: false,
      timestamp: true,
      // dirname: 'D:/wiki/logs',
      dirname: WIKI.config.logPath, // 生产
      filename: 'wiki_access.log',
      ...defaultOptions
    }))

    logger.add(new winston.transports.DailyRotateFile({
      name: 'error',
      level: 'error',
      prettyPrint: true,
      colorize: true,
      silent: false,
      timestamp: true,
      dirname: WIKI.config.logPath, // 生产
      filename: 'wiki_error.log',
      ...defaultOptions
    }))

    return logger
  }
}
