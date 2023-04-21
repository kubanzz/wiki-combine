const _ = require('lodash')

/* global WIKI */

// ------------------------------------
// OAuth2 Account
// ------------------------------------

const OAuth2Strategy = require('passport-oauth2').Strategy

module.exports = {
  init (passport, conf) {
    var client = new OAuth2Strategy({
      authorizationURL: conf.authorizationURL,
      tokenURL: conf.tokenURL,
      clientID: conf.clientId,
      clientSecret: conf.clientSecret,
      userInfoURL: conf.userInfoURL,
      callbackURL: conf.callbackURL,
      passReqToCallback: true
    }, async (req, accessToken, refreshToken, profile, cb) => {
      try {
        const {data} = profile
        const user = await WIKI.models.users.processProfile({
          providerKey: req.params.strategy,
          profile: {
            ...data,
            id: _.get(data, conf.userIdClaim),
            displayName: _.get(data, conf.displayNameClaim, '???'),
            email: _.get(data, conf.emailClaim) ? _.get(data, conf.emailClaim) : data.userId + '@ijianxin.com'
          }
        })
        cb(null, user)
      } catch (err) {
        cb(err, null)
      }
    })

    client.userProfile = function (token, done) {
      this._oauth2._useAuthorizationHeaderForGET = false
      this._oauth2.get(conf.userInfoURL, token, (err, data) => {
        if (err) {
          return done(err)
        }
        try {
          data = JSON.parse(data)
        } catch (e) {
          return done(e)
        }
        done(null, data)
      })
    }
    passport.use(conf.key, client)
  },
  logout (conf) {
    if (!conf.logoutURL) {
      return '/'
    } else {
      return conf.logoutURL
    }
  }
}
