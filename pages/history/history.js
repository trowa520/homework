//index.js
//获取应用实例
const app = getApp()
import { String } from '../../utils/util.js';

Page({
  data: {
    homeworks: [],
    is_image: 0,
    is_video: 0,
    images: [],
    videos: [],
    schools: [],
    schoolInfo: {},
    offsetX:0,

    currentPage: 1, // 当前页数
    totalPage: 1, // 总页数
  },
  onLoad: function () {
    
  },
  onShow: function () {
    var that = this
    wx.getStorage({
      key: 'schoolInfo',
      success: function (res) {
        that.setData({
          schoolInfo: res.data,
          currentPage: 1
        })
        that.getHomeworks(1)
      },
    })
   
    wx.getStorage({
      key: 'schools',
      success: function(res) {
        var currentSchools = []
        that.setData({
          schools: res.data
        })
        res.data.forEach((item, index) => {
          if (item.id == that.data.schoolInfo.id) {
            let offsetX = 60 * index 
            that.setData({
              offsetX: offsetX
            })
          }
        })
      },
    })
  },
  // 获取作业列表
  getHomeworks: function (currentPage) {
    var currentPage = currentPage
    let that = this
    if (String.isBlank(that.data.schoolInfo)) {
      // 隐藏加载框  
      wx.hideLoading();
      // 隐藏导航栏加载框
      wx.hideNavigationBarLoading();
      // 停止下拉动作
      wx.stopPullDownRefresh();
    } else {
      wx.request({
        url: app.globalData.host + '/api/homeworks',
        method: 'GET',
        data: {
          school: that.data.schoolInfo.school,
          grade: that.data.schoolInfo.grade,
          virtual_class: that.data.schoolInfo.virtual_class,
          page: currentPage
        },
        header: {
          'Authorization' : app.globalData.token
        },
        success: function (res) {
          if (res.data.data.data.length > 0) {
            if (currentPage == 1) {
              that.setData({
                homeworks: res.data.data.data
              })
            } else {
              let newHomeworks = that.data.homeworks.concat(res.data.data.data)
              that.setData({
                homeworks: newHomeworks,
                totalPage: res.data.data.last_page
              })
            }
          } else {
            that.setData({
              homeworks: []
            })
            setTimeout(function () {
              wx.showToast({
                title: '没有更多数据！',
                icon: 'none'
              })
            }, 1000)
          }
          // 隐藏加载框  
          wx.hideLoading();
          // 隐藏导航栏加载框
          wx.hideNavigationBarLoading();
          // 停止下拉动作
          wx.stopPullDownRefresh();
        },
        fail: function (res) {
          console.log(res)
          // 隐藏加载框  
          wx.hideLoading();
          // 隐藏导航栏加载框
          wx.hideNavigationBarLoading();
          // 停止下拉动作
          wx.stopPullDownRefresh();
        }

      })
    }
  },
  // 下拉刷新
  onPullDownRefresh: function () {
    wx.showNavigationBarLoading()
    var that = this
    that.setData({
      hideModal: true,
      currentPage: 1
    })
    wx.showLoading({
      'title': '加载中...'
    })
    that.getHomeworks(1)
  },
  onReachBottom: function () {
    var that = this;
    // 显示加载图标  
    wx.showLoading({
      'title': '加载中...'
    })
    that.data.currentPage += 1
    if (that.data.currentPage <= that.data.totalPage) {
      that.getHomeworks(that.data.currentPage)
    } else {
      wx.showToast({
        title: '已经是最后一页了！',
        icon: 'none'
      })
    }
  },
  changeSchool:function(e) {
    let schoolInfo = e.currentTarget.dataset.schoolinfo
    this.setData({
      schoolInfo: schoolInfo
    })
    wx.setStorage({
      key: 'schoolInfo',
      data: schoolInfo,
      currentPage: 1
    })
    wx.showLoading({
      'title': '加载中...'
    })
    this.getHomeworks(1)
  },
  showImages: function (e) {
    console.log('展示图片')
    var that = this;
    let images = e.currentTarget.dataset.images
    console.log(e)
    wx.previewImage({
      urls: images,
      current: images[e.currentTarget.dataset.index]
    })
    return
  },
  // 放大视频播放
  bindVideoScreenChange: function (e) {
    var status = e.detail.fullScreen;
    console.log(status)
    var play = {
      playVideo: false
    }
    if (status) {
      play.playVideo = true;
    } else {
      this.videoContext.pause();
    }
    this.setData(play);
  },
})
