//index.js
//获取应用实例
const app = getApp()
import { String } from '../../utils/util.js';
Page({
  data: {
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    homeworks: [],

    schools:[],
    schoolInfo:false,
    isSelect: 'none',

    hideModal: true, //模态框的状态  true-隐藏  false-显示
    animationData: {},//

    showFlex: true,   // 显示悬浮按钮

    loveScore: 0,

    currentPage: 1, // 当前页数
    totalPage:1, // 总页数
  },
  onLoad: function () {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse){
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
  },
  onShow: function() {
    var that = this
    wx.getStorage({
      key: 'schoolInfo',
      success: function (res) {
        that.setData({
          schoolInfo: res.data,
        })
        that.getHomeworks(1)
      },
    })
    // 在登陆状态下获取学校信息
    app.login().then(() => {
      that.getSchools()
    })
  },
  // 获取学校信息
  getSchools:function(e) {
    let that = this
    wx.request({
      url: app.globalData.host + '/api/schools',
      header: {
        'Authorization': app.globalData.token
      },
      success: function (res) {
        if(res.data.data.length > 0) {
          that.setData({
            schools: res.data.data
          })
          wx.setStorage({
            key: 'schools',
            data: res.data.data,
          })
          // 判断用户是否设置过学校 如果没有 默认选中第一个
          let firstSchool = res.data.data[0]
          try {
            const schoolInfo = wx.getStorageSync('schoolInfo')
            if (String.isBlank(schoolInfo)) {
              // 如果没有设置过学校
              wx.setStorageSync('schoolInfo', firstSchool)
              that.setData({
                schoolInfo: firstSchool
              })
            }else {
              // 如果设置过学校
              that.setData({
                schoolInfo: schoolInfo
              })
            }
            that.getHomeworks(1)
          } catch(e) {
            
          }
        } else {
          that.setData({
              schools: [that.data.schoolInfo],
          })
          wx.setStorage({
            key: 'schools',
            data: [that.data.schoolInfo],
          })
        }
        // 隐藏导航栏加载框
        wx.hideNavigationBarLoading();
        // 停止下拉动作
        wx.stopPullDownRefresh();
      },
      fail: function(res) {
        // 隐藏导航栏加载框
        wx.hideNavigationBarLoading();
        // 停止下拉动作
        wx.stopPullDownRefresh();
      }
    })
    that.getLoveScore()
  },
  // 获取作业列表
  getHomeworks:function(currentPage) {
    var currentPage = currentPage 
    let that = this
    if (String.isBlank(that.data.schoolInfo)) {
      // 隐藏加载框  
      wx.hideLoading();
      // 隐藏导航栏加载框
      wx.hideNavigationBarLoading();
      // 停止下拉动作
      wx.stopPullDownRefresh();
    }else {
      wx.request({
        url: app.globalData.host + '/api/homeworks',
        method: 'GET',
        data: {
          school: that.data.schoolInfo.school,
          grade: that.data.schoolInfo.grade,
          virtual_class: that.data.schoolInfo.virtual_class,
          page: currentPage,
          paginate: 10
        },
        success: function (res) {
          if (res.data.data.data.length > 0) {
            if(currentPage == 1) {
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
          wx.hideLoading()
          // 隐藏导航栏加载框
          wx.hideNavigationBarLoading()
          // 停止下拉动作
          wx.stopPullDownRefresh()
        },
      })
    }
  },
  // 获取爱心积分
  getLoveScore:function(e) {
    var that = this
    wx.request({
      url: app.globalData.host + '/api/love-score',
      header: {
        'Authorization': app.globalData.token
      },
      success:function(res) {
        that.setData({
          loveScore: res.data.data.score
        })
        app.globalData.times = res.data.data.times
        app.globalData.score = res.data.data.score
      }
    })
  },
  // 获取用户信息
  getUserInfo: function(e) {
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },
  // 点击卡片 查看详情 事件
  clickDetail:function(e) {
    var that = this
    that.setData({
      hideModal: true,
      showFlex: true
    })
    wx.navigateTo({
      url: '/pages/homework/homework?date=' + e.currentTarget.dataset.date,
    })
  },
  // 导航到
  navigateTo: function(e) {
    var type = e.currentTarget.dataset.type
    var that = this
    that.setData({
      hideModal: true,
      showFlex: true
    })
    wx.getStorage({
      key: 'schoolInfo',
      success: function(res) {
        that.setData({
          schoolInfo: res.data
        })
      },
    })
    switch(type) {
      case 'arrange':
        // 判断此人是否有学校
        if(that.data.schoolInfo) {
          wx.navigateTo({
            url: '/pages/arrange/arrange',
          })
          break
        }else {
          wx.navigateTo({
            url: '/pages/school/school',
          })
          break
        }
      case 'history':
        wx.navigateTo({
          url: '/pages/history/history',
        })
        break
      default :
        wx.navigateTo({
          url: '/pages/arrange/arrange',
        })
        break
    }
  },
  
  // 选择学校
  selectSchool:function(e) {
    var that = this
    that.setData({
      hideModal: true,
      showFlex: true
    })
    let schoolInfo = e.currentTarget.dataset.schoolinfo
    this.setData({
      schoolInfo:schoolInfo
    })
    wx.setStorage({
      key: 'schoolInfo',
      data: schoolInfo,
      currentPage: 1
    })
    wx.showLoading({
      'title' : '加载中...'
    })
    this.getHomeworks(1)
  },
  // 下拉刷新
  onPullDownRefresh: function () {
    wx.showNavigationBarLoading()
    var that = this
    wx.showLoading({
      'title': '加载中...'
    })
    that.setData({
      hideModal: true,
      showFlex: true,
      currentPage: 1
    })
    that.getHomeworks(1)
  },
  // 上拉加载
  onReachBottom: function() {
    var that = this;
    // 显示加载图标  
    wx.showLoading({
      'title': '加载中...'
    })
    that.data.currentPage += 1
    console.log(that.data)
    if(that.data.currentPage <= that.data.totalPage) {
      that.getHomeworks(that.data.currentPage)
    } else {
      wx.hideLoading()
      if (that.data.totalPage > 1) {
        wx.showToast({
          title: '已经是最后一页了！',
          icon: 'none'
        })
      }
    }
  },
  // 图片预览
  showImages:function(e) {
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
    if(this.data.showFlex == true) {
      this.setData({
        showFlex: false
      })
    }else [
      this.setData({
        showFlex: true
      })
    ]
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
  showOrhide:function() {
    var that = this
    if(this.data.hideModal == false) {
      that.hideModal()
    } else {
      that.showModal()
    }
  },
  // 显示遮罩层
  showModal: function () {
    var that = this;
    that.setData({
      hideModal: false,
      showFlex: false
    })
    var animation = wx.createAnimation({
      duration: 400,//动画的持续时间 默认400ms   数值越大，动画越慢   数值越小，动画越快
      timingFunction: 'ease',//动画的效果 默认值是linear
    })
    this.animation = animation
    setTimeout(function () {
      that.fadeIn();//调用显示动画
    }, 200)
  },

  // 隐藏遮罩层
  hideModal: function () {
    var that = this;
    var animation = wx.createAnimation({
      duration: 400,//动画的持续时间 默认400ms   数值越大，动画越慢   数值越小，动画越快
      timingFunction: 'ease',//动画的效果 默认值是linear
    })
    this.animation = animation
    that.fadeDown();//调用隐藏动画   
    setTimeout(function () {
      that.setData({
        hideModal: true,
        showFlex: true
      })
    }, 200)//先执行下滑动画，再隐藏模块
  },
  //动画集
  fadeIn: function () {
    this.animation.translateY(0).step()
    this.setData({
      animationData: this.animation.export()//动画实例的export方法导出动画数据传递给组件的animation属性
    })
  },
  fadeDown: function () {
    this.animation.translateY(-100).step()
    this.setData({
      animationData: this.animation.export(),
    })
  }
})
