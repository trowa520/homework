// pages/homework/homework.js
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    homeworks: [],
    is_image: 0,
    is_video: 0,
    images: [],
    videos: [],
    schoolInfo:{},
    date:''
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let date = options.date
    this.data.date = date

    if(options.id) {
      var schoolInfo = {
        id: options.id,
        school_id: options.school_id,
        school: options.school,
        grade_id: options.grade_id,
        grade: options.grade,
        class_id: options.class_id,
        virtual_class: options.virtual_class
      }
      wx.setStorage({
        key: 'schoolInfo',
        data: schoolInfo,
      })
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    var that = this

    wx.getStorage({
      key: 'schoolInfo',
      success: function(res) {
        that.setData({
          schoolInfo: res.data
        })
        wx.showLoading()
        that.getHomeworks()
      },
    })
    
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function (options) {
    var that = this
    var schoolInfo =  that.data.schoolInfo
    if(options.from == 'button') {
      console.log('button')
      return {
        title : '您的作业来了。。。',
        path: '/pages/homework/homework?date=' + this.data.date + '&id=' + schoolInfo.id + '&school_id=' + schoolInfo.school_id + '&school=' + schoolInfo.school + '&grade_id=' + schoolInfo.grade_id + '&grade=' + schoolInfo.grade + '&class_id=' + schoolInfo.class_id + '&virtual_class=' + schoolInfo.virtual_class
      }
    }else {
      console.log('top')
    }

  },
  // 获取作业列表
  getHomeworks: function (e) {
    let that = this
    wx.request({
      url: app.globalData.host + '/api/homeworks',
      method: 'GET',
      data: {
        school: that.data.schoolInfo.school,
        grade: that.data.schoolInfo.grade,
        virtual_class: that.data.schoolInfo.virtual_class,
        date: that.data.date
      },
      success: function (res) {
        if (res.data.data.data.length > 0) {
          that.setData({
            homeworks: res.data.data.data
          })
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
        wx.hideLoading()
        // 隐藏导航栏加载框
        wx.hideNavigationBarLoading();
        // 停止下拉动作
        wx.stopPullDownRefresh();
      },
      fail: function (res) {
        wx.hideLoading()
        console.log(res)
        // 隐藏导航栏加载框
        wx.hideNavigationBarLoading();
        // 停止下拉动作
        wx.stopPullDownRefresh();
      }
    })
  },
  // 图片预览
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
  // 视频预览
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