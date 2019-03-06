// pages/share/share.js
const app = getApp()
import { String } from '../../utils/util.js';

Page({
  data: {

  },
  onLoad: function (options) {

  },
  onShow: function () {

  },
  backToHome: function (e) {
    wx.reLaunch({
      url: '/pages/index/index',
    })
  },
  onShareAppMessage: function () {
    let title = '达人招募'
    return {
      title: title,
      imageUrl: '../../images/0.jpg',
      success: function (res) {
        console.log(res)
      }
    }
  }
})