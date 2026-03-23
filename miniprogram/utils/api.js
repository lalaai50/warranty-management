// API 基础地址 - Cloudflare Pages 部署地址
const API_BASE_URL = 'https://warranty-management.pages.dev';

/**
 * 封装请求方法
 */
function request(options) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: API_BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        ...options.header
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(res.data);
        }
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
}

/**
 * 获取统计数据
 */
function getStats() {
  return request({ url: '/api/stats' });
}

/**
 * 查询质保记录
 */
function queryRecords(stationName) {
  return request({ 
    url: '/api/query',
    data: { stationName }
  });
}

/**
 * 获取已上传文件列表
 */
function getUploadedFiles() {
  return request({ url: '/api/delete' });
}

/**
 * 删除文件
 */
function deleteFile(fileUrl) {
  return request({
    url: '/api/delete?fileUrl=' + encodeURIComponent(fileUrl),
    method: 'DELETE'
  });
}

/**
 * 清空所有数据
 */
function clearAll() {
  return request({
    url: '/api/clear-all',
    method: 'DELETE'
  });
}

/**
 * 上传Excel文件
 */
function uploadFile(filePath) {
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: API_BASE_URL + '/api/upload',
      filePath: filePath,
      name: 'file',
      success: (res) => {
        const data = JSON.parse(res.data);
        if (data.success) {
          resolve(data);
        } else {
          reject(data);
        }
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
}

module.exports = {
  API_BASE_URL,
  request,
  getStats,
  queryRecords,
  getUploadedFiles,
  deleteFile,
  clearAll,
  uploadFile
};
