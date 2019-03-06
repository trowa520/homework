// pages/score/score.js
const app = getApp()
import { String, formatTime } from '../../utils/util.js';
Page({
  /**
   * 页面的初始数据
   */
  data: {
    showAdView: true,       // 广告位
    balance: 0,
    goods:[],
    openType: ''
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this
    that.setData({
      balance: app.globalData.score
    })
    wx.showLoading({
      'title': '加载中...'
    })
    if (app.globalData.mobile == 0) {
      that.setData({
        openType: 'getPhoneNumber'
      })
    }
    wx.request({
      url: app.globalData.host + '/api/gifts',
      success: function (res) {
        wx.hideLoading();
        that.setData({
          goods: res.data.data
        })
      },
      fail: function (e) {
        wx.hideLoading();
      }
    })
  },
  showImages: function (e) {
    var that = this
    console.log('展示图片')
    let images = e.currentTarget.dataset.goods.banner
    wx.previewImage({
      urls: images,
      current: images[e.currentTarget.dataset.index]
    })
    return
  },
  closeAd: function () {
    console.log('关闭广告')
    this.setData({
      showAdView: false
    })
  },
  navigateToShare: function () {
    wx.navigateTo({
      url: '/pages/share/share',
    })
  },
  // 积分兑换
  exchage: function (e) {
    var that = this
    var price = e.currentTarget.dataset.price
    var score = app.globalData.score
    if (app.globalData.mobile == 0) {
      if (e.detail.errMsg) {
        if (e.detail.errMsg == 'getPhoneNumber:ok') {
          console.log('允许获取手机号')
          app.login().then(() => {
            wx.request({
              url: app.globalData.host + '/encrypted-data',
              method: "GET",
              data: {
                session_key: app.globalData.sessionKey,
                encrypted_data: e.detail.encryptedData,
                iv: e.detail.iv
              },
              success: function (e) {
                let phoneDetail = JSON.parse(e.data.data)
                let phoneNumber = phoneDetail.purePhoneNumber
                app.globalData.mobile = phoneNumber
                that.setData({
                  openType: ''
                })
                console.log(phoneDetail.purePhoneNumber)
                wx.request({
                  url: app.globalData.host + '/api/social/bind-mobile',
                  method: "POST",
                  header: {
                    'Authorization': app.globalData.token
                  },
                  data:{
                    mobile: phoneDetail.purePhoneNumber
                  },
                  success: function (res) {
                    if (res.data.code == 0) {
                      if (score < price) {
                        wx.showToast({
                          title: '你的积分余额不足，请继续努力哦！',
                          icon: 'none'
                        })
                        return
                      }
                      wx.navigateTo({
                        url: '/pages/exchange/exchange',
                      })
                    }else {
                      app.globalData.mobile = 0
                      wx.showToast({
                        title: '网络错误，请重新绑定！',
                        icon: 'none'
                      })
                      return
                    }
                  }
                })
              },
              fail: function (e) {
                console.log(e)
              }
            })
          })
        }else {
          wx.showToast({
            title: '请允许获取您的手机号，方便与客服人员联系！',
            icon: 'none'
          })
          return
        }
      }
    }else {
      if (score < price) {
        wx.showToast({
          title: '你的积分余额不足，请继续努力哦！',
          icon: 'none'
        })
        return
      }
      wx.navigateTo({
        url: '/pages/exchange/exchange',
      })
    }
    
  },
  scorerecord: function (e) {
    wx.navigateTo({
      url: '/pages/scorerecord/scorerecord',
    })
  }
})