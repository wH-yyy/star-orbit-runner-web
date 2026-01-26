# 星轨Runner Web 管理端

本仓库为 **“星轨Runner 校园夜跑管理系统”** 的 **Web 管理端**，主要面向活动工作人员与系统管理员，提供夜跑数据统计查看、申诉审核、用户管理等后台功能。

Web 管理端基于 **CloudBase 云开发平台** 构建，采用 **前端静态托管 + 云函数后端** 的 Serverless 架构，不依赖传统服务器部署。

---

## 一、项目背景

“星轨Runner” 是为西安交通大学 “星荧夜跑” 校园体育活动开发的智能化管理系统，旨在解决传统人工审核、Excel 统计效率低、易出错的问题。

系统整体分为：

- **微信小程序端**：普通用户夜跑打卡、记录查看、申诉提交
- **Web 管理端（本仓库）**：工作人员审核、申诉处理、数据统计与管理

---

## 二、功能概览

### 1. 管理员 / 工作人员功能

- 管理员账号登录（账号密码）
- 夜跑申诉记录查看与终审
- 打卡数据统计查看（总人数、打卡次数等）
- 数据导出（Excel格式）
- 用户状态管理（封号 / 停跑）
- 活动规则与时间配置（可扩展）

### 2. 权限分级（逻辑支持）

- `admin`：系统配置、账号分派、数据导出
- `reviewer`：申诉审核、打卡记录复核
- `analyst`：仅查看统计数据

---

## 三、技术栈

### 前端

- Vue 3 + Vite
- Element Plus（UI 组件库）
- JavaScript / HTML / CSS

### 云开发（后端）

- CloudBase 云函数（Node.js）
- CloudBase 云数据库
- CloudBase 云存储
- CloudBase 静态网站托管

### 架构模式

- Serverless（无服务器）
- 前后端分离
- Web 端 **不直接访问数据库**，所有数据操作通过云函数完成

---

## 四、整体架构说明

```text
Web 管理端（浏览器）
   │
   │ CloudBase Web SDK（callFunction）
   ▼
云函数 admin-api（统一鉴权 + 业务逻辑）
   │
   ▼
云数据库 / 云存储

```


## 五、完整项目结构（指导）


星轨Runner-Web端/
├── README.md                     # 项目说明
├── package.json                  # 前端依赖与脚本
├── vite.config.js                # Vite 配置（代理 / 路径别名等）
├── index.html                    # Web 入口 HTML
├── .gitignore                    # Git 忽略文件
├── .env                          # 环境变量（envId、模式等）
├── .env.production               # 生产环境变量
│
├── public/                       # 静态资源（不经 Vite 处理）
│   ├── favicon.ico
│   └── logo.png
│
├── src/                          # 核心源码目录
│   ├── main.js                   # 应用入口
│   ├── App.vue                   # 根组件
│   │
│   ├── cloud/                    # CloudBase 相关封装 ⭐
│   │   ├── index.js              # CloudBase 初始化
│   │   └── auth.js               # CloudBase 登录（匿名 / 自定义）
│   │
│   ├── api/                      # 云函数 API 封装 ⭐
│   │   ├── admin.js              # 管理端 API
│   │   └── request.js            # callFunction 统一封装
│   │
│   ├── router/                   # 路由
│   │   ├── index.js
│   │   └── guard.js              # 路由守卫
│   │
│   ├── store/                    # 全局状态（Pinia）
│   │   └── admin.js
│   │
│   ├── views/                    # 页面级组件
│   │   ├── Login.vue
│   │   ├── Dashboard.vue
│   │   ├── Appeals/
│   │   │   ├── AppealList.vue
│   │   │   └── AppealDetail.vue
│   │   ├── Users/
│   │   │   └── UserList.vue
│   │   └── Export.vue
│   │
│   ├── components/               # 可复用组件
│   │   ├── Layout/
│   │   │   ├── Sidebar.vue
│   │   │   ├── Header.vue
│   │   │   └── Layout.vue
│   │   ├── StatCard.vue
│   │   └── ConfirmDialog.vue
│   │
│   ├── utils/                    # 工具函数
│   │   ├── token.js
│   │   ├── time.js
│   │   └── permission.js
│   │
│   ├── styles/                   # 全局样式
│   │   ├── index.css
│   │   └── variables.scss
│   │
│   └── constants/                # 常量定义
│       ├── roles.js
│       └── status.js
│
├── dist/                         # 构建产物（部署用）
│
└── docs/                         # 项目文档
    ├── architecture.md
    ├── api-spec.md
    └── deploy.md
