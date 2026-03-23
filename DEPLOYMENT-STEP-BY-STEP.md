# 小白专用部署指南

## 🎯 目标
把你的设备维保系统部署到网上，让小程序可以一直访问。

---

## 第一步：注册账号（需要3个账号）

### 1.1 注册 GitHub（代码仓库）

**作用**：存放你的代码

**步骤**：
1. 打开浏览器，输入地址：`https://github.com`
2. 点击右上角 **Sign up**（注册）
3. 输入你的邮箱 → 点击 Continue
4. 输入密码 → 点击 Continue  
5. 输入用户名（英文，如：zhangsan123）→ 点击 Continue
6. 输入验证码 → 点击 Create account
7. 去邮箱点确认链接，完成注册

---

### 1.2 注册 Vercel（免费服务器）

**作用**：让网站24小时运行

**步骤**：
1. 打开浏览器，输入地址：`https://vercel.com`
2. 点击 **Sign Up**（注册）
3. 选择 **Continue with GitHub**（用GitHub账号登录）
4. 点击 **Authorize Vercel**（授权）
5. 输入你的手机号验证（如果提示）
6. 点击 **Skip** 跳过问卷

---

### 1.3 获取 Supabase 数据库信息

**作用**：存储设备数据

**步骤**：
1. 打开浏览器，输入地址：`https://supabase.com`
2. 点击 **Start your project** 或 **Sign In**
3. 选择 **Continue with GitHub**（用GitHub登录）
4. 登录后，你会看到项目列表

**⚠️ 重要：获取数据库信息**

1. 点击你的项目名称（如：warranty）
2. 点击左侧菜单的 **Settings**（设置图标⚙️）
3. 点击 **API**
4. 找到以下两个值，**复制保存好**：

```
Project URL: https://xxxxxx.supabase.co
           ↓
这是 COZE_SUPABASE_URL 的值

anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
           ↓  
这是 COZE_SUPABASE_ANON_KEY 的值
```

**📝 记下来**：把这两个值复制到记事本保存！

---

## 第二步：创建数据库表

**步骤**：
1. 在 Supabase 项目页面
2. 点击左侧菜单的 **SQL Editor**（SQL图标）
3. 点击右上角 **New query**（新建查询）
4. 复制下面的代码，粘贴到输入框：

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

CREATE INDEX IF NOT EXISTS idx_station_name ON warranty_records(station_name);
CREATE INDEX IF NOT EXISTS idx_after_sales_code ON warranty_records(after_sales_code);
```

5. 点击右下角 **Run**（运行）
6. 看到 "Success" 就成功了

---

## 第三步：配置对象存储（存Excel文件）

### 方案A：使用阿里云OSS（推荐国内用户）

**步骤**：
1. 打开 `https://oss.console.aliyun.com`
2. 登录阿里云账号（没有就注册一个）
3. 点击 **创建Bucket**
4. 填写：
   - Bucket名称：`warranty-files`（随便起）
   - 地域：选离你近的（如：华东1-杭州）
   - 存储类型：标准存储
5. 点击 **确定**
6. 创建完成后，点击 **概览**
7. 记下以下信息：

```
Endpoint: oss-cn-hangzhou.aliyuncs.com
       ↓
这是 COZE_BUCKET_ENDPOINT_URL 的值（前面加 https://）

Bucket名称: warranty-files
         ↓
这是 COZE_BUCKET_NAME 的值
```

8. 获取密钥：
   - 点击右上角头像 → **AccessKey管理**
   - 点击 **创建 AccessKey**
   - 验证手机后，会显示：
     - AccessKey ID → 这是 `COZE_BUCKET_ACCESS_KEY`
     - AccessKey Secret → 这是 `COZE_BUCKET_SECRET_KEY`
   - **⚠️ 马上复制保存！只显示一次！**

### 方案B：使用Supabase Storage（更简单）

如果你觉得阿里云麻烦，可以用 Supabase 自带的存储：

1. 在 Supabase 项目页面
2. 点击左侧 **Storage**
3. 点击 **New bucket**
4. 名称输入：`files`
5. 勾选 **Public bucket**
6. 点击 **Create bucket**

然后使用 Supabase 的存储功能，不需要额外配置对象存储。

---

## 第四步：上传代码到 GitHub

### 4.1 在 GitHub 创建仓库

1. 登录 GitHub
2. 点击右上角 **+** → **New repository**
3. 填写：
   - Repository name: `warranty-management`
   - 选择 **Public**（公开）
4. 点击 **Create repository**

### 4.2 下载代码到本地

**方法一：直接下载压缩包**
1. 在当前沙箱环境中，代码已经在 `/workspace/projects` 目录
2. 你需要把代码下载到本地电脑

**方法二：我帮你把代码打包**

这里我无法直接帮你下载，你需要：
1. 把项目文件夹里的所有文件复制出来
2. 或者让我生成一个下载链接

### 4.3 上传代码

**最简单的方法**：直接在 GitHub 网页上传

1. 打开你刚创建的仓库页面
2. 点击 **uploading an existing file**
3. 把所有代码文件拖进去
4. 点击 **Commit changes**

---

## 第五步：部署到 Vercel

### 5.1 导入项目

1. 打开 `https://vercel.com`
2. 点击 **Add New...** → **Project**
3. 点击 **Import Git Repository**
4. 选择你的 `warranty-management` 仓库
5. 点击 **Import**

### 5.2 配置环境变量（最重要的一步！）

在部署页面，找到 **Environment Variables** 区域，一个个添加：

**第一组**：
```
Name: COZE_SUPABASE_URL
Value: https://xxxxxx.supabase.co（你之前记下来的）
```
点击 **Add**

**第二组**：
```
Name: COZE_SUPABASE_ANON_KEY  
Value: eyJhbGciOiJIUzI1NiIs...（你之前记下来的）
```
点击 **Add**

**第三组**（如果用阿里云OSS）：
```
Name: COZE_BUCKET_ENDPOINT_URL
Value: https://oss-cn-hangzhou.aliyuncs.com
```
点击 **Add**

**第四组**：
```
Name: COZE_BUCKET_NAME
Value: warranty-files
```
点击 **Add**

**第五组**：
```
Name: COZE_BUCKET_ACCESS_KEY
Value: 你的AccessKey ID
```
点击 **Add**

**第六组**：
```
Name: COZE_BUCKET_SECRET_KEY
Value: 你的AccessKey Secret
```
点击 **Add**

### 5.3 开始部署

1. 确认所有环境变量都添加了
2. 点击 **Deploy**（部署）
3. 等待2-3分钟
4. 看到 🎉 **Congratulations!** 就是成功了
5. 点击 **Continue to Dashboard**
6. 在 Dashboard 页面，你会看到一个网址，如：
   - `https://warranty-management-xxx.vercel.app`
   
**📝 记下来**：这就是你的网站地址！

---

## 第六步：测试是否成功

### 6.1 测试 API

1. 打开浏览器
2. 输入：`https://你的域名/api/stats`
3. 如果看到类似 `{"total":1303,"inWarranty":729,...}` 就成功了！

---

## 第七步：配置小程序

### 7.1 修改小程序代码

1. 打开 `miniprogram/utils/api.js` 文件
2. 找到第一行：
```javascript
const API_BASE_URL = 'https://your-domain.com';
```
3. 改成你的 Vercel 域名：
```javascript
const API_BASE_URL = 'https://warranty-management-xxx.vercel.app';
```
4. 保存文件

### 7.2 配置微信小程序域名

1. 打开 `https://mp.weixin.qq.com`
2. 登录你的小程序账号
3. 点击左侧 **开发管理**
4. 点击 **开发设置**
5. 找到 **服务器域名**
6. 点击 **修改**
7. 添加以下域名：
   - **request合法域名**：`https://你的vercel域名`
   - **uploadFile合法域名**：`https://你的vercel域名`
   - **downloadFile合法域名**：`https://你的S3域名`

---

## 第八步：发布小程序

### 8.1 上传代码

1. 打开微信开发者工具
2. 导入 `miniprogram` 目录
3. 填入你的小程序 AppID
4. 点击右上角 **上传**
5. 填写版本号：`1.0.0`
6. 点击 **确定**

### 8.2 提交审核

1. 打开 `https://mp.weixin.qq.com`
2. 点击 **管理** → **版本管理**
3. 点击 **提交审核**
4. 填写审核信息
5. 等待审核通过（通常1-3天）

### 8.3 发布上线

审核通过后：
1. 点击 **发布**
2. 小程序就可以被用户搜索使用了！

---

## 🔧 常见问题

### Q1: Vercel 部署失败怎么办？

**检查环境变量**：
1. 在 Vercel 项目页面
2. 点击 **Settings** → **Environment Variables**
3. 确认所有变量都填写正确

### Q2: 打开网站显示 500 错误？

**查看错误日志**：
1. 在 Vercel 项目页面
2. 点击 **Deployments**
3. 点击最新的部署
4. 点击 **Functions** → **View Function Logs**
5. 查看具体错误信息

### Q3: 数据库连接失败？

**确认 Supabase 设置**：
1. 检查 URL 和 Key 是否正确
2. 检查数据库表是否创建成功

### Q4: Excel 上传失败？

**确认对象存储设置**：
1. 检查 Bucket 是否创建
2. 检查 AccessKey 是否正确
3. 检查 Bucket 权限是否允许上传

---

## 📞 需要帮助？

如果遇到问题，告诉我：
1. 在哪一步卡住了
2. 看到了什么错误信息
3. 我会帮你一步步解决
