// pages/query/query.js
const api = require('../../utils/api');

Page({
  data: {
    searchValue: '',
    searching: false,
    searchResults: [],
    stationSummary: null, // 站点状态汇总
    errorMessage: ''
  },

  onInputChange: function(e) {
    this.setData({ searchValue: e.detail.value });
  },

  doSearch: function() {
    const stationName = this.data.searchValue.trim();
    
    if (!stationName) {
      wx.showToast({
        title: '请输入场站名',
        icon: 'none'
      });
      return;
    }

    this.setData({ 
      searching: true, 
      searchResults: [],
      stationSummary: null,
      errorMessage: ''
    });

    wx.showLoading({ title: '查询中...' });

    api.queryRecords(stationName).then(res => {
      wx.hideLoading();
      if (res.success && res.data.length > 0) {
        const results = res.data;
        
        // 计算在保和过保数量
        const inWarrantyRecords = results.filter(r => r.warranty_status_display === '在保');
        const outOfWarrantyRecords = results.filter(r => r.warranty_status_display === '过保');
        
        // 确定站点状态
        let status = 'partial';
        if (inWarrantyRecords.length === results.length) {
          status = 'all-in-warranty';
        } else if (outOfWarrantyRecords.length === results.length) {
          status = 'all-out-of-warranty';
        }

        this.setData({
          searching: false,
          searchResults: results,
          stationSummary: {
            status: status,
            total: results.length,
            inWarranty: inWarrantyRecords.length,
            outOfWarranty: outOfWarrantyRecords.length,
            inWarrantyRecords: inWarrantyRecords,
            outOfWarrantyRecords: outOfWarrantyRecords
          }
        });
      } else {
        this.setData({ 
          searching: false,
          errorMessage: '未找到相关记录'
        });
      }
    }).catch(err => {
      wx.hideLoading();
      this.setData({ 
        searching: false,
        errorMessage: err.error || '查询失败，请重试'
      });
    });
  },

  // 下载源文件
  downloadFile: function(e) {
    const url = e.currentTarget.dataset.url;
    const name = e.currentTarget.dataset.name;
    
    wx.showLoading({ title: '下载中...' });
    
    wx.downloadFile({
      url: url,
      success: (res) => {
        wx.hideLoading();
        wx.openDocument({
          filePath: res.tempFilePath,
          fileType: 'xlsx',
          fail: () => {
            wx.showToast({
              title: '打开文件失败',
              icon: 'error'
            });
          }
        });
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({
          title: '下载失败',
          icon: 'error'
        });
      }
    });
  },

  // 格式化剩余天数
  formatDays: function(days) {
    if (days > 0) {
      return `剩余 ${days} 天`;
    } else {
      return `已过期 ${Math.abs(days)} 天`;
    }
  }
});
