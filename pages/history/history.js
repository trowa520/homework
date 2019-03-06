//index.js
//获取应用实例
const app = getApp()
import { String } from '../../utils/util.js';

Page({
  data: {
    homeworks: [],
    schools: [],
    schoolInfo: {},

    currentPage: 1, // 当前页数
    totalPage: 1, // 总页数

    currentTab: 0, //预设当前项的值
    scrollLeft: 0, //tab标题的滚动条位置
    images:[]
  },
  // 滚动切换标签样式
  switchTab: function (e) {
    var that = this
    that.setData({
      currentTab: e.detail.current
    });
    that.scrollTabs();
    var schools = that.data.schools
    schools.forEach((item, index) => {
      if (e.detail.current == index) {
        that.setData({
          schoolInfo: item,
          currentPage: 1
        })
        app.globalData.schoolInfo = item
        wx.showLoading({
          'title': '加载中...'
        })
        that.getHomeworks(1)
      }
    })
  },
  // 点击标题切换当前页时改变样式
  swichNav: function (e) {
    var currentTab = e.currentTarget.dataset.current;
    let schoolInfo = e.currentTarget.dataset.schoolinfo
    this.setData({
      currentTab: currentTab,
      schoolInfo: schoolInfo,
      currentPage: 1
    })
    app.globalData.schoolInfo = schoolInfo
    wx.showLoading({
      'title': '加载中...'
    })
    this.scrollTabs();
    this.getHomeworks(1)
  },
  //判断当前滚动超过一屏时，设置tab标题滚动条。
  scrollTabs: function () {
    if (this.data.currentTab > 2) {
      this.setData({
        scrollLeft: 300
      })
    } else {
      this.setData({
        scrollLeft: 0
      })
    }
  },
  onShow: function () {
    var that = this
    that.setData({
      schoolInfo: app.globalData.schoolInfo,
      currentPage: 1
    })
    that.getHomeworks(1)
    wx.getStorage({
      key: 'schools',
      success: function(res) {
        var currentSchools = []
        that.setData({
          schools: res.data
        })
        res.data.forEach((item, index) => {
          if (item.id == that.data.schoolInfo.id) {
            that.setData({
              currentTab: index
            })
            let offsetX = 60 * index 
            that.setData({
              scrollLeft: offsetX
            })
          }
        })
      },
    })
  },
  // 获取作业列表
  getHomeworks: function (currentPage) {
    let that = this
    var currentPage = currentPage
    if (app.globalData.schoolInfo.school == '') {
      // 隐藏加载框  
      wx.hideLoading();
      // 隐藏导航栏加载框
      wx.hideNavigationBarLoading();
      // 停止下拉动作
      wx.stopPullDownRefresh();
    } else {
      wx.request({
        url: app.globalData.host + '/api/homework-records',
        method: 'GET',
        data: {
          school: that.data.schoolInfo.school,
          grade: that.data.schoolInfo.grade,
          virtual_class: that.data.schoolInfo.virtual_class,
          page: currentPage
        },
        header: {
          'Authorization' : app.globalData.token,
          'Accept': 'application/vnd.leerzhi.v120+json'
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
  // 上拉加载
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
      wx.hideLoading()
      if(that.data.totalPage > 1) {
        wx.showToast({
          title: '已经是最后一页了！',
          icon: 'none'
        })
      }
    }
  },
  // 点击卡片 查看详情 事件
  clickDetail: function (e) {
    var that = this
    var obj = e.currentTarget.dataset
    that.setData({
      hideModal: true,
      showFlex: true
    })
    wx.navigateTo({
      url: '/pages/homework/homework?date=' + obj.date + '&parent_id_from_history=' + obj.parent_id + '&holiday=' + obj.holiday + '&status=' + obj.status,
    })
  },
  // 改变学校
  changeSchool:function(e) {
    let schoolInfo = e.currentTarget.dataset.schoolinfo
    this.setData({
      schoolInfo: schoolInfo,
      currentPage: 1
    })
    app.globalData.schoolInfo = schoolInfo
    wx.showLoading({
      'title': '加载中...'
    })
    this.getHomeworks(1)
  },
  // 图片预览
  showImages: function (e) {
    var that = this
    console.log('展示图片')
    let parent_id = e.currentTarget.dataset.parent_id
    wx.previewImage({
      urls: that.data.images[parent_id],
      current: that.data.images[parent_id][e.currentTarget.dataset.index]
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
})
