// pages/homework/homework.js
const app = getApp()
import { String,formatTime } from '../../utils/util.js';
Page({
  data: {
    showModalStatus: false,
    allSubjects:[
      {name:'语文',value:'0',checked:true },
      {name:'数学',value:'1',checked:false},
      {name:'英语',value:'2',checked:false},
      {name:'其他',value:'3',checked:false},
    ],
    showAdView: true,           // 广告位
    holiday: '日常',
    holidays: ["日常"],
    holiday_index: 0,           // 假期下标

    school: '',                 // 学校
    grade: '请选择',             // 年级
    virtual_class: '',          // 班级
    subject: '语文',             // 学科

    grade_classes: [],          // 班级年级列表
    grade_class_index: [0, 0],  // 班级年级县标

    openType: '',               // 保存作业按钮类型
    hideModal: true,            // 模态框的状态  true-隐藏  false-显示
    animationData: {},          // 动画
    schoolInfo:{},              // 学校信息
    date:'',                   // 日期信息

    parent_id_from_history: 0,  // 来自发布记录的parent_id 标记作业组信息
    showUpload: true,           //是否显示 + 按钮

    chinese : { subject: '语文', content: '', uploaderList: [], image_ids: [], videoList: [], video_ids: [] },
    math    : { subject: '数学', content: '', uploaderList: [], image_ids: [], videoList: [], video_ids: [] },
    english : { subject: '英语', content: '', uploaderList: [], image_ids: [], videoList: [], video_ids: [] },
    other   : { subject: '其他', content: '', uploaderList: [], image_ids: [], videoList: [], video_ids: [] },
    
    isEdit:false,
    picLength: 0,               //判断图片、视频是否全部上传完成
    status: 0,
  },
  onLoad: function (options) {
    var that = this
    // 判断当前用户是否绑定了手机号
    if (app.globalData.mobile == 0) {
      that.setData({
        openType: 'getPhoneNumber'
      })
    }
    // 获取节假日列表
    wx.request({
      url: app.globalData.host + '/api/holidays',
      success: function (res) {
        that.setData({
          holidays: res.data.data,
        })
        if (options.parent_id_from_history) {
          that.setData({
            date: options.date,
            status: options.status,
            holiday: options.holiday,
            parent_id_from_history: options.parent_id_from_history
          })
          var holidays = res.data.data;
          for (var i = 0; i < holidays.length; i++) {
            if (holidays[i] == options.holiday) {
              that.setData({
                holiday_index: i,
              })
            }
          }
          that.getHomework()
        }
      }
    })
    // 获取当前日期
    that.setData({
      date: that.getDate()
    })
    // 如果用户没有学校
    if (options.school) {
      that.setData({
        school: options.school,
        isEdit: true,
      })
    }else {
      that.setData({
        schoolInfo: app.globalData.schoolInfo,
        school: app.globalData.schoolInfo.school,
        grade: app.globalData.schoolInfo.grade,
        virtual_class: app.globalData.schoolInfo.virtual_class
      })
    }
  },
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
  // 选择科目
  chooseSubject: function (e) {
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
  // 编辑学校 
  editSchool:function(e) {
    var school = e.currentTarget.dataset.school
    if(this.data.isEdit == false) {
      wx.navigateTo({
        url: '/pages/school/school?school=' + school,
      })
    } else {
      wx.navigateBack({
        school: school
      })
    }
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
  chooseHoliday: function(e) {
    var that = this
    let index = e.detail.value
    that.setData({
      holiday_index: index,
      holiday: that.data.holidays[index]
    })
  },
  // 布置作业
  arrangeHomework:function(e) {
    var that = this
    let status = e.currentTarget.dataset.status
    if (app.globalData.mobile == 0) {
      if(e.detail.errMsg) {
        if (e.detail.errMsg == 'getPhoneNumber:ok') {
          console.log('允许获取手机号')
          app.login().then(() => {
            wx.request({
              url: app.globalData.host + '/encrypted-data',
              method: "GET",
              data: {
                session_key: app.globalData.sessionKey,
                encrypted_data: e.detail.encryptedData,
                iv: e.detail.iv
              },
              success: function (e) {
                let phoneDetail = JSON.parse(e.data.data)
                let phoneNumber = phoneDetail.purePhoneNumber
                app.globalData.mobile = phoneNumber
                that.setData({
                  openType: ''
                })
                console.log(phoneDetail.purePhoneNumber)
                that.publishHomework(status, phoneNumber)
              },
              fail: function (e) {
                console.log(e)
              }
            })
          })
        } else {
          console.log('用户点击拒绝获取')
          that.publishHomework(status, 0)
        }
      }
    }else {
      that.publishHomework(status, 0)
    }
  },
  // 发布-保存作业
  publishHomework: function (status, phoneNumber) {
    var that = this
    var subjects = []
    if (String.isBlank(that.data.school)) {
      wx.showToast({
        title: '学校信息有误',
        icon: 'none'
      })
      return
    }
    if (String.isBlank(that.data.grade)) {
      wx.showToast({
        title: '请选择年级班级',
        icon: 'none'
      })
      return
    }
    if (that.data.chinese.image_ids.length > 0 || that.data.chinese.video_ids.length > 0) {
      if (String.isBlank(that.data.chinese.content)){
        wx.showToast({
          title: '请输入语文作业内容',
          icon: 'none'
        })
        return
      }
      subjects.push('语文')
    } else {
      if (that.data.chinese.content) {
        subjects.push('语文')
      }
    }
    if (that.data.math.image_ids.length > 0 || that.data.math.video_ids.length > 0) {
      if (String.isBlank(that.data.math.content)) {
        wx.showToast({
          title: '请输入数学作业内容',
          icon: 'none'
        })
        return
      }
      subjects.push('数学')
    } else {
      if (that.data.math.content) {
        subjects.push('数学')
      }
    }
    if (that.data.english.image_ids.length > 0 || that.data.english.video_ids.length > 0) {
      if (String.isBlank(that.data.english.content)) {
        wx.showToast({
          title: '请输入英语作业内容',
          icon: 'none'
        })
        return
      }
      subjects.push('英语')
    } else {
      if (that.data.english.content) {
        subjects.push('英语')
      }
    }
    if (that.data.other.image_ids.length > 0 || that.data.other.video_ids.length > 0) {
      if (String.isBlank(that.data.other.content)){
        wx.showToast({
          title: '请输入其他作业内容',
          icon: 'none'
        })
        return
      }
      subjects.push('其他')
    } else {
      if (that.data.other.content) {
        subjects.push('其他')
      }
    }
    if(subjects.length < 1) {
      wx.showToast({
        title: '请输入'+ that.data.subject +'作业内容',
        icon: 'none'
      })
      return
    }
    var content = []
    for(var index in subjects) {
      if (subjects[index] == '语文') {
        content = content.concat(that.data.chinese)
      }
      if (subjects[index] == '数学') {
        content = content.concat(that.data.math)
      }
      if (subjects[index] == '英语') {
        content = content.concat(that.data.english)
      }
      if (subjects[index] == '其他') {
        content = content.concat(that.data.other)
      }
    }
    content = JSON.stringify(content)
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
          parent_id: that.data.parent_id_from_history,
          school: that.data.school,
          grade: that.data.grade,
          virtual_class: that.data.virtual_class,
          content: content,
          mobile: phoneNumber,
          status: status,
          holiday: that.data.holiday
        },
        success: function (e) {
          if (e.data.code != 0) {
            wx.showToast({
              title: e.data.error,
              icon: 'none'
            })
          } else {
            app.globalData.schoolInfo = e.data.schoolInfo
            that.setData({
              date: e.data.date
            })
            if(status == 0) {
              wx.navigateTo({
                url: '/pages/homework/homework?date=' + e.data.date + '&holiday=' + that.data.holiday + '&arrange=1',
              })
            }else {
              if (e.data.is_award == 1) {
                setTimeout(function () {
                  that.mask("open")
                  setTimeout(function () {
                    that.mask("close")
                    wx.navigateTo({
                      url: '/pages/homework/homework?date=' + e.data.date + '&holiday=' + that.data.holiday + '&arrange=1',
                    })
                  }, 2000)
                })
              }else {
                wx.navigateTo({
                  url: '/pages/homework/homework?date=' + e.data.date + '&holiday=' + that.data.holiday + '&arrange=1',
                })
              }
            }
          }
        },
        fail: function (e) {
          console.log(e)
        }
      })
    })
  },
  getHomework: function () {
    let that = this
    let schoolInfo = app.globalData.schoolInfo
    wx.request({
      url: app.globalData.host + '/api/homework',
      method: 'GET',
      header: {
        'Authorization': app.globalData.token,
        'Accept': 'application/vnd.leerzhi.v120+json'
      },
      data: {
        date: that.data.date,
        parent_id: that.data.parent_id_from_history,
        school: schoolInfo.school,
        grade: schoolInfo.grade,
        virtual_class: schoolInfo.virtual_class
      },
      success: function (res) {
        let homeworks = res.data.data[0]
        for (var index in homeworks) {
          let homework = homeworks[index]
          if (homework.subject == '其他') {
            that.chooseSubject({ detail: {value: '3'} })
            that.setData({
              other: {
                subject: '其他',
                content: homework.content,
                uploaderList: homework.images,
                image_ids: homework.image_ids,
                videoList: homework.video_ids,
                video_ids: homework.video_ids
              }
            })
          }
          if (homework.subject == '英语') {
            that.chooseSubject({ detail: { value: '2' } })
            that.setData({
              english: {
                subject: '英语',
                content: homework.content,
                uploaderList: homework.images,
                image_ids: homework.image_ids,
                videoList: homework.video_ids,
                video_ids: homework.video_ids
              }
            })
          }
          if (homework.subject == '数学') {
            that.chooseSubject({ detail: { value: '1' } })
            that.setData({
              math: {
                subject: '数学',
                content: homework.content,
                uploaderList: homework.images,
                image_ids: homework.image_ids,
                videoList: homework.video_ids,
                video_ids: homework.video_ids
              }
            })
          }
          if (homework.subject == '语文') {
            that.chooseSubject({ detail: { value: '0' } })
            that.setData({
              chinese: {
                subject: '语文',
                content: homework.content,
                uploaderList: homework.images,
                image_ids: homework.image_ids,
                videoList: homework.video_ids,
                video_ids: homework.video_ids
              }
            })
          }
        }
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
  //上传图片
  upload: function (e) {
    var that = this
    that.setData({
      hideModal: true
    })
    wx.chooseImage({
      sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
      success: function (res) {
        let tempFilePaths = res.tempFilePaths;
        for (var i = 0; i < tempFilePaths.length; i++) {
          wx.showLoading({
            title: '正在上传...',
            mask: true
          })
          wx.uploadFile({
            url: app.globalData.host + "/api/file",
            filePath: tempFilePaths[i],
            name: 'file',
            header: {
              'content-type': 'multipart/form-data',
              'Authorization': app.globalData.token
            },
            formData: {
              file: tempFilePaths[i],
              item_type: 'homework',
              file_type: 'images'
            },
            success: function (re) {
              var file = JSON.parse(re.data)
              if (that.data.subject == '语文') {
                var image_ids = that.data.chinese.image_ids.concat(file.data.id)
                let uploaderList = that.data.chinese.uploaderList.concat(file.data.url + "?x-oss-process=image/resize,m_fixed,h_80,w_80");
                that.setData({
                  ['chinese.image_ids']: image_ids,
                  ['chinese.uploaderList']: uploaderList,
                  picLength: that.data.picLength + 1
                })
                if (that.data.picLength == tempFilePaths.length) {
                  that.setData({
                    picLength: 0
                  })
                  wx.hideLoading()
                }
              }
              if (that.data.subject == '数学') {
                var image_ids = that.data.math.image_ids.concat(file.data.id)
                let uploaderList = that.data.math.uploaderList.concat(file.data.url + "?x-oss-process=image/resize,m_fixed,h_80,w_80");
                that.setData({
                  ['math.image_ids']: image_ids,
                  ['math.uploaderList']: uploaderList,
                  picLength: that.data.picLength + 1
                })
                if (that.data.picLength == tempFilePaths.length) {
                  that.setData({
                    picLength: 0
                  })
                  wx.hideLoading()
                }
              }
              if (that.data.subject == '英语') {
                var image_ids = that.data.english.image_ids.concat(file.data.id)
                let uploaderList = that.data.english.uploaderList.concat(file.data.url + "?x-oss-process=image/resize,m_fixed,h_80,w_80");
                that.setData({
                  ['english.image_ids']: image_ids,
                  ['english.uploaderList']: uploaderList,
                  picLength: that.data.picLength + 1
                })
                if (that.data.picLength == tempFilePaths.length) {
                  that.setData({
                    picLength: 0
                  })
                  wx.hideLoading()
                }
              }
              if (that.data.subject == '其他') {
                var image_ids = that.data.other.image_ids.concat(file.data.id)
                let uploaderList = that.data.other.uploaderList.concat(file.data.url + "?x-oss-process=image/resize,m_fixed,h_80,w_80");
                that.setData({
                  ['other.image_ids']: image_ids,
                  ['other.uploaderList']: uploaderList,
                  picLength: that.data.picLength + 1
                })
                if (that.data.picLength == tempFilePaths.length) {
                  that.setData({
                    picLength: 0
                  })
                  wx.hideLoading()
                }
              }
            },
            fail: function (res) {
              wx.hideLoading()
              console.log(res)
            }
          })
        }
      }
    })
  },
  // 图片预览
  showImg: function (e) {
    var that = this;
    if (that.data.subject == '语文') {
      wx.previewImage({
        urls: that.data.chinese.uploaderList,
        current: that.data.english.uploaderList[e.currentTarget.dataset.index]
      })
    }
    if (that.data.subject == '数学') {
      wx.previewImage({
        urls: that.data.math.uploaderList,
        current: that.data.math.uploaderList[e.currentTarget.dataset.index]
      })
    }
    if (that.data.subject == '英语') {
      wx.previewImage({
        urls: that.data.english.uploaderList,
        current: that.data.english.uploaderList[e.currentTarget.dataset.index]
      })
    }
    if (that.data.subject == '其他') {
      wx.previewImage({
        urls: that.data.other.uploaderList,
        current: that.data.other.uploaderList[e.currentTarget.dataset.index]
      })
    }
  },
  // 删除图片
  clearImg: function (e) {
    var that = this
    var nowList = [];//新数据
    if (that.data.subject == '语文') {
      var uploaderList = that.data.chinese.uploaderList;//原数据
      for (let i = 0; i < uploaderList.length; i++) {
        if (i == e.currentTarget.dataset.index) {
          var image_ids = that.data.chinese.image_ids;
          image_ids.splice(i, 1)
          that.setData({
            ['chinese.image_ids']: image_ids
          })
          continue;
        } else {
          nowList.push(uploaderList[i])
        }
      }
      that.setData({
        ['chinese.uploaderList']: nowList,
      })
    }
    if (that.data.subject == '数学') {
      var uploaderList = that.data.math.uploaderList;//原数据
      for (let i = 0; i < uploaderList.length; i++) {
        if (i == e.currentTarget.dataset.index) {
          var image_ids = that.data.math.image_ids;
          image_ids.splice(i, 1)
          that.setData({
            ['math.image_ids']: image_ids
          })
          continue;
        } else {
          nowList.push(uploaderList[i])
        }
      }
      that.setData({
        ['math.uploaderList']: nowList,
      })
    }
    if (that.data.subject == '英语') {
      var uploaderList = that.data.english.uploaderList;//原数据
      for (let i = 0; i < uploaderList.length; i++) {
        if (i == e.currentTarget.dataset.index) {
          var image_ids = that.data.english.image_ids;
          image_ids.splice(i, 1)
          that.setData({
            ['english.image_ids']: image_ids
          })
          continue;
        } else {
          nowList.push(uploaderList[i])
        }
      }
      that.setData({
        ['english.uploaderList']: nowList,
      })
    }
    if (that.data.subject == '其他') {
      var uploaderList = that.data.other.uploaderList;//原数据
      for (let i = 0; i < uploaderList.length; i++) {
        if (i == e.currentTarget.dataset.index) {
          var image_ids = that.data.other.image_ids;
          image_ids.splice(i, 1)
          that.setData({
            ['other.image_ids']: image_ids
          })
          continue;
        } else {
          nowList.push(uploaderList[i])
        }
      }
      that.setData({
        ['other.uploaderList']: nowList,
      })
    }
  },
  // 上传视频
  uploadVideo: function (e) {
    var that = this
    that.setData({
      hideModal: true
    })
    wx.chooseVideo({
      sourceType: ['album'],
      maxDuration: 60,
      camera: 'back',
      success: function (res) {
        let tempFilePaths = res.tempFilePaths;
        if (that.data.subject == '语文') {
          let uploaderList = that.data.chinese.videoList.concat(tempFilePaths);
          that.setData({
            ['chinese.videoList']: uploaderList,
          })
        }
        if (that.data.subject == '数学') {
          let uploaderList = that.data.math.videoList.concat(tempFilePaths);
          that.setData({
            ['math.videoList']: uploaderList,
          })
        }
        if (that.data.subject == '英语') {
          let uploaderList = that.data.english.videoList.concat(tempFilePaths);
          that.setData({
            ['english.videoList']: uploaderList,
          })
        }
        if (that.data.subject == '其他') {
          let uploaderList = that.data.other.videoList.concat(tempFilePaths);
          that.setData({
            ['other.videoList']: uploaderList,
          })
        }
        wx.showLoading({
          title: '正在上传...',
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
            if (that.data.subject == '语文') {
              var video_ids = that.data.chinese.video_ids.concat(file.data.id)
              that.setData({
                ['chinese.video_ids']: video_ids
              })
            }
            if (that.data.subject == '数学') {
              var video_ids = that.data.math.video_ids.concat(file.data.id)
              that.setData({
                ['math.video_ids']: video_ids
              })
            }
            if (that.data.subject == '英语') {
              var video_ids = that.data.english.video_ids.concat(file.data.id)
              that.setData({
                ['english.video_ids']: video_ids
              })
            }
            if (that.data.subject == '其他') {
              var video_ids = that.data.other.video_ids.concat(file.data.id)
              that.setData({
                ['other.video_ids']: video_ids
              })
            }
          },
          fail: function (res) {
            wx.hideLoading()
            wx.showToast({
              title: '上传失败',
              icon: 'none'
            })
          }
        })
      }
    })
  },
  // 视频预览
  bindVideoScreenChange: function (e) {
    var status = e.detail.fullScreen;
    var play = {
      playVideo: false
    }
    if (status) {
      play.playVideo = true;
    }
    this.setData(play);
  },
  // 删除视频
  clearVideo: function (e) {
    var that = this
    var nowList = [];//新数据
    if (that.data.subject == '语文') {
      var uploaderList = that.data.chinese.videoList;//原数据
      for (let i = 0; i < uploaderList.length; i++) {
        if (i == e.currentTarget.dataset.index) {
          var video_ids = that.data.chinese.video_ids;
          video_ids.splice(i, 1)
          that.setData({
            ['chinese.video_ids']: video_ids
          })
          continue;
        } else {
          nowList.push(uploaderList[i])
        }
      }
      that.setData({
        ['chinese.videoList']: nowList,
      })
    }
    if (that.data.subject == '数学') {
      var uploaderList = that.data.math.videoList;//原数据
      for (let i = 0; i < uploaderList.length; i++) {
        if (i == e.currentTarget.dataset.index) {
          var video_ids = that.data.math.video_ids;
          video_ids.splice(i, 1)
          that.setData({
            ['math.video_ids']: video_ids
          })
          continue;
        } else {
          nowList.push(uploaderList[i])
        }
      }
      that.setData({
        ['math.videoList']: nowList,
      })
    }
    if (that.data.subject == '英语') {
      var uploaderList = that.data.english.videoList;//原数据
      for (let i = 0; i < uploaderList.length; i++) {
        if (i == e.currentTarget.dataset.index) {
          var video_ids = that.data.english.video_ids;
          video_ids.splice(i, 1)
          that.setData({
            ['english.video_ids']: video_ids
          })
          continue;
        } else {
          nowList.push(uploaderList[i])
        }
      }
      that.setData({
        ['english.videoList']: nowList,
      })
    }
    if (that.data.subject == '其他') {
      var uploaderList = that.data.other.videoList;//原数据
      for (let i = 0; i < uploaderList.length; i++) {
        if (i == e.currentTarget.dataset.index) {
          var video_ids = that.data.other.video_ids;
          video_ids.splice(i, 1)
          that.setData({
            ['other.video_ids']: video_ids
          })
          continue;
        } else {
          nowList.push(uploaderList[i])
        }
      }
      that.setData({
        ['other.videoList']: nowList,
      })
    }
  },
  // 获取作业内容输入框内容
  contentChange:function(e) {
    var that = this
    if(that.data.subject == '语文') {
      that.setData({
        ['chinese.content']: e.detail.value || ''
      })
    }
    if (that.data.subject == '数学') {
      that.setData({
        ['math.content']: e.detail.value || ''
      })
    }
    if (that.data.subject == '英语') {
      that.setData({
        ['english.content']: e.detail.value || ''
      })
    }
    if (that.data.subject == '其他') {
      that.setData({
        ['other.content']: e.detail.value || ''
      })
    }
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
  // 获取当前日期
  getDate: function () {
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth() + 1;
    var day = now.getDate();
    if (month < 10) {
      month = '0' + month;
    };
    if (day < 10) {
      day = '0' + day;
    };
    //  如果需要时分秒，就放开
    // var h = now.getHours();
    // var m = now.getMinutes();
    // var s = now.getSeconds();
    var formatDate = year + '-' + month + '-' + day;
    return formatDate;
  },
})