// app.js - 小程序入口文件
App({
  onLaunch() {
    // 小程序启动时执行
    console.log('设备维保管理系统启动');
    
    // 检查更新
    this.checkUpdate();
  },

  onShow() {
    // 小程序显示时执行
  },

  onHide() {
    // 小程序隐藏时执行
  },

  // 检查小程序更新
  checkUpdate() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager();
      
      updateManager.onCheckForUpdate((res) => {
        if (res.hasUpdate) {
          console.log('检测到新版本');
        }
      });

      updateManager.onUpdateReady(() => {
        wx.showModal({
          title: '更新提示',
          content: '新版本已经准备好，是否重启应用？',
          success: (res) => {
            if (res.confirm) {
              updateManager.applyUpdate();
            }
          }
        });
      });

      updateManager.onUpdateFailed(() => {
        wx.showToast({
          title: '更新失败，请稍后重试',
          icon: 'none'
        });
      });
    }
  },

  globalData: {
    userInfo: null,
    version: '1.0.0'
  }
});
