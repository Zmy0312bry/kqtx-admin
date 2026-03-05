<template>
  <div class="history-panel">
    <!-- Date selection for Excel download -->
    <div class="download-section">
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="-"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD"
        :disabled-date="disableFutureDates"
      />
      <el-button type="primary" @click="downloadExcel" :loading="downloading">
        下载Excel
      </el-button>
    </div>

    <!-- Form data table -->
    <el-table :data="formList" style="width: 100%" @row-click="handleRowClick">
      <el-table-column prop="serial_number" label="表单编号" width="120" />
      <el-table-column prop="title" label="标题" />
      <el-table-column prop="type" label="类型" width="100">
        <template #default="scope">
          {{ typeMap[scope.row.type] }}
        </template>
      </el-table-column>
      <el-table-column label="提交时间" width="180">
        <template #default="scope">
          {{ formatTime(scope.row.upload_time) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="scope">
          <el-button type="danger" size="small" @click.stop="confirmDelete(scope.row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Pagination -->
    <div class="pagination-container">
      <el-pagination
        background
        :current-page="currentPage"
        :page-size="pageSize"
        :page-sizes="[10, 15, 20, 30]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      ></el-pagination>
    </div>
    <!-- 删除确认对话框 -->
    <el-dialog v-model="deleteDialogVisible" title="确认删除" width="30%" destroy-on-close>
      <div>确定要删除这条表单记录吗？该操作不可撤销。</div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="deleteForm" :loading="deleting"> 确认删除 </el-button>
        </span>
      </template>
    </el-dialog>
    <!-- Form detail dialog -->
    <el-dialog v-model="dialogVisible" title="表单详情" width="60%" destroy-on-close>
      <div v-if="currentForm" class="form-detail">
        <!-- 基本信息 -->
        <el-descriptions :column="2" border>
          <el-descriptions-item label="表单编号">
            {{ currentForm.serial_number }}
          </el-descriptions-item>
          <el-descriptions-item label="类型">
            {{ typeMap[currentForm.type] }}
          </el-descriptions-item>
          <el-descriptions-item label="类别">
            {{ currentForm.category }}
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">
            {{ formatTime(currentForm.upload_time) }}
          </el-descriptions-item>
          <el-descriptions-item label="标题" :span="2">
            {{ currentForm.title }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 投诉人/建议人信息 -->
        <el-descriptions class="mt-20" :column="2" border>
          <el-descriptions-item :label="currentForm.type === 'complaint' ? '投诉人' : '建议人'">
            {{ currentForm.name }}
          </el-descriptions-item>
          <el-descriptions-item label="联系电话">
            {{ currentForm.phone }}
          </el-descriptions-item>
          <el-descriptions-item label="地点" :span="2">
            {{ currentForm.address }}
          </el-descriptions-item>
          <el-descriptions-item
            :label="currentForm.type === 'complaint' ? '投诉内容' : '建议内容'"
            :span="2"
          >
            {{ currentForm.content }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 图片展示 -->
        <div v-if="currentForm.images && currentForm.images.length" class="mt-20">
          <h3>用户图片：</h3>
          <div class="image-container">
            <el-image
              v-for="(img, index) in currentForm.images"
              :key="index"
              :src="imageBaseUrl + img.image"
              :preview-src-list="currentForm.images.map((i) => imageBaseUrl + i.image)"
              :initial-index="index"
              fit="contain"
              class="detail-image"
              preview-teleported
            />
          </div>
        </div>
        <div v-if="currentForm.handle_images && currentForm.handle_images.length" class="mt-20">
          <h3>管理员图片：</h3>
          <div class="image-container">
            <el-image
              v-for="(img, index) in currentForm.handle_images"
              :key="index"
              :src="imageBaseUrl + img.image"
              :preview-src-list="currentForm.handle_images.map((i) => imageBaseUrl + i.image)"
              :initial-index="index"
              fit="contain"
              class="detail-image"
              preview-teleported
            />
          </div>
        </div>

        <!-- 处理信息 -->
        <el-descriptions v-if="currentForm.handle !== 0" class="mt-20" :column="2" border>
          <el-descriptions-item label="处理人">
            {{ currentForm.admin_name || '暂无' }}
          </el-descriptions-item>
          <el-descriptions-item label="处理时间">
            {{ currentForm.handle_time ? formatTime(currentForm.handle_time) : '暂无' }}
          </el-descriptions-item>
          <el-descriptions-item label="处理方式">
            {{ currentForm.admin_way || '暂无' }}
          </el-descriptions-item>
          <el-descriptions-item label="联系电话">
            {{ currentForm.admin_phone || '暂无' }}
          </el-descriptions-item>
          <el-descriptions-item label="处理内容" :span="2">
            {{ currentForm.admin_content || '暂无' }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 处理状态 -->
        <div class="status-info mt-20">
          <el-tag
            :type="
              currentForm.handle === 0 ? 'info' : currentForm.handle === 1 ? 'warning' : 'success'
            "
          >
            {{
              currentForm.handle === 0 ? '未处理' : currentForm.handle === 1 ? '处理中' : '已处理'
            }}
          </el-tag>
          <el-tag v-if="currentForm.feedback_need" type="warning" class="ml-10"> 需要回访 </el-tag>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { request } from '../../logic/register'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

// Data
const formList = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const currentForm = ref(null)
const dateRange = ref([])
const downloading = ref(false)

const imageBaseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, '')

const typeMap = {
  complaint: '投诉',
  suggest: '建议',
}
// 在 Data 部分添加
const deleteDialogVisible = ref(false)
const currentDeleteForm = ref(null)
const deleting = ref(false)

// 添加确认删除方法
const confirmDelete = (row) => {
  currentDeleteForm.value = row
  deleteDialogVisible.value = true
}

// 添加删除表单方法
const deleteForm = async () => {
  if (!currentDeleteForm.value) return

  deleting.value = true
  try {
    const response = await request.delete(
      `/proceed/admin_form?uuid=${currentDeleteForm.value.uuidx}`,
    )

    if (response.code === 200) {
      ElMessage.success('删除成功')
      // 刷新表单列表
      await fetchForms()
      deleteDialogVisible.value = false
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error) {
    ElMessage.error('删除失败')
    console.error('Failed to delete form:', error)
  } finally {
    deleting.value = false
  }
}

const fetchForms = async () => {
  try {
    const response = await request.get(
      `/proceed/admin_form?page=${currentPage.value}&page_size=${pageSize.value}`,
    )
    if (response.code === 200) {
      formList.value = response.data.results || []
      total.value = response.data.total || 0
      // 确保当前页码不超过总页数
      const maxPage = Math.ceil(total.value / pageSize.value)
      if (currentPage.value > maxPage && maxPage > 0) {
        currentPage.value = maxPage
        await fetchForms()
      }
    } else {
      ElMessage.error(response.message || '获取表单列表失败')
    }
  } catch (error) {
    ElMessage.error('获取表单列表失败')
    console.error('Failed to fetch forms:', error)
  }
}
const handleCurrentChange = async (val = 1) => {
  console.log('页码改变:', val)
  currentPage.value = val
  await fetchForms()
}

const handleSizeChange = async (val) => {
  pageSize.value = val
  currentPage.value = 1 // 切换每页显示数量时重置到第一页
  await fetchForms()
}
const formatTime = (timestamp) => {
  return dayjs.unix(timestamp).tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss')
}

const handleRowClick = async (row) => {
  try {
    const response = await request.get(`/proceed/admin_form?uuid=${row.uuidx}`)
    if (response.code === 200 && response.data.length > 0) {
      currentForm.value = response.data[0]
      dialogVisible.value = true
    } else {
      ElMessage.error('获取详细信息失败')
    }
  } catch (error) {
    ElMessage.error('获取详细信息失败')
    console.error('Failed to fetch form details:', error)
  }
}

const downloadExcel = async () => {
  if (!dateRange.value || dateRange.value.length !== 2) {
    ElMessage.warning('请选择日期范围')
    return
  }

  downloading.value = true
  try {
    const [startDate, endDate] = dateRange.value
    const dateFormData = {
      start_time: dayjs(startDate).format('YYYY-MM-DD'),
      end_time: dayjs(endDate).format('YYYY-MM-DD'),
    }
    const response = await request.post(`/proceed/excel_get`, dateFormData, {
      responseType: 'blob',
    })

    const url = window.URL.createObjectURL(new Blob([response]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `导出数据_${startDate}_${endDate}.xlsx`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
    console.error('Failed to download excel:', error)
  } finally {
    downloading.value = false
  }
}
const disableFutureDates = (time) => {
  return time.getTime() > Date.now()
}
// Lifecycle
onMounted(() => {
  fetchForms()
})
</script>

<style scoped>
.history-panel {
  background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 20px;
  padding-top: 30px;
  flex: 1;
  overflow-y: auto;
  transition: all 0.3s ease;
}

.history-panel:hover {
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
}

.download-section {
  margin-bottom: 20px;
  display: flex;
  max-width: 40%;
  align-items: center;
  justify-content: flex-end;
  font-size: large;
  gap: 16px;
  position: relative;
  z-index: 10; /* 增加z-index使下载区域在上层 */
}

/* 为下载区域内的按钮和日期选择器添加样式 */
:deep(.download-section .el-button),
:deep(.download-section .el-date-editor) {
  position: relative;
  z-index: 11;
  pointer-events: auto !important; /* 确保可点击 */
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  position: relative;
  z-index: 10;
  /* 增加z-index确保分页组件在顶层 */
}

/* 调整分页组件中各元素的层级 */
:deep(.el-pagination) {
  position: relative;
  z-index: 11;
}

:deep(.el-pagination button) {
  position: relative;
  z-index: 12;
  pointer-events: auto !important;
  /* 确保按钮可点击 */
}

:deep(.el-pagination .el-pager li) {
  position: relative;
  z-index: 12;
  pointer-events: auto !important;
}

.form-detail pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 300px;
  overflow-y: auto;
}

.mt-20 {
  margin-top: 20px;
}

.ml-10 {
  margin-left: 10px;
}

.image-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.detail-image {
  width: 200px;
  height: 200px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.detail-image:hover {
  transform: scale(1.05);
}

.status-info {
  display: flex;
  gap: 10px;
  align-items: center;
}
</style>
