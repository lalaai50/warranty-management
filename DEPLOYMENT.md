# Vercel 部署指南

## 概述

本指南将帮助您将设备维保管理系统部署到 Vercel（免费），让小程序可以长期稳定访问。

---

## 第一步：准备工作

### 1.1 注册账号

| 服务 | 用途 | 注册地址 |
|------|------|----------|
| **Vercel** | 托管后端服务 | https://vercel.com |
| **Supabase** | 数据库存储 | https://supabase.com |
| **GitHub** | 代码托管 | https://github.com |

### 1.2 获取 Supabase 凭证

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择项目（或创建新项目）
3. 进入 **Settings** → **API**
4. 记录以下信息：
   - **Project URL** → 这就是 `COZE_SUPABASE_URL`
   - **anon public key** → 这就是 `COZE_SUPABASE_ANON_KEY`

### 1.3 配置对象存储

您需要一个 S3 兼容的对象存储服务来存放上传的 Excel 文件。推荐选项：

| 服务商 | 免费额度 | 说明 |
|--------|----------|------|
| **阿里云 OSS** | 5GB 存储 | 国内访问快 |
| **腾讯云 COS** | 6个月免费 | 国内访问快 |
| **Cloudflare R2** | 10GB 免费 | 无出站流量费 |
| **AWS S3** | 5GB (12个月) | 国际服务 |

创建 Bucket 后，获取：
- Endpoint URL
- Bucket Name
- Access Key
- Secret Key

---

## 第二步：上传代码到 GitHub

### 2.1 初始化 Git 仓库

```bash
cd /workspace/projects

# 初始化仓库
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: 设备维保管理系统"
```

### 2.2 推送到 GitHub

```bash
# 在 GitHub 创建新仓库后
git remote add origin https://github.com/你的用户名/warranty-management.git
git branch -M main
git push -u origin main
```

---

## 第三步：部署到 Vercel

### 3.1 导入项目

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 **Add New...** → **Project**
3. 选择 **Import Git Repository**
4. 选择您的 GitHub 仓库
5. 点击 **Import**

### 3.2 配置环境变量

在部署前，点击 **Environment Variables**，添加以下变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `COZE_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase 项目 URL |
| `COZE_SUPABASE_ANON_KEY` | `eyJhbGci...` | Supabase 匿名密钥 |
| `COZE_BUCKET_ENDPOINT_URL` | `https://oss-cn-xxx.aliyuncs.com` | S3 端点 |
| `COZE_BUCKET_NAME` | `your-bucket` | 存储桶名称 |
| `COZE_BUCKET_ACCESS_KEY` | `xxx` | S3 访问密钥 |
| `COZE_BUCKET_SECRET_KEY` | `xxx` | S3 密钥 |
| `COZE_BUCKET_REGION` | `oss-cn-hangzhou` | 区域（可选） |

### 3.3 部署

1. 点击 **Deploy**
2. 等待部署完成（约 2-3 分钟）
3. 部署成功后，Vercel 会分配一个域名，如：
   - `https://warranty-management.vercel.app`

---

## 第四步：配置数据库表

### 4.1 在 Supabase 创建表

登录 Supabase Dashboard → SQL Editor，执行：

```sql
CREATE TABLE IF NOT EXISTS warranty_records (
  id SERIAL PRIMARY KEY,
  file_name TEXT,
  file_url TEXT,
  after_sales_code TEXT,
  warranty_status TEXT,
  factory_date TEXT,
  factory_number TEXT,
  pile_number TEXT,
  product_code TEXT,
  device_type TEXT,
  device_name TEXT,
  product_model TEXT,
  manufacturer TEXT,
  station_name TEXT,
  province TEXT,
  city TEXT,
  district TEXT,
  station_address TEXT,
  customer TEXT,
  maintainer TEXT,
  warranty_period TEXT,
  warranty_start_date TEXT,
  warranty_end_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引加速查询
CREATE INDEX IF NOT EXISTS idx_station_name ON warranty_records(station_name);
CREATE INDEX IF NOT EXISTS idx_after_sales_code ON warranty_records(after_sales_code);
```

---

## 第五步：配置小程序

### 5.1 更新 API 地址

编辑 `miniprogram/utils/api.js`：

```javascript
// 修改为您的 Vercel 域名
const API_BASE_URL = 'https://warranty-management.vercel.app';
```

### 5.2 配置微信小程序域名

1. 登录 [微信公众平台](https://mp.weixin.qq.com)
2. 进入 **开发** → **开发管理** → **开发设置**
3. 在 **服务器域名** 中添加：
   - **request合法域名**: `https://warranty-management.vercel.app`
   - **uploadFile合法域名**: `https://warranty-management.vercel.app`
   - **downloadFile合法域名**: `您的S3域名`

---

## 第六步：测试验证

### 6.1 测试 API

```bash
# 测试统计接口
curl https://您的域名/api/stats

# 测试查询接口
curl https://您的域名/api/query?stationName=测试站点
```

### 6.2 测试小程序

1. 打开微信开发者工具
2. 导入 `miniprogram` 目录
3. 填入您的 AppID
4. 编译运行，测试各功能

---

## 常见问题

### Q: 部署后 API 返回 500 错误？

检查环境变量是否正确配置：
- Supabase URL 和 Key 是否正确
- 对象存储凭证是否有效

### Q: 小程序请求失败？

1. 确认已配置服务器域名白名单
2. 确认域名使用 HTTPS
3. 检查 Vercel 部署是否成功

### Q: Excel 上传失败？

1. 检查对象存储配置是否正确
2. 确认 Bucket 权限设置允许上传
3. 查看 Vercel 函数日志排查错误

---

## 费用说明

| 服务 | 免费额度 | 超出费用 |
|------|----------|----------|
| **Vercel** | 100GB 带宽/月 | $40/TB |
| **Supabase** | 500MB 数据库 + 1GB 文件 | $25/月起 |
| **阿里云 OSS** | 5GB 存储 | 按量付费 |

对于中小规模使用，免费额度完全够用。

---

## 下一步

部署完成后：
1. 在小程序开发者工具中测试完整流程
2. 提交小程序审核
3. 发布小程序供用户使用
