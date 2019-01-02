const app = getApp()
Page({
  data: {
    homeworks: [],
    schoolInfo:{},
    date:'',
    homework_id: 0,
    homework:{},
    arrange:0
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this
    let date = options.date
    that.data.date = date
    if(options.arrange) {
      that.setData({
        arrange: 1
      })
    }
    if (options.homework_id > 0) {
      that.setData({
        homework_id: options.homework_id
      })
      wx.showLoading({
        'title': '加载中...'
      })
      that.getHomework(options.homework_id)
    }
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
      app.login().then(() => {
        that.bindSchool(options)
      })
    }
    wx.showShareMenu({
      withShareTicket: true
    })
  },
  onUnload: function() {
    if(this.data.arrange == 1) {
      wx.reLaunch({
        url: '/pages/index/index',
      })
    }
  },
  // 绑定学校
  bindSchool:function(options){
    wx.request({
      url: app.globalData.host + '/api/bind-school',
      method: "POST",
      data: {
        school: options.school,
        grade: options.grade,
        virtual_class: options.virtual_class
      },
      header: {
        'Authorization': app.globalData.token
      },
      success: function (res) {
        if(res.data.data.length > 0) {
          wx.setStorage({
            key: 'schoolInfo',
            data: res.data.data,
          })
        }
      }
    })
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
        wx.showLoading({
          'title': '加载中...'
        })
        that.getHomeworks()
      },
    })
  },
  // onUnload:function(){
  //   console.log(123)
  //   wx.reLaunch({
  //     url: '/pages/index/index',
  //   })
  // },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function (options) {
    var that = this
    let schoolInfo = that.data.schoolInfo
    let titles = [
      '客官，您的作业来了！',
      '作业来咯！',
      '有新的作业，请注意查收'
    ]
    let images = [
      'video.png',
      'word.png',
      'arrow.png'
    ]
    // 获取 0 ~ 2 之间的随机整数
    let index = Math.ceil(Math.random() * 3) - 1 ;
    return {
      title: titles[index],
      path: '/pages/homework/homework?date=' + this.data.date + '&id=' + schoolInfo.id + '&school_id=' + schoolInfo.school_id + '&school=' + schoolInfo.school + '&grade_id=' + schoolInfo.grade_id + '&grade=' + schoolInfo.grade + '&class_id=' + schoolInfo.class_id + '&virtual_class=' + schoolInfo.virtual_class,
      imageUrl: '../../images/' + images[index],
      success: function (res) {
        var shareTickets = res.shareTickets;
        if (shareTickets.length == 0) {
          return false;
        }
        wx.getShareInfo({
          shareTicket: shareTickets[0],
          success: function (res) {
            var encryptedData = res.encryptedData;
            var iv = res.iv;
            wx.request({
              url: app.globalData.host + '/encrypted-data',
              data: {
                session_key: app.globalData.sessionKey,
                encrypted_data: res.encryptedData,
                iv: res.iv,
                program: 'homework'
              },
              success: function (res) {
                console.log(res)
              }
            })
            
          }
        })
        wx.reLaunch({
          url: '/pages/index/index',
        })
      },
      fail: function (res) {
        // 转发失败
      }
    }
  },

  getHomework: function(homework_id) {
    let that = this
    wx.request({
      url: app.globalData.host + '/api/homework',
      method: 'GET',
      data: {
        id: homework_id
      },
      header: {
        'Authorization' : app.globalData.token
      },
      success: function (res) {
        console.log(res)
        that.setData({
          homework: res.data.data
        })
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
    }
    this.setData(play);
  },
  deleteHomework:function(e) {
    var that = this
    wx.showModal({
      title: '提示',
      content: '您确认删除嘛？删除后不可恢复！',
      success: function (res) {
        if (res.confirm) {
          wx.showLoading({
            'title': '加载中...'
          })
          wx.request({
            url: app.globalData.host + '/api/homework',
            method:"DELETE",
            header: {
              'Authorization' : app.globalData.token
            },
            data: {
              id: that.data.homework_id
            },
            success:function(res) {
              wx.hideLoading()
              console.log(res)
              wx.navigateBack()
            },
            fail:function(res) {
              wx.hideLoading()
              console.log(res)
            }
          })
        }
      }
    })
  }
})