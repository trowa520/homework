// pages/homework/homework.js
const app = getApp()
import { String,formatTime } from '../../utils/util.js';

Page({

  /**
   * 页面的初始数据
   */
  data: {
    allSubjects: [
      { name: '语文', value: '0', checked: false },
      { name: '数学', value: '1', checked: false },
      { name: '英语', value: '2', checked: false },
      { name: '全学科', value: '3', checked: false },
    ],

    hideModal: true, //模态框的状态  true-隐藏  false-显示
    animationData: {},//

    grade_classes: [],
    grade_class_index: [0, 0],
    schoolInfo:{},

    date: '',

    grade: '点击选择',
    virtual_class: '',

    uploaderList: [],   // 上传图片列表
    videoList: [],     // 上传视频列表

    uploaderNum: 0,   // 限制上传图片视频的数量
    showUpload: true,  //是否显示 + 按钮

    subject:'',
    content:'',
    school:'',
    isEdit:false,
    image_ids:[], // 上传的图片id
    video_ids:[],  // 上传的视频id

    is_share: false,

    times:0,
    score:0
  },
  //上传图片
  upload: function (e) {
    var that = this
    that.setData({
      hideModal: true
    })
    if (that.data.uploaderList.length >= 3) {
      wx.showToast({
        title: '图片最多只能上传3张！',
        icon:'none'
      })
      return
    }
    wx.chooseImage({
      count: 1, // 默认6
      sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
      sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
      success: function (res) {
        console.log('选取图片成功')
        wx.showLoading({
          title: '正在上传图片，请稍后...',
          mask:true
        })
        wx.uploadFile({
          url: app.globalData.host + "/api/file",
          filePath: res.tempFilePaths[0],
          name: 'file',
          header: {
            'content-type': 'multipart/form-data',
            'Authorization': app.globalData.token
          },
          formData: {
            file: res.tempFilePaths[0],
            item_type: 'homework',
            file_type: 'images'
          },
          success: function (res) {
            wx.hideLoading()
            var file = JSON.parse(res.data)
            var image_ids = that.data.image_ids.concat(file.data.id)
            that.setData({
              image_ids: image_ids
            })
          },
          fail: function (res) {
            wx.hideLoading()
            console.log(res)
          }
        })
        // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
        let tempFilePaths = res.tempFilePaths;
        let uploaderList = that.data.uploaderList.concat(tempFilePaths);
        that.setData({
          uploaderList: uploaderList,
          uploaderNum: that.data.uploaderNum + 1,
        })
        if (that.data.uploaderNum == 6) {
          that.setData({
            showUpload: false
          })
        }
      }
    })
  },
  //展示图片
  showImg: function (e) {
    var that = this;
    wx.previewImage({
      urls: that.data.uploaderList,
      current: that.data.uploaderList[e.currentTarget.dataset.index]
    })
  },
  // 删除图片
  clearImg: function (e) {
    var that = this
    wx.showModal({
      title: '提示',
      content: '您确认删除嘛？删除后不可恢复！',
      success: function (res) {
        if (res.confirm) {
          var nowList = [];//新数据
          var uploaderList = that.data.uploaderList;//原数据
          for (let i = 0; i < uploaderList.length; i++) {
            if (i == e.currentTarget.dataset.index) {
              var image_ids = that.data.image_ids;
              console.log(image_ids)
              image_ids.splice(i,1)
              that.setData({
                image_ids: image_ids
              })
              continue;
            } else {
              nowList.push(uploaderList[i])
            }
          }
          that.setData({
            uploaderNum: that.data.uploaderNum - 1,
            uploaderList: nowList,
            showUpload: true
          })
        }
      }
    })
  },
  // 上传视频
  uploadVideo: function(e) {
    var that = this
    that.setData({
      hideModal: true
    })
    if (that.data.videoList.length >= 3) {
      wx.showToast({
        title: '视频最多只能上传3个！',
        icon: 'none'
      })
      return
    }
    wx.chooseVideo({
      sourceType: ['album'],
      maxDuration: 60,
      camera: 'back',
      success: function (res) {
        let videoArr = that.data.videoList || [];
        let videoInfo = {};
        let uploadNum = that.data.uploaderNum
        videoInfo['tempFilePath'] = res.tempFilePath;
        videoInfo['size'] = res.size;
        videoInfo['height'] = res.height;
        videoInfo['width'] = res.width;
        videoInfo['thumbTempFilePath'] = res.thumbTempFilePath;
        videoInfo['progress'] = 0;
        videoArr.push(videoInfo)
        // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
        let tempFilePaths = res.tempFilePaths;
        let uploaderList = that.data.videoList.concat(tempFilePaths);
        console.log('选取视频成功')
        wx.showLoading({
          title: '正在上传视频，请稍后...',
          mask: true
        })
        wx.uploadFile({
          url: app.globalData.host + "/api/file",
          filePath: res.tempFilePath,
          name: 'file',
          header: {
            'content-type': 'multipart/form-data',
            'Authorization': app.globalData.token
          },
          formData: {
            file: res.tempFilePath,
            item_type: 'homework',
            file_type: 'mp4'
          },
          success: function (res) {
            wx.hideLoading()
            var file = JSON.parse(res.data)
            var video_ids = that.data.video_ids.concat(file.data.id)
            that.setData({
              video_ids: video_ids
            })
            
          },
          fail: function (res) {
            let result = JSON.parse(res.data)
            
          }
        })
        uploadNum = uploadNum + 1
        that.setData({
          videoList: videoArr,
          uploaderNum: uploadNum,
        })
        that.data.videoList = videoArr
        if (that.data.uploaderNum == 6) {
          that.setData({
            showUpload: false
          })
        }
      }
    })
  },
  // 放大视频播放
  bindVideoScreenChange: function (e) {
    var status = e.detail.fullScreen;
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
  // 删除视频
  clearVideo: function (e) {
    var that = this
    wx.showModal({
      title: '提示',
      content: '您确认删除嘛？删除后不可恢复！',
      success: function (res) {
        if (res.confirm) {
          var nowList = [];//新数据
          var uploaderList = that.data.videoList;//原数据
          for (let i = 0; i < uploaderList.length; i++) {
            if (i == e.currentTarget.dataset.index) {
              var video_ids = that.data.video_ids;
              video_ids.splice(i, 1)
              that.setData({
                video_ids: video_ids
              })
              continue;
            } else {
              nowList.push(uploaderList[i])
            }
          }
          that.setData({
            uploaderNum: that.data.uploaderNum - 1,
            videoList: nowList,
            showUpload: true
          })
        }
      }
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this
    that.setData({
      date: that.getDate()
    })
    if(options.school) {
      this.setData({
        school: options.school,
        isEdit: true
      })
    }else {
      wx.getStorage({
        key: 'schoolInfo',
        success: function(res) {
          that.setData({
            schoolInfo: res.data,
            school: res.data.school,
            grade: res.data.grade,
            virtual_class: res.data.virtual_class
          })
        },
      })
    }
    that.setData({
      times: app.globalData.times,
      score: app.globalData.score
    })
    wx.showShareMenu({
      withShareTicket: true
    })
  },
  getDate: function() {
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth() + 1;
    var day = now.getDate();
    if(month < 10) {
      month = '0' + month;
    };
    if(day < 10) {
      day = '0' + day;
    };
    //  如果需要时分秒，就放开
    // var h = now.getHours();
    // var m = now.getMinutes();
    // var s = now.getSeconds();
    var formatDate = year + '-' + month + '-' + day;
    return formatDate;
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
    var that = this
    var grades = []
    var classes = []
    wx.request({
      url: app.globalData.host + '/api/grades',
      success: (grades) => {
        wx.request({
          url: app.globalData.host + '/api/classes',
          success: (classes) => {
            that.setData({
              grade_classes: [grades.data.data.grades, classes.data.data]
            })
          }
        })
      }
    })
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    var that = this
    let schoolInfo = that.data.schoolInfo
    return {
      title: '客官，您的作业来了！',
      path: '/pages/homework/homework?date=' + this.data.date + '&id=' + schoolInfo.id + '&school_id=' + schoolInfo.school_id + '&school=' + schoolInfo.school + '&grade_id=' + schoolInfo.grade_id + '&grade=' + schoolInfo.grade + '&class_id=' + schoolInfo.class_id + '&virtual_class=' + schoolInfo.virtual_class,
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
              url:  app.globalData.host + '/encrypted-data',
              data: {
                session_key: app.globalData.sessionKey,
                encrypted_data: res.encryptedData,
                iv: res.iv,
                program: 'homework'
              },
              success:function(res) {
                console.log(res)
              }
            })
            wx.reLaunch({
              url: '/pages/index/index',
            })
          }
        })
      },
      fail: function (res) {
        // 转发失败
      }
    }
  },
  // 选择科目
  serviceValChange: function (e) {
    var allSubjects = this.data.allSubjects;
    var checkArr = e.detail.value;
    for (var i = 0; i < allSubjects.length; i++) {
      if (checkArr.indexOf(i + "") != -1) {
        allSubjects[i].checked = true;
      } else {
        allSubjects[i].checked = false;
      }
    }
    let subject = allSubjects[e.detail.value].name
    this.setData({
      allSubjects: allSubjects,
      subject: subject
    })
    this.subject = subject
  },
  // 编辑学校 
  editSchool:(e)=>{
    var school = e.currentTarget.dataset.school
    wx.navigateBack({
      school: school
    })
  },
  // 选择年级和学校
  chooseGradeAndClass: function (e) {
    let grade_classes = this.data.grade_classes
    let index = e.detail.value
    let grade = grade_classes[0][index[0]].name 
    let virtual_class = grade_classes[1][index[1]].name
    this.setData({
      grade_class_index: index,
      grade: grade,
      virtual_class: virtual_class
    })
    this.grade = grade
    this.data.virtual_class = virtual_class
  },
  // 布置作业
  arrangeHomework:function(e) {
    var that = this
    if (String.isBlank(that.data.school)) {
      wx.showToast({
        title: '学校信息有误',
        icon: 'none'
      })
      return
    }
    if(String.isBlank(that.data.subject)) {
      wx.showToast({
        title: '请选择学科',
        icon:'none'
      })
      return
    }
    if (String.isBlank(that.data.grade)) {
      wx.showToast({
        title: '请选择年级',
        icon: 'none'
      })
      return
    }
    if (String.isBlank(that.data.virtual_class)) {
      wx.showToast({
        title: '请选择班级',
        icon: 'none'
      })
      return
    }
    if (String.isBlank(that.data.content)) {
      wx.showToast({
        title: '请输入作业内容',
        icon: 'none'
      })
      return
    }
    let image_ids = JSON.stringify(that.data.image_ids)
    let video_ids = JSON.stringify(that.data.video_ids)
    // 
    console.log('视频图片id')
    console.log(image_ids)
    console.log(video_ids)
    // return
    // 布置作业接口
    app.login().then(() => {
      wx.request({
        url: app.globalData.host + '/api/homework',
        method: "POST",
        header: {
          'content-type': 'application/x-www-form-urlencoded',
          'Authorization': app.globalData.token
        },
        data: {
          school: that.data.school,
          grade: that.data.grade,
          virtual_class: that.data.virtual_class,
          subject: that.data.subject,
          content: that.data.content,
          image_ids:image_ids,
          video_ids:video_ids
        },
        success: function(e) {
          console.log(e)
          if(e.data.code != 0) {
            wx.showToast({
              title: e.data.error,
              icon:'none'
            })
          } else {
            wx.showToast({
              title: '发布成功！',
              icon: 'none'
            })
            wx.setStorage({
              key: 'schoolInfo',
              data: e.data.schoolInfo,
            })
            that.setData({
              is_share: true,
              date: e.data.data.date
            })
          }

        },
        fail: function(e) {
          console.log(e)
        }
      })
    })
  },
  contentChange:function(e) {
    this.setData({
      content: e.detail.value || ''
    })
  },
  // 显示遮罩层
  showModal: function () {
    var that = this;
    that.setData({
      hideModal: false
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
        hideModal: true
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
    this.animation.translateY(300).step()
    this.setData({
      animationData: this.animation.export(),
    })
  },
})