const app = getApp()
Page({
  data: {
    showModalStatus: false,
    homeworks: [],
    schoolInfo:{},
    date:'',
    parent_id_from_history: 0,  // 0： 首页进入-显示当天全部  1++: 发布记录进入-显示单个
    homework:{},
    subjects: '', // 已发布的学科
    homeworkStatus: 0,
    images:[],
    status: 1,    // 作业状态 默认已发布
    arrange: 0,    // 判断是否来自发布页面：是：返回的时候直接到首页 否：返回上一页
    showAdView: true,       // 广告位
  },
  onLoad: function (options) {
    var that = this
    that.setData({
      date: options.date,
      holiday: options.holiday
    })
    // 从发布记录进来的 
    if (options.parent_id_from_history > 0) {
      that.setData({
        status: options.status,
        parent_id_from_history: options.parent_id_from_history
      })
    }
    // 是否从发布页面过来
    if (options.arrange) {
      that.setData({
        arrange: options.arrange
      })
    }
    // 从分享卡片进来
    if (options.card) {
      app.login().then(() => {
        let schoolInfo = {
          school: options.school,
          grade: options.grade,
          virtual_class: options.virtual_class
        }
        that.bindSchool(schoolInfo)
      })
    }
    wx.showShareMenu({
      withShareTicket: true
    })
    that.setData({
      schoolInfo: app.globalData.schoolInfo
    })
  },
  onShow: function() {
    var that = this
    wx.showLoading({
      'title': '加载中...'
    })
    that.getHomework()
  },
  onUnload: function() {
    if(this.data.arrange == 1) {
      wx.reLaunch({
        url: '/pages/index/index',
      })
    }
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
  // 绑定学校
  bindSchool:function(schoolInfo){
    wx.request({
      url: app.globalData.host + '/api/bind-school',
      method: "POST",
      data: {
        school: schoolInfo.school,
        grade: schoolInfo.grade,
        virtual_class: schoolInfo.virtual_class
      },
      header: {
        'Authorization': app.globalData.token
      },
      success: function (res) {
        app.globalData.schoolInfo = res.data.data
      }
    })
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function (options) {
    var that = this
    let schoolInfo = app.globalData.schoolInfo
    let images = [
      '0.jpg',
      '1.jpg',
      '2.jpg',
      '3.jpg',
      '4.jpg'
    ]
    that.setData({
      subjects : ''
    })
    // 获取 0 ~ 4 之间的随机整数
    let index = Math.ceil(Math.random() * 5) - 1 ;
    var week = ''
    for(var tempIndex in that.data.homeworks[0]) {
      let home = that.data.homeworks[0][tempIndex]
      var ext = ''
      if (tempIndex < that.data.homeworks[0].length-1) {
        var ext = '、'
      }
      var week = home.week
      that.setData({
        subjects: that.data.subjects + home.subject + ext
      })
    }
    if (that.data.holiday != '周间日常' && that.data.holiday != '日常') {
      week = that.data.holiday
    }
    let title = schoolInfo.school + schoolInfo.grade + schoolInfo.virtual_class + week + that.data.subjects + "作业来了"
    console.log(title)

    return {
      title: title,
      path: '/pages/homework/homework?card=1&date=' + that.data.date + '&holiday=' + that.data.holiday + '&school=' + schoolInfo.school + '&grade=' + schoolInfo.grade + '&virtual_class=' + schoolInfo.virtual_class,
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
  // 获取作业详情
  getHomework: function() {
    let that = this
    let schoolInfo = app.globalData.schoolInfo
    let header = {
      'Accept': 'application/vnd.leerzhi.v120+json'
    }
    if(that.data.parent_id_from_history > 0) {
      let header = {
        'Authorization' : app.globalData.token,
        'Accept': 'application/vnd.leerzhi.v120+json'
      }
    } 
    wx.request({
      url: app.globalData.host + '/api/homework',
      method: 'GET',
      header: header,
      data: {
        date: that.data.date,
        parent_id: that.data.parent_id_from_history,
        school: schoolInfo.school,
        grade: schoolInfo.grade,
        virtual_class: schoolInfo.virtual_class,
        status: that.data.status
      },
      success: function (res) {
        that.setData({
          homeworks: res.data.data
        })
        that.setData({
          images: res.data.images
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
  // 图片预览
  showImages: function (e) {
    var that = this
    let date = e.currentTarget.dataset.date
    wx.previewImage({
      urls: that.data.images[date],
      current: that.data.images[date][e.currentTarget.dataset.index]
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
  publishHomework:function(e) {
    var that = this
    let schoolInfo = app.globalData.schoolInfo
    app.login().then(() => {
      wx.request({
        url: app.globalData.host + '/api/homework',
        method: "POST",
        header: {
          'content-type': 'application/x-www-form-urlencoded',
          'Authorization': app.globalData.token,
          'Accept': 'application/vnd.leerzhi.v120+json'
        },
        data: {
          parent_id: that.data.homeworks[0][0].parent_id,
          school: schoolInfo.school,
          grade: schoolInfo.grade,
          virtual_class: schoolInfo.virtual_class,
          holiday: that.data.homeworks[0][0].tag,
          status: 1
        },
        success: function (e) {
          if (e.data.code != 0) {
            wx.showToast({
              title: e.data.error,
              icon: 'none'
            })
          } else {
            that.setData({
              status: 1
            })
            if (e.data.is_award == 1) {
              setTimeout(function () {
                that.mask("open")
                setTimeout(function () {
                  that.mask("close")
                  wx.showToast({
                    title: e.data.message,
                    icon:'none'
                  })
                }, 2000)
              })
            }else {
              wx.showToast({
                title: e.data.message,
                icon: 'none'
              })
            }
            that.getHomework()
          }
        },
        fail: function (e) {
          console.log(e)
        }
      })
    })
  },
  // 编辑作业
  editHomework:function(e) {
    var that = this
    wx.navigateTo({
      url: '/pages/arrange/arrange?parent_id_from_history=' + that.data.homeworks[0][0].parent_id + '&date=' + that.data.homeworks[0][0].date + '&status=' + that.data.homeworks[0][0].status + '&holiday=' + that.data.homeworks[0][0].tag,
    })
  },
  // 删除作业
  deleteHomework:function(e) {
    var that = this
    wx.showModal({
      title: '提示',
      content: '您确定删除吗？删除后不可恢复！',
      success: function (res) {
        if (res.confirm) {
          wx.showLoading({
            'title': '加载中...'
          })
          wx.request({
            url: app.globalData.host + '/api/homework',
            method:"DELETE",
            header: {
              'Authorization' : app.globalData.token,
              'Accept': 'application/vnd.leerzhi.v120+json'
            },
            data: {
              parent_id: that.data.parent_id_from_history
            },
            success:function(res) {
              wx.hideLoading()
              wx.navigateBack()
            },
            fail:function(res) {
              wx.hideLoading()
            }
          })
        }
      }
    })
  },
  backToHome: function (e) {
    wx.reLaunch({
      url: '/pages/index/index',
    })
  },
  mask: function (currentStatu) {
    /* 动画部分 */
    // 第1步：创建动画实例 
    var animation = wx.createAnimation({
      duration: 200,  //动画时长
      timingFunction: "linear", //线性
      delay: 0  //0则不延迟
    });
    // 第2步：这个动画实例赋给当前的动画实例
    this.animation = animation;
    // 第3步：执行第一组动画
    animation.opacity(0).rotateX(-100).step();
    // 第4步：导出动画对象赋给数据对象储存
    this.setData({
      animationData: animation.export()
    })
    // 第5步：设置定时器到指定时候后，执行第二组动画
    setTimeout(function () {
      // 执行第二组动画
      animation.opacity(1).rotateX(0).step();
      // 给数据对象储存的第一组动画，更替为执行完第二组动画的动画对象
      this.setData({
        animationData: animation
      })
      //关闭
      if (currentStatu == "close") {
        this.setData(
          {
            showModalStatus: false
          }
        );
      }
    }.bind(this), 200)
    // 显示
    if (currentStatu == "open") {
      this.setData(
        {
          showModalStatus: true
        }
      );
    }
  },
})