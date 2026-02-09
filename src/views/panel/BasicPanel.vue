<template>
  <div class="basic-panel">
    <!-- 顶部栏：标签页 + 我的信息按钮 -->
    <div class="panel-header">
      <el-tabs class="custom-tabs">
      <el-tab-pane label="人员管理">
        <transition name="fade-slide">
          <UserProfile />
        </transition>
      </el-tab-pane>
      <el-tab-pane label="电话管理">
        <transition name="fade-slide">
          <CommunityPhone />
        </transition>
      </el-tab-pane>
      <el-tab-pane label="轮播图管理">
        <transition name="fade-slide">
          <SwitchBanner />
        </transition>
      </el-tab-pane>
      <el-tab-pane label="温馨提示">
        <transition name="fade-slide">
          <WarmNotice />
        </transition>
      </el-tab-pane>
      <el-tab-pane label="权限校验管理">
        <transition name="fade-slide">
          <OTPCode />
        </transition>
      </el-tab-pane>
      </el-tabs>
      
      <!-- 我的信息按钮 -->
      <div class="my-info-btn" @click="openMyInfo">
        <el-icon :size="20"><User /></el-icon>
        <span>我的信息</span>
      </div>
    </div>

    <!-- 个人信息编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="我的信息"
      width="600px"
      lock-scroll
    >
      <el-form :model="myInfoForm" label-width="100px" :rules="rules" ref="formRef">
        <el-form-item label="OpenID">
          <el-input v-model="myInfoForm.openid" disabled />
        </el-form-item>

        <el-form-item label="用户名" prop="username">
          <el-input v-model="myInfoForm.username" placeholder="请输入用户名" />
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <el-input v-model="myInfoForm.phone" placeholder="请输入手机号" />
        </el-form-item>

        <el-form-item label="新密码" prop="password">
          <el-input
            v-model="myInfoForm.password"
            type="password"
            placeholder="不修改密码请留空"
            show-password
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="myInfoForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>

        <el-form-item label="头像">
          <div class="avatar-upload">
            <el-upload
              class="avatar-uploader"
              :auto-upload="false"
              :show-file-list="false"
              :on-change="handleAvatarChange"
              accept="image/*"
            >
              <img v-if="myInfoForm.avatar" :src="myInfoForm.avatar" class="uploaded-avatar" />
              <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
            </el-upload>
            <div class="upload-tip">点击上传新头像 (支持 JPG、PNG、WEBP 格式，不超过 5MB)</div>
          </div>
        </el-form-item>

        <el-form-item label="权限等级">
          <el-tag :type="getPermissionTagType(myInfoForm.permission_level)" effect="dark" size="large">
            {{ getPermissionText(myInfoForm.permission_level) }}
          </el-tag>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveMyInfo" :loading="saveLoading">
            保存修改
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Plus } from '@element-plus/icons-vue'
import UserProfile from '@/components/adminpanel/UserProfile.vue'
import CommunityPhone from '@/components/adminpanel/CommunityPhone.vue'
import SwitchBanner from '@/components/adminpanel/SwitchBanner.vue'
import WarmNotice from '@/components/adminpanel/WarmNotice.vue'
import OTPCode from '@/components/adminpanel/OTPCode.vue'
import request from '@/logic/register.js'

const formRef = ref(null)
const dialogVisible = ref(false)
const saveLoading = ref(false)

// 个人信息表单
const myInfoForm = ref({
  openid: '',
  username: '',
  phone: '',
  password: '',
  confirmPassword: '',
  avatar: '',
  permission_level: 1,
})

// 权限等级文本映射
const getPermissionText = (level) => {
  const levelMap = {
    1: '管理员',
    2: '超级管理员',
    3: '网格员',
    4: '物业管理员',
  }
  return levelMap[level] || '未知权限'
}

// 权限等级标签类型
const getPermissionTagType = (level) => {
  const typeMap = {
    1: 'primary',
    2: 'danger',
    3: 'success',
    4: 'warning',
  }
  return typeMap[level] || 'info'
}

// 表单验证规则
const validatePassword = (rule, value, callback) => {
  if (value && value.length < 6) {
    callback(new Error('密码长度不能少于6位'))
  } else {
    callback()
  }
}

const validateConfirmPassword = (rule, value, callback) => {
  if (myInfoForm.value.password && value !== myInfoForm.value.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在 2 到 20 个字符', trigger: 'blur' },
  ],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  password: [{ validator: validatePassword, trigger: 'blur' }],
  confirmPassword: [{ validator: validateConfirmPassword, trigger: 'blur' }],
}

// 打开个人信息对话框
const openMyInfo = async () => {
  try {
    const response = await request.get('/user/UserInfo')
    console.log(response);
    
    // response.data 是数组，取第一个元素
    if (response.data && response.data.length > 0) {
      const userInfo = response.data[0]
      
      // 构建完整的头像URL
      let avatarUrl = userInfo.avatar || ''
      if (avatarUrl && !avatarUrl.startsWith('http')) {
        let baseURL = import.meta.env.VITE_API_BASE_URL || ''
        baseURL = baseURL.replace(/\/api$/, '')
        avatarUrl = baseURL + avatarUrl
      }
      
      myInfoForm.value = {
        openid: userInfo.openid || '',
        username: userInfo.username || '',
        phone: userInfo.phone || '',
        password: '',
        confirmPassword: '',
        avatar: avatarUrl,
        permission_level: userInfo.permission_level || 1,
      }
      dialogVisible.value = true
    } else {
      ElMessage.error('获取个人信息失败')
    }
  } catch (error) {
    ElMessage.error('获取个人信息失败')
    console.error('获取个人信息失败:', error)
  }
}

// 头像选择处理
const handleAvatarChange = async (file) => {
  const rawFile = file.raw

  // 验证文件
  const isImage = rawFile.type.startsWith('image/')
  const isLt5M = rawFile.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return
  }
  if (!isLt5M) {
    ElMessage.error('上传头像图片大小不能超过 5MB!')
    return
  }

  // 上传文件
  try {
    const formData = new FormData()
    formData.append('file', rawFile)

    const response = await request.post('/user/upload_image', formData)

    if (response.code === 200 && response.data.path) {
      // 构建完整的图片URL
      let baseURL = import.meta.env.VITE_API_BASE_URL || ''
      baseURL = baseURL.replace(/\/api$/, '')
      myInfoForm.value.avatar = baseURL + response.data.path
      ElMessage.success('头像上传成功')
    } else {
      ElMessage.error('头像上传失败')
    }
  } catch (error) {
    ElMessage.error('头像上传失败')
    console.error('头像上传失败:', error)
  }
}

// 保存个人信息
const saveMyInfo = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      saveLoading.value = true
      const updateData = {
        username: myInfoForm.value.username,
        phone: myInfoForm.value.phone,
        avatar: myInfoForm.value.avatar,
      }

      // 如果有输入密码，则包含密码字段
      if (myInfoForm.value.password) {
        updateData.password = myInfoForm.value.password
      }

      await request.put('/user/UserInfo', updateData)

      ElMessage.success('个人信息修改成功')
      dialogVisible.value = false
    } catch (error) {
      ElMessage.error('修改失败')
      console.error('修改失败:', error)
    } finally {
      saveLoading.value = false
    }
  })
}
</script>

<style scoped>
.basic-panel {
  background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 20px;
  flex: 1;
  overflow-y: auto;
  transition: all 0.3s ease;
}

.basic-panel:hover {
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
}

/* 顶部栏布局 */
.panel-header {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

/* 我的信息按钮 */
.my-info-btn {
  position: absolute;
  top: -5px;
  right: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #409eff 0%, #60acff 100%);
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.3);
}

.my-info-btn:hover {
  background: linear-gradient(135deg, #60acff 0%, #409eff 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.4);
}

.my-info-btn:active {
  transform: translateY(0);
}

:deep(.custom-tabs) {
  background: transparent;
  flex: 1;
}

:deep(.el-tabs__header) {
  margin-bottom: 20px;
  border-bottom: 2px solid #ebeef5;
}

:deep(.el-tabs__nav-wrap::after) {
  height: 0;
}

:deep(.el-tabs__item) {
  padding: 0 20px;
  height: 40px;
  line-height: 40px;
  font-size: 15px;
  font-weight: 500;
  color: #606266;
  transition: all 0.3s ease;
}

:deep(.el-tabs__item.is-active) {
  color: #409eff;
  font-weight: 600;
}

:deep(.el-tabs__active-bar) {
  height: 3px;
  border-radius: 3px;
  background-color: #409eff;
}

:deep(.el-tabs__content) {
  padding: 20px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 4px;
}

/* 过渡动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* 对话框样式 */
:deep(.el-dialog) {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

:deep(.el-dialog__title) {
  color: rgba(0, 0, 0, 0.85);
  font-size: 18px;
  font-weight: 600;
}

:deep(.el-dialog__header) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding: 20px 24px;
  margin: 0;
}

:deep(.el-dialog__body) {
  padding: 24px;
  color: rgba(0, 0, 0, 0.85);
}

:deep(.el-form-item__label) {
  color: rgba(0, 0, 0, 0.75);
  font-weight: 500;
}

:deep(.el-input__inner) {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.1);
  color: rgba(0, 0, 0, 0.9);
  transition: all 0.3s ease;
  border-radius: 8px;
  caret-color: #409eff;
}

:deep(.el-input__inner:hover) {
  border-color: rgba(0, 0, 0, 0.2);
}

:deep(.el-input__inner:focus) {
  background: rgba(255, 255, 255, 0.08);
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

:deep(.el-input__inner::placeholder) {
  color: rgba(0, 0, 0, 0.3);
}

:deep(.el-input.is-disabled .el-input__inner) {
  background-color: rgba(0, 0, 0, 0.02) !important;
  color: rgba(0, 0, 0, 0.4) !important;
  border-color: rgba(0, 0, 0, 0.05) !important;
}

/* 头像上传 */
.avatar-upload {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.avatar-uploader {
  border: 2px dashed rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;
  width: 150px;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.03);
}

.avatar-uploader:hover {
  border-color: #409eff;
  background: rgba(64, 158, 255, 0.05);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.uploaded-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: rgba(0, 0, 0, 0.3);
}

.upload-tip {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.5);
  line-height: 1.5;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
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

:deep(.el-button--default) {
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.1);
  color: rgba(0, 0, 0, 0.7);
}

:deep(.el-button--default:hover) {
  background: rgba(0, 0, 0, 0.1);
  border-color: rgba(0, 0, 0, 0.2);
  color: rgba(0, 0, 0, 0.85);
  transform: translateY(-1px);
}

:deep(.el-tag) {
  font-size: 14px;
  padding: 8px 16px;
  font-weight: 500;
  backdrop-filter: blur(5px);
}
</style>
