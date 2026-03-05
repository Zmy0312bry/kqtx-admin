<template>
  <div class="user-management">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>重点人员管理</h2>
      <div class="header-info">
        <span>共 {{ totalUsers }} 人</span>
      </div>
    </div>

    <!-- 重点人员列表表格 -->
    <el-table
      :data="importantUserList"
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

      <el-table-column prop="finished_forms_count" label="已完成表单" width="120" align="center">
        <template #default="{ row }">
          <span>{{ row.finished_forms_count }}</span>
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
          <el-button type="danger" size="small" @click="handleDelete(row)">
            <el-icon><Delete /></el-icon>
            删除
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

    <!-- 添加重点人员对话框 -->
    <el-dialog
      v-model="addDialogVisible"
      title="添加重点人员"
      width="500px"
      lock-scroll
      destroy-on-close
      close-on-click-modal
      close-on-press-escape
      append-to-body
    >
      <el-form :model="addForm" label-width="100px" :rules="addRules" ref="addFormRef">
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="addForm.phone" placeholder="请输入手机号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleAddUser" :loading="addLoading"> 添加 </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 添加按钮 -->
    <el-button type="primary" class="add-btn" @click="openAddDialog">
      <el-icon><Plus /></el-icon>
      添加重点人员
    </el-button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Plus } from '@element-plus/icons-vue'
import request from '@/logic/register.js'

console.log('[ImportantUser] 组件脚本开始执行')

const loading = ref(false)
const addLoading = ref(false)
const addDialogVisible = ref(false)
const importantUserList = ref([])
const currentPage = ref(1)
const pageSize = ref(16)
const totalUsers = ref(0)
const totalPages = ref(0)
const addFormRef = ref(null)

// 添加重点人员表单
const addForm = ref({
  phone: '',
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

// 格式化日期时间
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

// 表单验证规则
const addRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' },
  ],
}

// 获取重点人员列表
const getImportantUserList = async () => {
  console.log('[ImportantUser] getImportantUserList 开始执行')
  try {
    loading.value = true
    const response = await request.get('/user/important_users', {
      params: {
        page: currentPage.value,
        page_size: pageSize.value,
      },
    })

    console.log('[ImportantUser] API 响应:', response)

    if (response.code === 200 && response.data) {
      importantUserList.value = response.data.results || []
      totalUsers.value = response.data.total || 0
      totalPages.value = response.data.total_pages || 0
      console.log('[ImportantUser] 解析后的列表:', importantUserList.value)

      // 构建完整的头像URL
      importantUserList.value.forEach((user) => {
        if (user.avatar && !user.avatar.startsWith('http')) {
          let baseURL = import.meta.env.VITE_API_BASE_URL || ''
          baseURL = baseURL.replace(/\/api$/, '')
          user.avatar = baseURL + user.avatar
        }
      })
    } else {
      console.warn('[ImportantUser] 响应异常:', response)
      ElMessage.error('获取重点人员列表失败')
    }
  } catch (error) {
    ElMessage.error('获取重点人员列表失败')
    console.error('[ImportantUser] 获取重点人员列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 打开添加对话框
const openAddDialog = () => {
  addForm.value = {
    phone: '',
  }
  addDialogVisible.value = true
}

// 添加重点人员
const handleAddUser = async () => {
  if (!addFormRef.value) return

  await addFormRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      addLoading.value = true
      await request.post('/user/important_users', {
        phone: addForm.value.phone,
      })

      ElMessage.success('添加重点人员成功')
      addDialogVisible.value = false
      await getImportantUserList()
    } catch (error) {
      ElMessage.error('添加重点人员失败')
      console.error('添加重点人员失败:', error)
    } finally {
      addLoading.value = false
    }
  })
}

// 删除重点人员
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除重点人员 ${row.username || row.phone} 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await request.delete('/user/important_users', {
      data: {
        phone: row.phone,
      },
    })

    ElMessage.success('删除成功')
    await getImportantUserList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error('删除失败:', error)
    }
  }
}

// 页码变化
const handlePageChange = (page) => {
  currentPage.value = page
  getImportantUserList()
}

// 每页条数变化
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  getImportantUserList()
}

// 组件挂载时获取列表
onMounted(() => {
  console.log('[ImportantUser] onMounted 触发')
  getImportantUserList()
})

// 立即执行一次（防止懒加载导致 onMounted 不触发）
console.log('[ImportantUser] 立即调用 getImportantUserList')
getImportantUserList()
</script>

<style scoped>
.user-management {
  padding: 25px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.05);
  animation: fadeIn 0.5s ease-out;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
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

:deep(.el-button--danger) {
  background: linear-gradient(45deg, #f56c6c, #ff8a8a);
  border: none;
}

:deep(.el-button--danger:hover) {
  background: linear-gradient(45deg, #ff8a8a, #f56c6c);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.3);
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

.add-btn {
  position: absolute;
  bottom: 30px;
  right: 30px;
  padding: 12px 24px;
  font-size: 16px;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.3);
  z-index: 100;
}

.add-btn:hover {
  box-shadow: 0 6px 20px rgba(64, 158, 255, 0.4);
}

/* 对话框样式 */
:deep(.el-dialog) {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

:deep(.el-dialog__wrapper) {
  transition: opacity 0.3s ease;
}

:deep(.el-dialog__header) {
  flex-shrink: 0;
}

:deep(.el-dialog__body) {
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

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
