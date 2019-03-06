//index.js
//获取应用实例
const app = getApp()
import { String } from '../../utils/util.js';
Page({
  data: {
    showModalStatus: false, // 签到积分奖励
    showCoachMarks: false,  // 新手引导页
    showAdView: true,       // 广告位
    showFlex: true,         // 显示悬浮按钮

    homeworks: [],
    schools:[],
    images: [],
    schoolInfo:false,
    isSelect: 'none',
    loveScore: 0,

    hideModal: true,        //模态框的状态  true-隐藏  false-显示
    animationData: {},   

    currentPage: 1,         // 当前页数
    totalPage:1,            // 总页数
  },
  onLoad: function() {
    var that = this
    that.setData({
      schoolInfo: app.globalData.schoolInfo,
    })
    wx.getStorage({
      key: 'showGuide',
      success: function(res) {
        // 如果是当前版本
        if (res.data == app.globalData.version) {
          console.log('不展示引导页')
        }else {
          that.setData({
            showCoachMarks: true,
            showOne: true
          })
        }
      },
      fail:function(res) {
        that.setData({
          showCoachMarks: true,
          showOne: true
        })
      }
    })
  },
  onShow: function() {
    var that = this
    console.log(app.globalData)
    that.getHomeworks(1)
    // 在登陆状态下获取学校信息
    app.login().then(() => {
      that.getSchools()
    })
  },
  // 获取学校信息
  getSchools:function(e) {
    let that = this
    that.dailyBonus()
    wx.request({
      url: app.globalData.host + '/api/schools',
      header: {
        'Authorization': app.globalData.token
      },
      success: function (res) {
        that.setData({
          schools: res.data.data
        })
        wx.setStorage({
          key: 'schools',
          data: res.data.data,
        })
        // 判断用户是否设置过学校 如果没有 默认选中第一个
        if (app.globalData.schoolInfo.school == '') {
          // 如果没有设置过学校
          app.globalData.schoolInfo = res.data.data[0]
          that.setData({
            schoolInfo: res.data.data[0]
          })
        }else {
          // 如果设置过学校
          that.setData({
            schoolInfo: app.globalData.schoolInfo
          })
        }
        that.getHomeworks(1)
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
    if (app.globalData.schoolInfo.school == '') {
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
          }
          that.setData({
            images: res.data.images
          })
          // 隐藏加载框  
          wx.hideLoading();
          // 隐藏导航栏加载框
          wx.hideNavigationBarLoading();
          // 停止下拉动作
          wx.stopPullDownRefresh();
        },
        fail: function (res) {
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
  // 每日签到
  dailyBonus:function(e) {
    var that = this
    wx.request({
      url: app.globalData.host + '/api/daily-bonus',
      header: {
        'Authorization': app.globalData.token
      },
      success: function (res) {
        if(res.data.code == 0) {
          if (res.data.is_award == 1) {
            setTimeout(function () {
              that.mask("open")
              setTimeout(function () {
                that.mask("close")
              }, 2000)
            })
          }
        }
      }
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
      url: '/pages/homework/homework?date=' + e.currentTarget.dataset.date + '&holiday=' + e.currentTarget.dataset.holiday,
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
    switch(type) {
      case 'arrange':
        // 判断此人是否有学校
        if(app.globalData.schoolInfo.school == '') {
          wx.navigateTo({
            url: '/pages/school/school',
          })
          break
        }else {
          wx.navigateTo({
            url: '/pages/arrange/arrange',
          })
          break
        }
      case 'history':
        wx.navigateTo({
          url: '/pages/history/history',
        })
        break
      case 'score':
        wx.navigateTo({
          url: '/pages/score/score',
        })
        break
      case 'share':
        wx.navigateTo({
          url: '/pages/share/share',
        })
        break
      default :
        wx.navigateTo({
          url: '/pages/arrange/arrange',
        })
        break
    }
  },
  navigateToShare: function() {
    wx.navigateTo({
      url: '/pages/share/share',
    })
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
      schoolInfo:schoolInfo,
      currentPage: 1
    })
    app.globalData.schoolInfo = schoolInfo
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
    this.animation.translateY(-400).step()
    this.setData({
      animationData: this.animation.export(),
    })
  },

  // 奖励积分弹窗动画
  // powerDrawer: function (e) {
  //   var that = this
  //   if (that.data.showModalStatus) {
  //     that.mask('close')
  //   } else {
  //     that.mask('open')
  //   }
  // },
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
  closeAd: function(){
    console.log('关闭广告')
    this.setData({
      showAdView: false
    })
  },
  showTwo: function() {
    console.log('展示2')
    this.setData({
      showOne: false,
      showTwo: true
    })
  },
  showThree: function () {
    console.log('展示3')
    this.setData({
      showTwo: false,
      showThree: true
    })
  },
  showFour: function () {
    console.log('展示4')
    this.setData({
      showThree: false,
      showFour: true
    })
  },
  allClose: function () {
    console.log('展示0')
    this.setData({
      showFour: false,
      showCoachMarks:false
    })
    wx.setStorage({
      key: 'showGuide',
      data: app.globalData.version, //版本1.2.0
    })
  },
  onShareAppMessage: function () {
    let title = '首页'
    return {
      title: title,
      imageUrl: '../../images/1.jpg',
      success: function (res) {
        console.log(res)
      }
    }
  }
})
