var Promise = require('es6-promise');
var app = getApp();

function wxPromisify(fn) {
  return function (obj = {}) {
    return new Promise((resolve, reject) => {
      obj.success = function (res) {
        //成功
        resolve(res)
      }
      obj.fail = function (res) {
        //失败
        reject(res)
      }
      fn(obj)
    })
  }
}
//无论promise对象最后状态如何都会执行
Promise.prototype.finally = function (callback) {
  let P = this.constructor;
  return this.then(
    value => P.resolve(callback()).then(() => value),
    reason => P.resolve(callback()).then(() => { throw reason })
  );
};

function login() {
  return new Promise((resolve, reject) => wx.login({ success: resolve, fail: reject }));
}

function getUserInfo() {
  return new Promise((resolve, reject) => wx.getUserInfo({ success: resolve, fail: reject }));
}

/**
 * 微信请求get方法
 * url
 * data 以对象的格式传入
 */
function getRequest(url, data) {
  var getRequest = wxPromisify(wx.request)
  return getRequest({
    url: app.globalData.url + url,
    method: 'GET',
    data: data,
    header: {
      'Content-Type': 'application/json'
    }
  })
}

/**
 * 微信请求post方法封装
 * url
 * data 以对象的格式传入
 */
function postRequest(url, data) {
  var postRequest = wxPromisify(wx.request)
  return postRequest({
    url: app.globalData.url + url,
    method: 'POST',
    data: data,
    header: {
      "content-type": "application/x-www-form-urlencoded"
    },
  })
}

//跳转到加载页面
function jumpLoading() {
  wx.redirectTo({
    url: '/pages/loading/index',
  });
}


//封装小程序冷更新
function upDateSmallProgram() {
  wx.getSystemInfo({
    success: function (res) {
      var version = res.SDKVersion.slice(0, 5);
      console.log('res.SDKVersion', res.SDKVersion)
      version = version.replace(/\./g, "");
      if (parseInt(version) >= 199) {// 大于1.9.90的版本
        const updateManager = wx.getUpdateManager()

        updateManager.onCheckForUpdate(function (res) {
          // 请求完新版本信息的回调
          console.log("9999999", res.hasUpdate)
        })

        updateManager.onUpdateReady(function () {
          wx.showModal({
            title: '更新提示',
            showCancel: false,
            content: '版本已更新，请点击确定立即使用!',
            success: function (res) {
              if (res.confirm) {
                // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
                updateManager.applyUpdate()
              }
            }
          })

        })

        updateManager.onUpdateFailed(function () {
          // 新的版本下载失败

        })
      }
    }
  })
}

module.exports = {
  login: login,
  getUserInfo: getUserInfo,
  postRequest: postRequest,
  getRequest: getRequest,
  jumpLoading: jumpLoading,
  upDateSmallProgram: upDateSmallProgram
}