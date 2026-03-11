# KQTX 管理后台
一个使用 Vue 3 和 Vite 构建的综合管理后台系统，具有微信小程序登录集成、社区管理和数据可视化功能。

## 功能特点
1. 🔐 双重认证方式
  - [x] 微信扫码登录
  - [x] 用户名/密码登录
2. 📊 数据可视化面板
  - [x] 社区统计数据
  - [x] 投诉情况分析
  - [x] 重点人员监控
  - [x] 小程序使用分析
  - [x] 分类分布情况
3. 🗺️ 基于位置的功能
  - [x] 百度地图集成
  - [x] 社区电话目录
4. 💡 智能管理工具
  - [x] 轮播图管理系统
  - [x] 温馨提示广播
  - [x] 建议处理
  - [x] 报告管理

## 技术栈
- Vue 3 - 渐进式 JavaScript 框架
- Vite - 下一代前端构建工具
- Vue Router - Vue.js 官方路由
- Pinia - 状态管理
- 百度地图 API - 位置服务

## 项目结构
### 前提条件
> [!IMPORTANT] 
> 在开始之前，请确保您满足以下要求

1. `Node.js`（推荐最新的 LTS 版本） & `npm` 包管理器

### 快速开始

1. 克隆仓库：
```bash
git clone https://github.com:BUPT-Bridge/kqtx-admin.git
```
2. 安装依赖：
```bash
npm install
```
3. 配置环境变量：
复制`/.env.example`到`/.env`并修改其中的内容为自己的后端API

4. 启动开发服务器：
```bash
npm run dev
```
5. 构建生产版本：
```bash
npm run build
```

### 配置
主要配置通过环境变量管理：
|环境变量名称|对应的内容|
|------------|----------|
|VITE_API_BASE_URL|后端 API 基础 URL|
