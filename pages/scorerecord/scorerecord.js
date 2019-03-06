// pages/scorerecord/scorerecord.js
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    balance: 0,
    records: [],
    currentPage: 1, // 当前页数
    totalPage: 1, // 总页数
  },
  // 下拉刷新
  onPullDownRefresh: function () {
    wx.showNavigationBarLoading()
    var that = this
    that.setData({
      currentPage: 1
    })
    wx.showLoading({
      'title': '加载中...'
    })
    that.getScoreRecords(1)
  },
  // 上拉加载
  onReachBottom: function () {
    var that = this;
    // 显示加载图标  
    wx.showLoading({
      'title': '加载中...'
    })
    that.setData({
      currentPage: that.data.currentPage + 1
    })
    if (that.data.currentPage <= that.data.totalPage) {
      that.getScoreRecords(that.data.currentPage)
    } else {
      // 隐藏加载框  
      wx.hideLoading();
      // 隐藏导航栏加载框
      wx.hideNavigationBarLoading();
      // 停止下拉动作
      wx.stopPullDownRefresh();
      if (that.data.totalPage > 1) {
        wx.showToast({
          title: '已经是最后一页了！',
          icon: 'none'
        })
      }
    }
  },
  onShow: function () {
    var that = this
    that.setData({
      balance: app.globalData.score
    })
    app.login().then(() => {
      that.getScoreRecords(1)
    })
  },
  getScoreRecords:function(currentPage) {
    var that = this
    wx.request({
      url: app.globalData.host + '/api/love-score/records',
      data: {
        page: currentPage,
        paginate: 15
      },
      header: {
        'Authorization': app.globalData.token
      },
      success: function (res) {
        if (currentPage == 1) {
          that.setData({
            records: res.data.data.data,
            totalPage: res.data.data.last_page
          })
        } else {
          let newRecords = that.data.records.concat(res.data.data.data)
          that.setData({
            records: newRecords,
            totalPage: res.data.data.last_page
          })
        }
        // 隐藏加载框  
        wx.hideLoading();
        // 隐藏导航栏加载框
        wx.hideNavigationBarLoading();
        // 停止下拉动作
        wx.stopPullDownRefresh();
      },
      fail:function(e) {
        // 隐藏加载框  
        wx.hideLoading();
        // 隐藏导航栏加载框
        wx.hideNavigationBarLoading();
        // 停止下拉动作
        wx.stopPullDownRefresh();
      }
    })
  }
})