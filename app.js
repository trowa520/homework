//app.js
let http = require('./utils/request.js')
App({
  globalData: {
    host: 'https://dev.xiangqingou.cn',
    userInfo: null,
    openId: '',
    sessionKey: '',
    code: '',
    token: 'Bearer ',
    scene:'',
    times: 0,
    score:0,
    mobile:0,
  },
  onLaunch: function (res) {
    var that = this
    // 判断进入小程序的场景  
    this.globalData.scene = res.scene;
    console.log(res)
    var scenes = [1007, 1008];
    var scene = scenes.indexOf(res.scene)
    if (scene == -1) {
      // wx.showToast({
      //   title: '通过分享卡片进来',
      //   icon: 'none'
      // })
    }
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              this.globalData.userInfo = res.userInfo
              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        }
      }
    })
  },
  // 获取openid 并 社会化登录
  login: function () {
    var that = this;
    return new Promise(function (resolve, reject) {
      if (that.globalData.token != 'Bearer ') {
        console.log('已经登录')
        resolve(that.globalData.token)
      } else {
        wx.showLoading()
        // 登录
        wx.login({
          success: res => {
            that.globalData.code = res.code
            // 发送 res.code 到后台换取 openId, sessionKey, unionId
            wx.request({
              url: that.globalData.host + '/code2session',
              data: {
                code: res.code
              },
              success: function (res) {
                that.globalData.openId = res.data.openid
                that.globalData.sessionKey = res.data.session_key
                // 判断是否是同一个用户登录
                try{
                  const openId = wx.getStorageSync('openId')
                  if(openId != res.data.openid) {
                    wx.clearStorage()
                    wx.setStorage({
                      key: 'openId',
                      data: res.data.openid,
                    })
                  }
                  that.socialLogin(res.data.openid, resolve, reject)
                }catch(e) {
                  wx.showToast({
                    title: '正在获取数据，请稍等...',
                    icon: 'none'
                  })
                }
              },
              fail: function (res) {
                wx.hideLoading()
                reject(res.data.code)
              }
            })
          },
          fail:function(res) {
            wx.hideLoading()
            reject(res)
          }
        })
      }
    })
  },
  // 社会化登陆
  socialLogin: function(openId, resolve, reject) {
    var that = this
    wx.request({
      url: that.globalData.host + '/api/social-login',
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      data: {
        user_id: openId,
        role: 'student',
        provider: "wechat_mp_homework"
      },
      method: 'POST',
      success: function (res) {
        wx.hideLoading()
        if (res.data.code == 0) {
          that.globalData.token += res.data.access_token
          that.globalData.mobile = res.data.mobile
          console.log(that.globalData.token)
          resolve(res.data.access_token)
        }
      },
      fail: function (res) {
        wx.hideLoading()
        reject(res.data.code)
      }
    })
  }
  
})