<template>
  <div class="login-view">
    <div class="login-bg">
      <div class="bg-text">
        <h1>矿桥东街社区管理系统</h1>
        <p>智慧养老，为爱护航</p>
      </div>
    </div>
    <div class="login-container">
      <div class="login-box">
        <div class="login-tabs">
          <div
            class="tab-item"
            :class="{ active: currentTab === 'qrcode' }"
            @click="currentTab = 'qrcode'"
          >
            微信登录
          </div>
          <div
            class="tab-item"
            :class="{ active: currentTab === 'password' }"
            @click="currentTab = 'password'"
          >
            账号登录
          </div>
        </div>
        <div class="tab-content">
          <NameAndPassword v-if="currentTab === 'password'" />
          <WeiXinQRcode v-else />
        </div>
      </div>
    </div>
    <!-- 添加ICP备案信息 -->
    <!-- 添加ICP备案信息 -->
    <div class="icp-footer">
      <a :href="icpLink" target="_blank" rel="noopener noreferrer">{{ icpNumber }}</a>
      <span class="footer-divider">|</span>
      <span class="app-version">v{{ appVersion }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import NameAndPassword from '@/components/login/NameAndPassword.vue'
import WeiXinQRcode from '@/components/login/WeiXinQRcode.vue'

const currentTab = ref('qrcode')

// 从环境变量读取ICP备案号
const icpNumber = import.meta.env.VITE_ICP_NUMBER || 'XXXXXXXX'
// 从环境变量读取应用版本号（与 package.json 保持一致）
const appVersion = import.meta.env.VITE_APP_VERSION || '0.0.0'
// 工信部备案管理系统网址
const icpLink = 'https://beian.miit.gov.cn/'
</script>

<style scoped>
.login-view {
  width: 100vw;
  height: 100vh;
  display: flex;
  background-color: #f0f2f5;
  position: relative; /* 添加相对定位，用于绝对定位页脚 */
}

.login-bg {
  flex: 1;
  background: url('/bg.png') center center no-repeat;
  background-size: cover;
  position: relative;
}

.bg-text {
  position: absolute;
  left: 50%;
  top: 30%;
  transform: translateX(-50%);
  text-align: center;
  color: #fff;
}

.bg-text h1 {
  font-size: 36px;
  font-weight: 500;
  margin-bottom: 16px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.bg-text p {
  font-size: 20px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.login-container {
  width: 600px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
}

.login-box {
  width: 100%;
  padding: 40px;
}

.login-tabs {
  display: flex;
  margin-bottom: 24px;
  border-bottom: 1px solid #e4e7ed;
  justify-content: center;
}

.tab-item {
  padding: 0 20px 12px;
  margin: 0 20px;
  font-size: 16px;
  color: #606266;
  cursor: pointer;
  position: relative;
}

.tab-item.active {
  color: #409eff;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #409eff;
}

.tab-content {
  display: flex;
  justify-content: center;
  padding-top: 20px;
}
.icp-footer {
  position: absolute;
  bottom: 10px;
  left: 0;
  width: 100%;
  text-align: center;
  padding: 8px 0;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.icp-footer a {
  color: rgba(0, 0, 0, 0.45);
  text-decoration: none;
  transition: color 0.3s;
}

.icp-footer a:hover {
  color: #409eff;
}
</style>
