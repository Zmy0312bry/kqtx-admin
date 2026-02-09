<template>
  <div class="phone-list">
    <div class="add-section">
      <el-button type="primary" @click="showAddDialog">添加电话</el-button>
    </div>
    <el-table :data="phoneList" style="width: 100%">
      <el-table-column prop="phone_name" label="姓名">
        <template #default="{ row }">
          <el-input v-if="row.isEdit" v-model="row.phone_name" size="small" />
          <span v-else>{{ row.phone_name }}</span>
        </template>
      </el-table-column>

      <el-table-column prop="phone_number" label="电话">
        <template #default="{ row }">
          <el-input v-if="row.isEdit" v-model="row.phone_number" size="small" />
          <span v-else>{{ row.phone_number }}</span>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button
            v-if="row.isEdit"
            type="success"
            size="small"
            @click="savePhone(row)"
            :loading="loading"
          >
            保存
          </el-button>
          <el-button v-else type="primary" size="small" @click="editPhone(row)"> 修改 </el-button>
          <el-button type="danger" size="small" @click="deletePhone(row)" :loading="loading">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-dialog v-model="dialogVisible" title="添加新电话" width="500px" lock-scroll>
      <el-form :model="newPhone" label-width="80px">
        <el-form-item label="姓名">
          <el-input v-model="newPhone.phone_name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="newPhone.phone_number" placeholder="请输入电话号码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="addPhone" :loading="loading"> 确定 </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'

import request from '../../logic/register.js'

const phoneList = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const router = useRouter()
const newPhone = ref({
  phone_name: '',
  phone_number: '',
})

// 获取电话列表
const getPhoneList = async () => {
  try {
    loading.value = true
    const response = await request.get('/community/phone_number')

    phoneList.value = response.data.map((item) => ({
      ...item,
      isEdit: false,
    }))
  } catch (error) {
    ElMessage.error('获取电话列表失败')
    console.error('获取电话列表失败:', error)
    router.push('/login')
  } finally {
    loading.value = false
  }
}

// 添加电话
const addPhone = async () => {
  if (!newPhone.value.phone_name || !newPhone.value.phone_number) {
    ElMessage.warning('请填写完整信息')
    return
  }
  try {
    loading.value = true
    await request.post('/community/phone_number', newPhone.value)
    ElMessage.success('添加成功')
    dialogVisible.value = false
    await getPhoneList() // 刷新列表
  } catch (error) {
    ElMessage.error('添加失败')
    console.error('添加失败:', error)
  } finally {
    loading.value = false
  }
}

// 编辑电话
const editPhone = (row) => {
  row.isEdit = true
  // 保存原始数据，用于取消编辑
  row.originalData = {
    phone_name: row.phone_name,
    phone_number: row.phone_number,
  }
}

// 保存电话
const savePhone = async (row) => {
  try {
    loading.value = true
    const apiUrl = `/community/phone_number?pk=${row.id}`
    await request.put(apiUrl, {
      phone_name: row.phone_name,
      phone_number: row.phone_number,
    })
    row.isEdit = false
    delete row.originalData
    ElMessage.success('修改成功')
  } catch (error) {
    // 恢复原始数据
    if (row.originalData) {
      row.phone_name = row.originalData.phone_name
      row.phone_number = row.originalData.phone_number
    }
    ElMessage.error('修改失败')
    console.error('修改失败:', error)
  } finally {
    loading.value = false
  }
}

// 删除电话
const deletePhone = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除这个电话吗？', '提示', {
      type: 'warning',
      lockScroll: true,
      customClass: 'custom-message-box',
    })

    loading.value = true
    await request.delete(`/community/phone_number?pk=${row.id}`)
    phoneList.value = phoneList.value.filter((item) => item.id !== row.id)
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error('删除失败:', error)
    }
  } finally {
    loading.value = false
  }
}

// 显示添加电话对话框
const showAddDialog = () => {
  newPhone.value = {
    phone_name: '',
    phone_number: '',
  }
  dialogVisible.value = true
}

// 组件加载时获取电话列表
onMounted(() => {
  getPhoneList()
})
</script>

<style scoped>
.phone-list {
  padding: 25px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.05);
  animation: fadeIn 0.5s ease-out;
  height: 80vh;
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

.add-section {
  margin-bottom: 25px;
}

:deep(.el-button) {
  margin-left: 12px;
  border-radius: 8px;
  padding: 10px 24px;
  font-weight: 500;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  font-size: 14px;
}

:deep(.el-button:first-child) {
  margin-left: 0;
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

:deep(.el-button--success) {
  background: linear-gradient(45deg, #67c23a, #85ce61);
  border: none;
}

:deep(.el-button--success:hover) {
  background: linear-gradient(45deg, #85ce61, #67c23a);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.3);
}

:deep(.el-button--danger) {
  background: linear-gradient(45deg, #f56c6c, #ff7875);
  border: none;
}

:deep(.el-button--danger:hover) {
  background: linear-gradient(45deg, #ff7875, #f56c6c);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.3);
}

:deep(.el-table) {
  background: transparent !important;
  border-radius: 8px;
  overflow: hidden;
  font-size: 15px;
}

:deep(.el-table::before) {
  display: none;
}

:deep(.el-table--enable-row-hover .el-table__body tr:hover > td) {
  background: rgba(255, 255, 255, 0.05) !important;
}

:deep(.el-table td),
:deep(.el-table th) {
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
  color: rgba(0, 0, 0, 0.9);
  padding: 18px 0;
  font-size: 15px;
}

:deep(.el-table th) {
  background: rgba(168, 216, 255, 0.25) !important;
  backdrop-filter: blur(10px);
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
  font-size: 15px;
  height: 60px;
}

:deep(.el-table__row) {
  transition: all 0.3s ease;
}

:deep(.el-table) {
  --el-table-text-color: rgba(0, 0, 0, 0.9);
  --el-table-header-text-color: rgba(0, 0, 0, 0.85);
  color: rgba(0, 0, 0, 0.9);
}

:deep(.el-table span) {
  color: rgba(0, 0, 0, 0.9);
  font-size: 15px;
}

/* 表格内的输入框样式 */
:deep(.el-table .el-input__inner) {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(0, 0, 0, 0.9);
  border-radius: 8px;
  transition: all 0.3s ease;
  font-size: 15px;
  caret-color: #409eff;
}

:deep(.el-table .el-input__inner:hover) {
  border-color: rgba(255, 255, 255, 0.2);
}

:deep(.el-table .el-input__inner:focus) {
  background: rgba(255, 255, 255, 0.08);
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

/* 弹窗样式 */
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
  font-size: 15px;
  font-weight: 500;
}

:deep(.el-input__inner) {
  color: rgba(0, 0, 0, 0.9) !important;
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 8px;
  transition: all 0.3s ease;
  font-size: 15px;
  caret-color: #409eff;
}

:deep(.el-input__inner:hover) {
  border-color: rgba(255, 255, 255, 0.2) !important;
}

:deep(.el-input__inner:focus) {
  background: rgba(255, 255, 255, 0.08) !important;
  border-color: #409eff !important;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

:deep(.el-input__inner::placeholder) {
  color: rgba(0, 0, 0, 0.3);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

/* 消息框样式 */
:deep(.custom-message-box) {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

:deep(.custom-message-box .el-message-box__title) {
  color: rgba(0, 0, 0, 0.85);
  font-size: 18px;
  font-weight: 600;
}

:deep(.custom-message-box .el-message-box__content) {
  color: rgba(0, 0, 0, 0.85);
  padding: 20px 0;
  font-size: 15px;
}

:deep(.custom-message-box .el-message-box__btns) {
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  padding-top: 15px;
}

:deep(.custom-message-box .el-message-box__btns .el-button) {
  font-weight: 500;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
}

:deep(.custom-message-box .el-overlay) {
  overflow: hidden;
}
</style>
