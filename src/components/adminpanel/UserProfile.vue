<template>
  <div class="user-management">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>人员管理</h2>
      <div class="header-info">
        <span>共 {{ totalUsers }} 人</span>
      </div>
    </div>

    <!-- 管理员列表表格 -->
    <el-table
      :data="adminList"
      v-loading="loading"
      stripe
      class="admin-table"
      header-row-class-name="table-header"
      :row-style="{ height: '70px' }"
      height="400"
      style="width: 100%"
      table-layout="fixed"
    >
      <el-table-column label="头像" width="100" align="center">
        <template #default="{ row }">
          <el-avatar :size="50" :src="row.avatar">
            <img src="https://cube.elemecdn.com/e/fd/0fc7d20532fdaf769a25683617711png.png" />
          </el-avatar>
        </template>
      </el-table-column>

      <el-table-column prop="openid" label="OpenID" min-width="150" />

      <el-table-column prop="username" label="用户名" min-width="120">
        <template #default="{ row }">
          <span>{{ row.username || '未设置' }}</span>
        </template>
      </el-table-column>

      <el-table-column prop="phone" label="手机号" min-width="140">
        <template #default="{ row }">
          <span>{{ row.phone || '未设置' }}</span>
        </template>
      </el-table-column>

      <el-table-column label="权限等级" width="150" align="center">
        <template #default="{ row }">
          <el-tag :type="getPermissionTagType(row.permission_level)" effect="dark" size="large">
            {{ getPermissionText(row.permission_level) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="created_at" label="创建时间" min-width="180">
        <template #default="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
      </el-table-column>

      <el-table-column prop="updated_at" label="更新时间" min-width="180">
        <template #default="{ row }">
          {{ formatDate(row.updated_at) }}
        </template>
      </el-table-column>

      <el-table-column label="操作" width="140" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="handleEdit(row)">
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="totalUsers"
        :page-sizes="[5, 10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>

    <!-- 编辑管理员信息对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="编辑管理员信息"
      width="600px"
      lock-scroll
      destroy-on-close
      close-on-click-modal
      close-on-press-escape
      append-to-body
    >
      <el-form :model="editForm" label-width="100px" :rules="rules" ref="formRef">
        <el-form-item label="OpenID">
          <el-input v-model="editForm.openid" disabled />
        </el-form-item>

        <el-form-item label="用户名" prop="username">
          <el-input v-model="editForm.username" placeholder="请输入用户名" />
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <el-input v-model="editForm.phone" placeholder="请输入手机号" />
        </el-form-item>

        <el-form-item label="新密码" prop="password">
          <el-input
            v-model="editForm.password"
            type="password"
            placeholder="不修改密码请留空"
            show-password
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="editForm.confirmPassword"
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
              <img v-if="editForm.avatar" :src="editForm.avatar" class="uploaded-avatar" />
              <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
            </el-upload>
            <div class="upload-tip">点击上传新头像 (支持 JPG、PNG、WEBP 格式，不超过 5MB)</div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveProfile" :loading="saveLoading">
            保存修改
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Edit, Plus } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import request from '@/logic/register.js'

console.log('[UserProfile] 组件脚本开始执行')

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const saveLoading = ref(false)
const dialogVisible = ref(false)

// 列表数据
const adminList = ref([])
const currentPage = ref(1)
const pageSize = ref(5)
const totalUsers = ref(0)
const totalPages = ref(0)

// 当前编辑的管理员
const currentAdmin = ref(null)

const editForm = ref({
  openid: '',
  username: '',
  phone: '',
  password: '',
  confirmPassword: '',
  avatar: '',
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

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未设置'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
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
  if (editForm.value.password && value !== editForm.value.password) {
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

// 获取管理员列表
const getAdminList = async () => {
  console.log('[UserProfile] getAdminList 开始执行')
  try {
    loading.value = true
    const url = `/user/Adminlist?page=${currentPage.value}&page_size=${pageSize.value}`
    console.log('[UserProfile] 请求URL:', url)

    const response = await request.get(url)

    // 调试：打印完整响应
    console.log('[UserProfile] API 响应:', response)
    console.log('[UserProfile] 响应类型:', typeof response)
    console.log('[UserProfile] response.data:', response.data)

    if (response.code === 200 && response.data) {
      // 兼容两种数据结构：data.results 或直接是数组
      if (Array.isArray(response.data)) {
        // 如果 data 直接是数组
        adminList.value = response.data
        totalUsers.value = response.data.length
        totalPages.value = 1
      } else if (response.data.results) {
        // 如果 data 包含 results 字段
        adminList.value = response.data.results || []
        totalUsers.value = response.data.total || 0
        totalPages.value = response.data.total_pages || 0
      } else {
        console.warn('[UserProfile] 未知的数据结构:', response.data)
        adminList.value = []
      }
      console.log('[UserProfile] 解析后的 adminList:', adminList.value)
    } else {
      console.warn('[UserProfile] 响应 code 不是 200 或没有 data:', response)
      // 尝试直接使用 response 作为数据（某些后端直接返回数据）
      if (Array.isArray(response)) {
        adminList.value = response
        totalUsers.value = response.length
        totalPages.value = 1
      }
    }
  } catch (error) {
    ElMessage.error('获取管理员列表失败')
    console.error('[UserProfile] 获取管理员列表失败:', error)
    if (error.response && error.response.status === 401) {
      router.push('/login')
    }
  } finally {
    loading.value = false
  }
}

// 处理编辑
const handleEdit = (row) => {
  currentAdmin.value = row
  editForm.value = {
    openid: row.openid,
    username: row.username || '',
    phone: row.phone || '',
    password: '',
    confirmPassword: '',
    avatar: row.avatar || '',
  }
  dialogVisible.value = true
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
      editForm.value.avatar = baseURL + response.data.path
      ElMessage.success('头像上传成功')
    } else {
      ElMessage.error('头像上传失败')
    }
  } catch (error) {
    ElMessage.error('头像上传失败')
    console.error('头像上传失败:', error)
  }
}

// 保存管理员信息
const saveProfile = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      saveLoading.value = true
      const updateData = {
        username: editForm.value.username,
        phone: editForm.value.phone,
        avatar: editForm.value.avatar,
      }

      // 如果有输入密码，则包含密码字段
      if (editForm.value.password) {
        updateData.password = editForm.value.password
      }

      // 使用 openid 作为查询参数
      await request.put(`/user/Adminlist?openid=${editForm.value.openid}`, updateData)

      ElMessage.success('管理员信息修改成功')
      dialogVisible.value = false
      await getAdminList() // 刷新列表
    } catch (error) {
      ElMessage.error('修改失败')
      console.error('修改失败:', error)
    } finally {
      saveLoading.value = false
    }
  })
}

// 处理页码变化
const handlePageChange = (page) => {
  currentPage.value = page
  getAdminList()
}

// 处理每页数量变化
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  getAdminList()
}

// 组件挂载时获取列表
onMounted(() => {
  console.log('[UserProfile] onMounted 触发')
  getAdminList()
})

// 立即执行一次（防止懒加载导致 onMounted 不触发）
console.log('[UserProfile] 立即调用 getAdminList')
getAdminList()
</script>

<style scoped>
.user-management {
  padding: 25px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px 28px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
  flex-shrink: 0;
}

.page-header:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 48px 0 rgba(0, 0, 0, 0.15);
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
  letter-spacing: 0.5px;
}

.header-info {
  display: flex;
  gap: 20px;
  align-items: center;
  font-size: 15px;
  color: rgba(0, 0, 0, 0.65);
  font-weight: 500;
}

.admin-table {
  flex: 1;
  width: 100% !important;
  max-width: 100% !important;
  min-height: 200px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-sizing: border-box;
}

:deep(.el-table__header-wrapper),
:deep(.el-table__body-wrapper) {
  width: 100% !important;
  overflow-x: auto;
}

:deep(.table-header th) {
  background: rgba(168, 216, 255, 0.25);
  backdrop-filter: blur(10px);
  color: rgba(0, 0, 0, 0.85);
  font-weight: 600;
  font-size: 15px;
  padding: 16px 0;
  height: 60px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

:deep(.el-table) {
  background: transparent;
  font-size: 15px;
  width: 100%;
}

:deep(.el-table tr) {
  background: rgba(255, 255, 255, 0.03);
}

:deep(.el-table td) {
  padding: 18px 0;
  font-size: 15px;
  color: rgba(0, 0, 0, 0.85);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
  background: rgba(255, 255, 255, 0.06);
}

:deep(.el-table__body tr:hover > td) {
  background: rgba(168, 216, 255, 0.15) !important;
}

:deep(.el-tag) {
  font-size: 14px;
  padding: 8px 16px;
  font-weight: 500;
  backdrop-filter: blur(5px);
}

.pagination-container {
  margin-top: 24px;
  display: flex;
  justify-content: center;
  padding: 18px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.pagination-container:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 48px 0 rgba(0, 0, 0, 0.15);
}

:deep(.el-pagination) {
  font-weight: 500;
  font-size: 14px;
}

:deep(.el-pagination .el-pager li) {
  font-size: 14px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  transition: all 0.3s ease;
}

:deep(.el-pagination .el-pager li:hover) {
  background: rgba(168, 216, 255, 0.2);
  transform: translateY(-1px);
}

:deep(.el-pagination .el-pager li.is-active) {
  background: linear-gradient(45deg, #409eff, #60acff);
  color: #000;
  font-weight: bold;
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
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(0, 0, 0, 0.7);
}

:deep(.el-button--default:hover) {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  color: rgba(0, 0, 0, 0.85);
  transform: translateY(-1px);
}

/* 弹窗样式 */
:deep(.el-dialog) {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.2);
  max-width: 90vw;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

:deep(.el-dialog__wrapper) {
  transition: opacity 0.3s ease;
}

:deep(.el-dialog__header) {
  flex-shrink: 0;
}

:deep(.el-dialog__body) {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  color: rgba(0, 0, 0, 0.85);
}

:deep(.el-dialog__footer) {
  flex-shrink: 0;
  padding: 16px 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

:deep(.el-dialog__title) {
  color: rgba(0, 0, 0, 0.85);
  font-size: 18px;
  font-weight: 600;
}

:deep(.el-form-item__label) {
  color: rgba(0, 0, 0, 0.75);
  font-weight: 500;
}

:deep(.el-input__inner) {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(0, 0, 0, 0.9);
  transition: all 0.3s ease;
  border-radius: 8px;
  caret-color: #409eff;
}

:deep(.el-input__inner:hover) {
  border-color: rgba(255, 255, 255, 0.2);
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
  background-color: rgba(255, 255, 255, 0.02) !important;
  color: rgba(0, 0, 0, 0.4) !important;
  border-color: rgba(255, 255, 255, 0.05) !important;
}

/* 头像上传 */
.avatar-upload {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.avatar-uploader {
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;
  width: 150px;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.03);
}

.avatar-uploader:hover {
  border-color: #409eff;
  background: rgba(255, 255, 255, 0.05);
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
}
</style>
