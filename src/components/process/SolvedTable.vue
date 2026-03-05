<template>
  <div class="solved-panel">
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

    <!-- Form detail dialog (只读查看) -->
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

        <!-- 回访总结 -->
        <el-descriptions v-if="currentForm.feedback_summary" class="mt-20" :column="1" border>
          <el-descriptions-item label="回访总结">
            {{ currentForm.feedback_summary }}
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

const imageBaseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, '')

const typeMap = {
  complaint: '投诉',
  suggest: '建议',
}

// 获取已处理表单列表 (假设使用 handle=1 参数)
const fetchForms = async () => {
  try {
    const response = await request.get(
      `/proceed/admin_form?page=${currentPage.value}&page_size=${pageSize.value}&finish=2`,
    )
    if (response?.code === 200) {
      formList.value = response?.data?.results || []
      total.value = response?.data?.total || 0
      // 确保当前页码不超过总页数
      const maxPage = Math.ceil(total.value / pageSize.value)
      if (currentPage.value > maxPage && maxPage > 0) {
        currentPage.value = maxPage
        await fetchForms()
      }
      return
    }

    // 404 视为空数据（不报错）
    if (response?.code === 404) {
      formList.value = []
      total.value = 0
      return
    }

    // 其他非200也按空数据处理，不在页面报错
    formList.value = []
    total.value = 0
  } catch (error) {
    // axios 抛错场景：404 视为空数据（不报错）
    if (error?.response?.status === 404) {
      formList.value = []
      total.value = 0
      return
    }

    // 其他错误也不在页面弹错
    console.error('Failed to fetch forms:', error)
    formList.value = []
    total.value = 0
  }
}

const handleCurrentChange = async (val = 1) => {
  currentPage.value = val
  await fetchForms()
}

const handleSizeChange = async (val) => {
  pageSize.value = val
  currentPage.value = 1
  await fetchForms()
}

const formatTime = (timestamp) => {
  return dayjs.unix(timestamp).tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss')
}

// 点击行查看详情
const handleRowClick = async (row) => {
  try {
    const response = await request.get(`/proceed/admin_form?uuid=${row.uuidx}`)
    if (response?.code === 200 && Array.isArray(response?.data) && response.data.length > 0) {
      currentForm.value = response.data[0]
      dialogVisible.value = true
      return
    }

    // 404/空数据：静默处理，不弹错误
  } catch (error) {
    if (error?.response?.status !== 404) {
      console.error('Failed to fetch form details:', error)
    }
  }
}

// Lifecycle
onMounted(() => {
  fetchForms()
})
</script>

<style scoped>
.solved-panel {
  background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 20px;
  flex: 1;
  overflow-y: auto;
  transition: all 0.3s ease;
}

.solved-panel:hover {
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  position: relative;
  z-index: 10;
}

:deep(.el-pagination) {
  position: relative;
  z-index: 11;
}

:deep(.el-pagination button) {
  position: relative;
  z-index: 12;
  pointer-events: auto !important;
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

:deep(.el-table__row) {
  cursor: pointer;
  transition: background-color 0.3s ease;
}

:deep(.el-table__row:hover) {
  background-color: #f5f7fa;
}
</style>
