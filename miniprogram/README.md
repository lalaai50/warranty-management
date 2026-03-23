# 设备维保管理小程序

## 项目说明

这是设备维保管理系统的微信小程序版本，支持以下功能：

- **全部数据**：查看设备统计和站点统计
- **上传**：上传Excel文件导入设备数据
- **查询**：按场站名称查询设备质保状态

## 配置步骤

### 1. 修改API地址

打开 `utils/api.js` 文件，修改 `API_BASE_URL` 为你的后端服务地址：

```javascript
// 将以下地址修改为你的实际后端地址
const API_BASE_URL = 'https://your-domain.com';
```

### 2. 配置小程序AppID

打开 `project.config.json` 文件，修改 `appid` 为你的小程序AppID：

```json
{
  "appid": "你的小程序AppID"
}
```

### 3. 添加TabBar图标

在 `miniprogram/images/` 目录下添加以下图标文件（建议尺寸 81x81 像素）：

- `database.png` - 数据图标（未选中）
- `database-active.png` - 数据图标（选中）
- `upload.png` - 上传图标（未选中）
- `upload-active.png` - 上传图标（选中）
- `search.png` - 搜索图标（未选中）
- `search-active.png` - 搜索图标（选中）

或者修改 `app.json` 中的 `tabBar.list`，使用小程序自带的图标或移除图标配置。

### 4. 后端配置

确保后端已配置小程序域名白名单：

1. 登录微信公众平台
2. 进入「开发」-「开发管理」-「开发设置」
3. 在「服务器域名」中添加你的后端域名

## 目录结构

```
miniprogram/
├── app.js              # 小程序入口
├── app.json            # 小程序配置
├── app.wxss            # 全局样式
├── project.config.json # 项目配置
├── sitemap.json        # 搜索配置
├── images/             # 图标资源
│   ├── database.png
│   ├── database-active.png
│   ├── upload.png
│   ├── upload-active.png
│   ├── search.png
│   └── search-active.png
├── pages/
│   ├── index/          # 全部数据页
│   ├── upload/         # 上传页
│   └── query/          # 查询页
└── utils/
    └── api.js          # API封装
```

## 功能说明

### 全部数据页
- 显示总设备数、在保设备、过保设备统计
- 显示所有站点的设备统计列表
- 支持清空所有数据

### 上传页
- 支持选择Excel文件上传（.xlsx/.xls）
- 显示上传结果
- 显示已上传文件列表，支持删除

### 查询页
- 输入场站名称模糊搜索
- 显示站点整体状态提示：
  - 整站在保（绿色）
  - 整站过保（红色）
  - 部分过保（橙色，显示在保/过保设备清单）
- 显示设备明细列表

## 注意事项

1. 小程序网络请求需要使用HTTPS
2. 后端域名需要在微信公众平台配置白名单
3. 文件上传使用 `wx.chooseMessageFile`，只能从聊天记录选择文件
