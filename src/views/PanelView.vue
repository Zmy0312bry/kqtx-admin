<template>
  <div class="panel">
    <!-- 左侧边栏 -->
    <SideBar />

    <!-- 右侧内容区 -->
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import SideBar from '@/components/adminpanel/SideBar.vue'

const route = useRoute()
const currentPanel = ref('basic')

// 监听路由变化以切换面板
watch(
  () => route.path,
  (path) => {
    currentPanel.value = path.split('/').pop() || 'basic'
  },
  { immediate: true },
)
</script>

<style scoped>
.panel {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a2233 0%, #0d1117 100%);
  position: relative;
  overflow: hidden;
  padding-left: 200px;
}

:deep(router-view) {
  flex: 1;
  display: flex;
  margin: 20px;
  margin-left: 0;
  position: relative;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}
</style>
