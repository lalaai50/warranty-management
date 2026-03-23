// pages/upload/upload.js
const api = require('../../utils/api');

Page({
  data: {
    uploading: false,
    uploadResult: null,
    uploadedFiles: [],
    deleteConfirmUrl: null
  },

  onLoad: function() {
    this.loadUploadedFiles();
  },

  onShow: function() {
    this.loadUploadedFiles();
  },

  onPullDownRefresh: function() {
    this.loadUploadedFiles().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  loadUploadedFiles: function() {
    return api.getUploadedFiles().then(res => {
      if (res.success) {
        this.setData({ uploadedFiles: res.files || [] });
      }
    }).catch(err => {
      console.error('加载文件列表失败', err);
    });
  },

  chooseFile: function() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['xlsx', 'xls'],
      success: (res) => {
        const file = res.tempFiles[0];
        this.uploadFile(file.path, file.name);
      },
      fail: (err) => {
        console.log('选择文件失败', err);
      }
    });
  },

  uploadFile: function(filePath, fileName) {
    this.setData({ 
      uploading: true, 
      uploadResult: null 
    });

    wx.showLoading({ title: '上传中...' });

    api.uploadFile(filePath).then(res => {
      wx.hideLoading();
      this.setData({ 
        uploading: false,
        uploadResult: {
          success: true,
          total: res.data.totalRecords,
          inserted: res.data.insertedRecords,
          message: `成功上传并解析 ${res.data.insertedRecords} 条记录`
        }
      });
      this.loadUploadedFiles();
    }).catch(err => {
      wx.hideLoading();
      this.setData({ 
        uploading: false,
        uploadResult: {
          success: false,
          message: err.error || '上传失败，请重试'
        }
      });
    });
  },

  showDeleteConfirm: function(e) {
    const fileUrl = e.currentTarget.dataset.url;
    this.setData({ deleteConfirmUrl: fileUrl });
  },

  hideDeleteConfirm: function() {
    this.setData({ deleteConfirmUrl: null });
  },

  deleteFile: function() {
    const fileUrl = this.data.deleteConfirmUrl;
    if (!fileUrl) return;

    wx.showLoading({ title: '删除中...' });

    api.deleteFile(fileUrl).then(res => {
      wx.hideLoading();
      if (res.success) {
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        });
        this.loadUploadedFiles();
      } else {
        wx.showToast({
          title: res.error || '删除失败',
          icon: 'error'
        });
      }
      this.setData({ deleteConfirmUrl: null });
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({
        title: '删除失败',
        icon: 'error'
      });
      this.setData({ deleteConfirmUrl: null });
    });
  },

  formatDate: function(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN');
  }
});
