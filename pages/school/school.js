// pages/school/school.js
//获取应用实例
const app = getApp()

Page({
  /**
   * 页面的初始数据
   */
  data: {
    school: '',
    placeholder: '输入学校全称'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if(options.school) {
      this.setData({
        school: options.school
      })
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  nextStep:function(e) {
    var that = this
    let school = that.data.school
    if(school) {
      wx.navigateTo({
        url: '/pages/arrange/arrange?school=' + school,
      })
    } else [
      wx.showToast({
        title: '请输入学校全称',
        icon: 'none'
      })
    ]
  },
  schoolChange: function(e) {
    this.setData({
      school: e.detail.detail.value || ''
    })
  }
})
