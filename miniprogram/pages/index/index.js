// pages/index/index.js
const api = require('../../utils/api');

Page({
  data: {
    loading: true,
    stats: {
      total: 0,
      inWarranty: 0,
      outOfWarranty: 0
    },
    stationStats: [],
    stationCount: 0,
    showClearConfirm: false
  },

  onLoad: function() {
    this.loadStats();
  },

  onShow: function() {
    this.loadStats();
  },

  onPullDownRefresh: function() {
    this.loadStats().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  loadStats: function() {
    this.setData({ loading: true });
    
    return api.getStats().then(res => {
      this.setData({
        loading: false,
        stats: {
          total: res.total || 0,
          inWarranty: res.inWarranty || 0,
          outOfWarranty: res.outOfWarranty || 0
        },
        stationStats: res.stations || [],
        stationCount: res.stationCount || 0
      });
    }).catch(err => {
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    });
  },

  showClearConfirm: function() {
    this.setData({ showClearConfirm: true });
  },

  hideClearConfirm: function() {
    this.setData({ showClearConfirm: false });
  },

  clearAllData: function() {
    wx.showLoading({ title: '清空中...' });
    
    api.clearAll().then(res => {
      wx.hideLoading();
      if (res.success) {
        wx.showToast({
          title: '清空成功',
          icon: 'success'
        });
        this.loadStats();
      } else {
        wx.showToast({
          title: res.error || '清空失败',
          icon: 'error'
        });
      }
      this.setData({ showClearConfirm: false });
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({
        title: '清空失败',
        icon: 'error'
      });
      this.setData({ showClearConfirm: false });
    });
  },

  getWarrantyRate: function(station) {
    if (station.total === 0) return '0.0';
    return ((station.inWarranty / station.total) * 100).toFixed(1);
  }
});
