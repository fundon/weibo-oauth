'use strict'

const expect = require('expect.js')
const urllib = require('urllib')
const muk = require('muk')
const OAuth = require('../')
const config = require('./config')

describe('oauth.js', function () {
  describe('getAuthorizeURL', function () {
    var auth = new OAuth('appid', 'appsecret')
    it('should ok', function () {
      var url = auth.getAuthorizeURL('http://diveintonode.org/')
      expect(url).to.be.equal('https://api.weibo.com/oauth2/authorize?client_id=appid&redirect_uri=http%3A%2F%2Fdiveintonode.org%2F&response_type=code&scope=users_show&state=#weibo_redirect')
    })

    it('should ok with state', function () {
      var url = auth.getAuthorizeURL('http://diveintonode.org/', 'hehe')
      expect(url).to.be.equal('https://api.weibo.com/oauth2/authorize?client_id=appid&redirect_uri=http%3A%2F%2Fdiveintonode.org%2F&response_type=code&scope=users_show&state=hehe#weibo_redirect')
    })

    it('should ok with state and scope', function () {
      var url = auth.getAuthorizeURL('http://diveintonode.org/', 'hehe', 'email')
      expect(url).to.be.equal('https://api.weibo.com/oauth2/authorize?client_id=appid&redirect_uri=http%3A%2F%2Fdiveintonode.org%2F&response_type=code&scope=email&state=hehe#weibo_redirect')
    })
  })

  describe('getAuthorizeURLForWebsite', function () {
    var auth = new OAuth('appid', 'appsecret')
    it('should ok', function () {
      var url = auth.getAuthorizeURLForWebsite('http://diveintonode.org/')
      expect(url).to.be.equal('https://open.weibo.cn/oauth2/authorize?client_id=appid&redirect_uri=http%3A%2F%2Fdiveintonode.org%2F&response_type=code&scope=users_show&state=#weibo_redirect')
    })

    it('should ok with state', function () {
      var url = auth.getAuthorizeURLForWebsite('http://diveintonode.org/', 'hehe')
      expect(url).to.be.equal('https://open.weibo.cn/oauth2/authorize?client_id=appid&redirect_uri=http%3A%2F%2Fdiveintonode.org%2F&response_type=code&scope=users_show&state=hehe#weibo_redirect')
    })

    it('should ok with state and scope', function () {
      var url = auth.getAuthorizeURLForWebsite('http://diveintonode.org/', 'hehe', 'email')
      expect(url).to.be.equal('https://open.weibo.cn/oauth2/authorize?client_id=appid&redirect_uri=http%3A%2F%2Fdiveintonode.org%2F&response_type=code&scope=email&state=hehe#weibo_redirect')
    })
  })

  describe('getAccessToken', function () {
    var api = new OAuth(config.client_id, config.client_secret)
    it('should invalid', function (done) {
      api.getAccessToken('code', function (err, data) {
        expect(err).to.be.ok()
        expect(err.name).to.be.equal('WeiboAPIError')
        expect(err.message).to.contain('invalid_request')
        done()
      })
    })

    describe('should ok', function () {
      before(function () {
        muk(urllib, 'request', function (url, args, callback) {
          var resp = {
            "access_token":"ACCESS_TOKEN",
            "expires_in":7200,
            "refresh_token":"REFRESH_TOKEN",
            "openid":"OPENID",
            "scope":"SCOPE"
          }
          process.nextTick(function () {
            callback(null, resp)
          })
        })
      })

      after(function () {
        muk.restore()
      })

      it('should ok', function (done) {
        api.getAccessToken('code', function (err, token) {
          expect(err).not.to.be.ok()
          expect(token).to.have.property('data')
          expect(token.data).to.have.keys('access_token', 'expires_in', 'refresh_token', 'openid', 'scope', 'create_at')
          done()
        })
      })
    })
  })

  describe('refreshAccessToken', function () {
    var api = new OAuth('appid', 'secret')

    it('should invalid', function (done) {
      api.refreshAccessToken('refresh_token', function (err, data) {
        expect(err).to.be.ok()
        //expect(err.name).to.be.equal('WeiboAPIError')
        //expect(err.message).to.contain('invalid appid')
        done()
      })
    })

    describe('should ok', function () {
      before(function () {
        muk(urllib, 'request', function (url, args, callback) {
          var resp = {
            "access_token":"ACCESS_TOKEN",
            "expires_in":7200,
            "refresh_token":"REFRESH_TOKEN",
            "openid":"OPENID",
            "scope":"SCOPE"
          }
          process.nextTick(function () {
            callback(null, resp)
          })
        })
      })

      after(function () {
        muk.restore()
      })

      it('should ok', function (done) {
        api.refreshAccessToken('refresh_token', function (err, token) {
          expect(err).not.to.be.ok()
          expect(token.data).to.have.keys('access_token', 'expires_in', 'refresh_token', 'openid', 'scope', 'create_at')
          done()
        })
      })
    })
  })

  describe('_getUser', function () {
    it('should invalid', function (done) {
      var api = new OAuth('appid', 'secret')
      api._getUser({ uid: 'uid' }, 'access_token', function (err, data) {
        expect(err).to.be.ok()
        expect(err.name).to.be.equal('WeiboAPIError')
        expect(err.message).to.contain('source paramter(appkey) is missing')
        done()
      })
    })

    describe('mock get user ok', function () {
      var api = new OAuth('appid', 'secret')
      before(function () {
        muk(urllib, 'request', function (url, args, callback) {
          process.nextTick(function () {
            callback(null, {
              "openid": "OPENID",
              "nickname": "NICKNAME",
              "sex": "1",
              "province": "PROVINCE",
              "city": "CITY",
              "country": "COUNTRY",
              "headimgurl": "http://wx.qlogo.cn/mmopen/g3MonUZtNHkdmzicIlibx6iaFqAc56vxLSUfpb6n5WKSYVY0ChQKkiaJSgQ1dZuTOgvLLrhJbERQQ4eMsv84eavHiaiceqxibJxCfHe/46",
              "privilege": [
                "PRIVILEGE1",
                "PRIVILEGE2"
              ]
            })
          })
        })
      })

      after(function () {
        muk.restore()
      })

      it('should ok', function (done) {
        api._getUser('openid', 'access_token', function (err, data) {
          expect(err).not.to.be.ok()
          expect(data).to.have.keys('openid', 'nickname', 'sex', 'province', 'city',
                                    'country', 'headimgurl', 'privilege')
                                    done()
        })
      })
    })
  })

  describe('getUser', function () {
    it('can not get token', function (done) {
      var api = new OAuth('appid', 'secret')
      api.getUser('openid', function (err, data) {
        expect(err).to.be.ok()
        expect(err.message).to.be.equal('No token for openid, please authorize first.')
        done()
      })
    })

    describe('mock get token error', function () {
      var api = new OAuth('appid', 'secret')
      before(function () {
        muk(api, 'getToken', function (openid, callback) {
          process.nextTick(function () {
            callback(new Error('get token error'))
          })
        })
      })

      after(function () {
        muk.restore()
      })

      it('should ok', function (done) {
        api.getUser('openid', function (err, data) {
          expect(err).to.be.ok()
          expect(err.message).to.be.equal('get token error')
          done()
        })
      })
    })

    describe('mock get null data', function () {
      var api = new OAuth('appid', 'secret')
      before(function () {
        muk(api, 'getToken', function (openid, callback) {
          process.nextTick(function () {
            callback(null, null)
          })
        })
      })

      after(function () {
        muk.restore()
      })

      it('should ok', function (done) {
        api.getUser('openid', function (err, data) {
          expect(err).to.be.ok()
          expect(err).to.have.property('name', 'NoOAuthTokenError')
          expect(err).to.have.property('message', 'No token for openid, please authorize first.')
          done()
        })
      })
    })

    describe('mock get valid token', function () {
      var api = new OAuth('appid', 'secret')
      before(function () {
        muk(api, 'getToken', function (openid, callback) {
          process.nextTick(function () {
            callback(null, {
              access_token: 'access_token',
              create_at: new Date().getTime(),
              expires_in: 60
            })
          })
        })
        muk(api, '_getUser', function (openid, accessToken, callback) {
          process.nextTick(function () {
            callback(null, {
              "openid": "OPENID",
              "nickname": "NICKNAME",
              "sex": "1",
              "province": "PROVINCE",
              "city": "CITY",
              "country": "COUNTRY",
              "headimgurl": "http://wx.qlogo.cn/mmopen/g3MonUZtNHkdmzicIlibx6iaFqAc56vxLSUfpb6n5WKSYVY0ChQKkiaJSgQ1dZuTOgvLLrhJbERQQ4eMsv84eavHiaiceqxibJxCfHe/46",
              "privilege": [
                "PRIVILEGE1",
                "PRIVILEGE2"
              ]
            })
          })
        })
      })

      after(function () {
        muk.restore()
      })

      it('should ok with openid', function (done) {
        api.getUser('openid', function (err, data) {
          expect(err).not.to.be.ok()
          expect(data).to.have.keys('openid', 'nickname', 'sex', 'province', 'city',
                                    'country', 'headimgurl', 'privilege')
                                    done()
        })
      })

      it('should ok with options', function (done) {
        api.getUser({openid: 'openid', lang: 'en'}, function (err, data) {
          expect(err).not.to.be.ok()
          expect(data).to.have.keys('openid', 'nickname', 'sex', 'province', 'city',
                                    'country', 'headimgurl', 'privilege')
                                    done()
        })
      })

      it('should ok with options', function (done) {
        api.getUser({openid: 'openid'}, function (err, data) {
          expect(err).not.to.be.ok()
          expect(data).to.have.keys('openid', 'nickname', 'sex', 'province', 'city',
                                    'country', 'headimgurl', 'privilege')
                                    done()
        })
      })
    })

    describe('mock get invalid token', function () {
      var api = new OAuth('appid', 'secret')
      before(function () {
        muk(api, 'getToken', function (openid, callback) {
          process.nextTick(function () {
            callback(null, {
              access_token: 'access_token',
              create_at: new Date().getTime() - 70 * 1000,
              expires_in: 60
            })
          })
        })
      })

      after(function () {
        muk.restore()
      })

      it('should ok', function (done) {
        api.getUser('openid', function (err, data) {
          expect(err).to.be.ok()
          //expect(err).to.have.property('name', 'weiboAPIError')
          //expect(err.message).to.contain('refresh_token missing')
          done()
        })
      })
    })

    describe('mock get invalid token and refresh_token', function () {
      var api = new OAuth('appid', 'secret')
      before(function () {
        muk(api, 'getToken', function (openid, callback) {
          process.nextTick(function () {
            callback(null, {
              access_token: 'access_token',
              refresh_token: 'refresh_token',
              create_at: new Date().getTime() - 70 * 1000,
              expires_in: 60
            })
          })
        })

        muk(api, 'refreshAccessToken', function (refreshToken, callback) {
          var resp = {
            "access_token":"ACCESS_TOKEN",
            "expires_in":7200,
            "refresh_token":"REFRESH_TOKEN",
            "openid":"OPENID",
            "scope":"SCOPE"
          }
          process.nextTick(function () {
            callback(null, resp)
          })
        })

        muk(api, '_getUser', function (openid, accessToken, callback) {
          process.nextTick(function () {
            callback(null, {
              "openid": "OPENID",
              "nickname": "NICKNAME",
              "sex": "1",
              "province": "PROVINCE",
              "city": "CITY",
              "country": "COUNTRY",
              "headimgurl": "http://wx.qlogo.cn/mmopen/g3MonUZtNHkdmzicIlibx6iaFqAc56vxLSUfpb6n5WKSYVY0ChQKkiaJSgQ1dZuTOgvLLrhJbERQQ4eMsv84eavHiaiceqxibJxCfHe/46",
              "privilege": [
                "PRIVILEGE1",
                "PRIVILEGE2"
              ]
            })
          })
        })
      })

      after(function () {
        muk.restore()
      })

      it('should ok', function (done) {
        api.getUser('openid', function (err, data) {
          expect(err).not.to.be.ok()
          expect(data).to.have.keys('openid', 'nickname', 'sex', 'province', 'city', 'country', 'headimgurl', 'privilege')
          done()
        })
      })
    })
  })

  describe('mock getUserByCode', function () {
    var api = new OAuth('appid', 'secret')
    before(function () {
      muk(urllib, 'request', function (url, args, callback) {
        var resp = {
          "access_token":"ACCESS_TOKEN",
          "expires_in":7200,
          "refresh_token":"REFRESH_TOKEN",
          "openid":"OPENID",
          "scope":"SCOPE"
        }
        process.nextTick(function () {
          callback(null, resp)
        })
      })

      muk(api, '_getUser', function (openid, accessToken, callback) {
        process.nextTick(function () {
          callback(null, {
            "openid": "OPENID",
            "nickname": "NICKNAME",
            "sex": "1",
            "province": "PROVINCE",
            "city": "CITY",
            "country": "COUNTRY",
            "headimgurl": "http://wx.qlogo.cn/mmopen/g3MonUZtNHkdmzicIlibx6iaFqAc56vxLSUfpb6n5WKSYVY0ChQKkiaJSgQ1dZuTOgvLLrhJbERQQ4eMsv84eavHiaiceqxibJxCfHe/46",
            "privilege": [
              "PRIVILEGE1",
              "PRIVILEGE2"
            ]
          })
        })
      })
    })

    after(function () {
      muk.restore()
    })

    it('should ok with getUserByCode', function (done) {
      api.getUserByCode('code', function (err, data) {
        expect(err).not.to.be.ok()
        expect(data).to.have.keys('openid', 'nickname', 'sex',
                                  'province', 'city', 'country',
                                  'headimgurl', 'privilege')
        done()
      })
    })
  })
})
