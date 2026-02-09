<template>
  <div class="otp-wrapper">
    <!-- 手机号授权 -->
    <div class="otp-code">
      <div class="code-container">
        <div class="header-container">
          <h3>手机号授权</h3>
        </div>
        
        <el-form :model="authForm" label-width="100px">
          <el-form-item label="手机号">
            <el-input
              v-model="authForm.phone"
              placeholder="请输入手机号"
              clearable
            />
          </el-form-item>
          
          <el-form-item label="权限类型">
            <el-select
              v-model="authForm.type"
              placeholder="选择权限类型"
              class="type-selector"
            >
              <el-option label="管理员" value="admin" />
              <el-option label="网格员" value="grid" />
              <el-option label="物业管理员" value="property" />
            </el-select>
          </el-form-item>
        </el-form>

        <div class="button-group">
          <el-button
            type="primary"
            @click="grantPermission"
            :loading="authLoading"
          >
            授权
          </el-button>
        </div>
      </div>
    </div>

    <!-- 权限验证码 -->
    <div class="otp-code">
      <div class="code-container">
        <div class="header-container">
          <h3>权限验证码</h3>
          <el-select
            v-model="gridType"
            placeholder="选择类型"
            class="type-selector"
            @change="getGridOTPCode"
          >
            <el-option label="管理员" value="admin" />
            <el-option label="网格员" value="grid" />
            <el-option label="物业管理员" value="property" />
          </el-select>
        </div>
        <div class="code-display">
          <span class="code">{{ gridOtpCode || '获取中...' }}</span>
          <el-button
            v-if="gridOtpCode"
            type="text"
            class="copy-button"
            @click="copyCode(gridOtpCode)"
          >
            <el-icon><Document /></el-icon>
            复制
          </el-button>
        </div>

        <div class="timer-container">
          <div class="timer-text">有效期: {{ gridFormattedTime }}</div>
          <el-progress
            :percentage="gridTimePercentage"
            :color="gridProgressColor"
            :stroke-width="8"
          />
        </div>

        <div class="button-group">
          <el-button
            type="primary"
            @click="getGridOTPCode"
            :loading="gridLoading"
            :disabled="gridIsCountingDown"
          >
            {{ gridIsCountingDown ? '刷新倒计时中' : '刷新验证码' }}
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Document } from '@element-plus/icons-vue'
import { request } from '../../logic/register.js'

const totalTime = 30 // 单位s

// 手机号授权状态
const authForm = ref({
  phone: '',
  type: 'admin'
})
const authLoading = ref(false)

// 验证码状态
const gridOtpCode = ref('')
const gridLoading = ref(false)
const gridRemainingTime = ref(0)
const gridType = ref('admin') // admin: 管理员, grid: 网格员, property: 物业管理员
let gridCountdownTimer = null

// 手机号授权
const grantPermission = async () => {
  if (!authForm.value.phone) {
    ElMessage.warning('请输入手机号')
    return
  }
  if (!authForm.value.type) {
    ElMessage.warning('请选择权限类型')
    return
  }
  
  try {
    authLoading.value = true
    const response = await request.put(`/user/Changepermission?type=${authForm.value.type}`, {
      phone: authForm.value.phone
    })
    
    if (response.code === 200) {
      const typeName = authForm.value.type === 'admin' ? '管理员' : 
                       authForm.value.type === 'grid' ? '网格员' : '物业管理员'
      ElMessage.success(`已成功授予 ${authForm.value.phone} ${typeName}权限`)
      authForm.value.phone = ''
    } else {
      throw new Error('授权失败')
    }
  } catch (error) {
    ElMessage.error('授权失败')
    console.error('授权失败:', error)
  } finally {
    authLoading.value = false
  }
}

// 验证码计算属性
const gridFormattedTime = computed(() => {
  const minutes = Math.floor(gridRemainingTime.value / 60)
  const seconds = gridRemainingTime.value % 60
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
})

const gridTimePercentage = computed(() => {
  return ((gridRemainingTime.value / totalTime) * 100).toFixed(2)
})

const gridProgressColor = computed(() => {
  if (gridTimePercentage.value > 50) {
    return '#67C23A' // 绿色
  } else if (gridTimePercentage.value > 20) {
    return '#E6A23C' // 黄色
  } else {
    return '#F56C6C' // 红色
  }
})

const gridIsCountingDown = computed(() => {
  return gridRemainingTime.value > 0
})

// 获取OTP验证码
const getGridOTPCode = async () => {
  try {
    gridLoading.value = true
    const response = await request.get(`/user/Changepermission?type=${gridType.value}`)
    if (response.code === 200 && response.data) {
      gridOtpCode.value = response.data.code || response.data
      startGridCountdown()
    } else {
      throw new Error('获取验证码失败')
    }
  } catch (error) {
    const typeName = gridType.value === 'admin' ? '管理员' : 
                     gridType.value === 'grid' ? '网格员' : '物业管理员'
    ElMessage.error(`获取${typeName}验证码失败`)
    console.error(`获取${typeName}验证码失败:`, error)
  } finally {
    gridLoading.value = false
  }
}

// 复制验证码到剪贴板
const copyCode = (code) => {
  if (!code) return

  navigator.clipboard
    .writeText(code)
    .then(() => {
      ElMessage.success('验证码已复制到剪贴板')
    })
    .catch((err) => {
      ElMessage.error('复制失败')
      console.error('复制失败:', err)
    })
}

// 开始倒计时
const startGridCountdown = () => {
  if (gridCountdownTimer) {
    clearInterval(gridCountdownTimer)
  }

  gridRemainingTime.value = totalTime

  gridCountdownTimer = setInterval(() => {
    if (gridRemainingTime.value > 0) {
      gridRemainingTime.value--
    } else {
      gridOtpCode.value = '已过期'
      clearInterval(gridCountdownTimer)
    }
  }, 1000)
}

// 组件加载时获取验证码
onMounted(() => {
  getGridOTPCode()
})

// 组件卸载时清除计时器
onUnmounted(() => {
  if (gridCountdownTimer) {
    clearInterval(gridCountdownTimer)
  }
})
</script>

<style scoped>
.otp-wrapper {
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
}

.otp-code {
  padding: 25px;
  flex: 1;
  min-width: 400px;
  max-width: 500px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.otp-code:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 48px 0 rgba(0, 0, 0, 0.15);
}

.code-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.header-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
  text-align: center;
}

.type-selector {
  width: 100%;
}

:deep(.type-selector .el-input__wrapper) {
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85));
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  padding: 8px 12px;
  border: 1px solid rgba(64, 158, 255, 0.1);
}

:deep(.type-selector .el-input__wrapper:hover) {
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.25);
  border-color: rgba(64, 158, 255, 0.3);
  transform: translateY(-1px);
}

:deep(.type-selector .el-input__inner) {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

:deep(.type-selector .el-select__caret) {
  font-size: 16px;
  color: #409eff;
}

.code-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(0, 0, 0, 0.03);
  padding: 20px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.code {
  font-family: 'Courier New', monospace;
  font-size: 20px;
  font-weight: bold;
  letter-spacing: 1px;
  color: #409eff;
  word-break: break-all;
  max-width: 100%;
  overflow-wrap: break-word;
  flex: 1;
  min-width: 0;
}

.timer-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.timer-text {
  font-size: 14px;
  color: #606266;
  display: flex;
  justify-content: flex-end;
}

.button-group {
  margin-top: 10px;
  display: flex;
  justify-content: center;
}

:deep(.el-button) {
  border-radius: 8px;
  padding: 10px 24px;
  font-weight: 500;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
}

:deep(.el-button--primary) {
  background: linear-gradient(45deg, #409eff, #60acff);
  border: none;
}

:deep(.el-button--primary:hover) {
  background: linear-gradient(45deg, #60acff, #409eff);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

:deep(.el-button--primary:disabled) {
  opacity: 0.7;
  transform: none;
  box-shadow: none;
}

/* 表单样式 */
:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-form-item__label) {
  color: rgba(0, 0, 0, 0.75);
  font-weight: 500;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 1px solid rgba(64, 158, 255, 0.1);
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.25);
  border-color: rgba(64, 158, 255, 0.3);
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.35);
  border-color: #409eff;
}

:deep(.el-input__inner) {
  color: #333;
  font-size: 15px;
}

.copy-button {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #409eff;
}

.copy-button:hover {
  color: #66b1ff;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.otp-code {
  animation: fadeIn 0.5s ease-out;
}

@media (max-width: 900px) {
  .otp-wrapper {
    flex-direction: column;
  }

  .otp-code {
    max-width: 100%;
  }
}
</style>
