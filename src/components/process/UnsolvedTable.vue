<template>
  <div class="unsolved-panel">
    <!-- 派单筛选开关 -->
    <div class="filter-section">
      <span class="filter-label">派单状态：</span>
      <el-radio-group
        v-model="dispatchFilter"
        @change="handleDispatchFilterChange"
        class="filter-radio-group"
      >
        <el-radio-button :value="0">全部</el-radio-button>
        <el-radio-button :value="1">未派单</el-radio-button>
        <el-radio-button :value="2">已派单</el-radio-button>
      </el-radio-group>
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
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
          <el-button
            v-if="!scope.row.is_dispatched"
            type="success"
            size="small"
            @click.stop="handleDispatch(scope.row)"
            class="mr-10"
          >
            派单
          </el-button>
          <el-button type="primary" size="small" @click.stop="handleProcess(scope.row)">
            处理
          </el-button>
        </template>
      </el-table-column>
      <!-- 空状态显示 -->
      <template #empty>
        <div class="empty-state">
          <el-empty description="暂无数据" />
        </div>
      </template>
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

    <!-- Form detail dialog (只读) -->
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

        <!-- 处理状态 -->
        <div class="status-info mt-20">
          <el-tag type="info">未处理</el-tag>
          <el-tag v-if="currentForm.feedback_need" type="warning" class="ml-10"> 需要回访 </el-tag>
        </div>
      </div>
    </el-dialog>

    <!-- 处理表单对话框 -->
    <el-dialog
      v-model="processDialogVisible"
      title="处理表单"
      width="60%"
      destroy-on-close
      @close="resetProcessForm"
    >
      <div v-if="currentForm" class="process-dialog">
        <!-- 显示表单完整信息 -->
        <div class="form-info-summary">
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

          <!-- 用户图片展示 -->
          <div v-if="currentForm.images && currentForm.images.length" class="mt-20">
            <h4 style="margin-bottom: 10px">用户图片：</h4>
            <div class="image-container">
              <el-image
                v-for="(img, index) in currentForm.images"
                :key="index"
                :src="imageBaseUrl + img.image"
                :preview-src-list="currentForm.images.map((i) => imageBaseUrl + i.image)"
                :initial-index="index"
                fit="contain"
                class="small-image"
                preview-teleported
              />
            </div>
          </div>
        </div>

        <!-- 处理表单 -->
        <el-form
          ref="processFormRef"
          :model="processForm"
          :rules="processRules"
          label-width="100px"
          class="mt-20"
        >
          <el-form-item label="处理人姓名" prop="name">
            <el-input v-model="processForm.name" placeholder="请输入处理人姓名" />
          </el-form-item>

          <el-form-item label="联系电话" prop="phone">
            <el-input v-model="processForm.phone" placeholder="请输入联系电话" />
          </el-form-item>

          <el-form-item label="处理方式" prop="way">
            <el-input v-model="processForm.way" placeholder="如：线下解决、电话沟通等" />
          </el-form-item>

          <el-form-item label="处理内容" prop="content">
            <el-input
              v-model="processForm.content"
              type="textarea"
              :rows="4"
              placeholder="请详细描述处理过程和结果"
            />
          </el-form-item>

          <el-form-item label="处理图片">
            <div class="upload-section">
              <el-upload
                :auto-upload="false"
                :on-change="handleImageChange"
                :on-remove="handleImageRemove"
                list-type="picture-card"
                accept="image/*"
                :file-list="uploadFileList"
              >
                <el-icon><Plus /></el-icon>
              </el-upload>
              <div class="upload-tip">
                可上传处理过程中的图片（可选），支持 JPG、PNG、WEBP 格式，不超过 5MB
              </div>
            </div>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="processDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitProcess" :loading="submitting">
            提交处理
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 派单对话框 -->
    <el-dialog v-model="dispatchDialogVisible" title="选择派单人员" width="50%" destroy-on-close>
      <div class="dispatch-dialog">
        <el-table
          :data="adminList"
          style="width: 100%"
          highlight-current-row
          @current-change="handleAdminSelect"
          max-height="400"
        >
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="openid" label="OpenID" width="150" />
          <el-table-column prop="phone" label="手机号" width="150" />
          <el-table-column label="权限等级" width="100">
            <template #default="scope">
              <el-tag v-if="scope.row.permission_level === 1" type="info">普通管理员</el-tag>
              <el-tag v-else-if="scope.row.permission_level === 4" type="danger">物业人员</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="创建时间" width="180">
            <template #default="scope">
              {{ formatTime(scope.row.created_at) }}
            </template>
          </el-table-column>
        </el-table>
        <div class="admin-pagination">
          <el-pagination
            background
            :current-page="adminPage"
            :page-size="adminPageSize"
            :total="adminTotal"
            layout="total, prev, pager, next"
            @current-change="handleAdminPageChange"
          ></el-pagination>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dispatchDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            @click="submitDispatch"
            :loading="dispatching"
            :disabled="!selectedAdminOpenid"
          >
            确定派单
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
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
const processDialogVisible = ref(false)
const currentForm = ref(null)
const submitting = ref(false)
const processFormRef = ref(null)
const uploadFileList = ref([])
const uploadedImages = ref([])

// 派单相关
const dispatchFilter = ref(0) // 0: 全部, 1: 未派单, 2: 已派单
const dispatchDialogVisible = ref(false)
const dispatching = ref(false)
const currentDispatchForm = ref(null)
const selectedAdminOpenid = ref('')
const adminList = ref([])
const adminTotal = ref(0)
const adminPage = ref(1)
const adminPageSize = ref(5)

const imageBaseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, '')

const typeMap = {
  complaint: '投诉',
  suggest: '建议',
}

// 用户信息
const userInfo = ref({
  username: '',
  phone: '',
})

// 处理表单数据
const processForm = ref({
  name: '',
  phone: '',
  way: '',
  content: '',
  handle_images: [],
})

// 表单验证规则
const processRules = {
  name: [{ required: true, message: '请输入处理人姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '请输入正确的手机号码',
      trigger: 'blur',
    },
  ],
  way: [{ required: true, message: '请输入处理方式', trigger: 'blur' }],
  content: [{ required: true, message: '请输入处理内容', trigger: 'blur' }],
}

// 获取未处理表单列表
const fetchForms = async () => {
  try {
    let url = `/proceed/admin_form?page=${currentPage.value}&page_size=${pageSize.value}&finish=0`

    // 添加派单筛选参数
    if (dispatchFilter.value === 1) {
      url += '&is_dispatch=0'
    } else if (dispatchFilter.value === 2) {
      url += '&is_dispatch=1'
    }

    const response = await request.get(url)
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
      // 判断是否为"表单不存在"错误，如果是则只显示空状态，不报错
      if (response.message !== '出现错误：表单不存在') {
        ElMessage.error(response.message || '获取表单列表失败')
      } else {
        // 表单不存在时，清空列表并让表格显示空状态
        formList.value = []
        total.value = 0
      }
    }
  } catch (error) {
    // 判断是否为"表单不存在"错误，如果是则只显示空状态，不报错
    if (error.response?.data?.message !== '出现错误：表单不存在') {
      ElMessage.error('获取表单列表失败')
      console.error('Failed to fetch forms:', error)
    } else {
      // 表单不存在时，清空列表并让表格显示空状态
      formList.value = []
      total.value = 0
    }
  }
}

// 处理派单筛选变化
const handleDispatchFilterChange = () => {
  currentPage.value = 1
  fetchForms()
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
  // 如果是ISO格式的时间字符串（如管理员创建时间），直接格式化
  if (typeof timestamp === 'string' && timestamp.includes('T')) {
    return dayjs(timestamp).tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss')
  }
  // 如果是Unix时间戳，转换为日期时间
  return dayjs.unix(timestamp).tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss')
}

// 点击行查看详情
const handleRowClick = async (row) => {
  try {
    const response = await request.get(`/proceed/admin_form?uuid=${row.uuidx}`)
    if (response.code === 200 && response.data.length > 0) {
      currentForm.value = response.data[0]
      dialogVisible.value = true
    } else if (response.message !== '出现错误：表单不存在') {
      ElMessage.error('获取详细信息失败')
    }
  } catch (error) {
    if (error.response?.data?.message !== '出现错误：表单不存在') {
      ElMessage.error('获取详细信息失败')
      console.error('Failed to fetch form details:', error)
    }
  }
}

// 点击处理按钮
const handleProcess = async (row) => {
  try {
    const response = await request.get(`/proceed/admin_form?uuid=${row.uuidx}`)
    if (response.code === 200 && response.data.length > 0) {
      currentForm.value = response.data[0]
      // 使用用户信息填充默认值
      processForm.value.name = userInfo.value.username
      processForm.value.phone = userInfo.value.phone
      processDialogVisible.value = true
    } else if (response.message !== '出现错误：表单不存在') {
      ElMessage.error('获取详细信息失败')
    }
  } catch (error) {
    if (error.response?.data?.message !== '出现错误：表单不存在') {
      ElMessage.error('获取详细信息失败')
      console.error('Failed to fetch form details:', error)
    }
  }
}

// 处理图片选择
const handleImageChange = async (file) => {
  const rawFile = file.raw

  // 验证文件
  const isImage = rawFile.type.startsWith('image/')
  const isLt5M = rawFile.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    uploadFileList.value = uploadFileList.value.filter((f) => f.uid !== file.uid)
    return
  }
  if (!isLt5M) {
    ElMessage.error('上传图片大小不能超过 5MB!')
    uploadFileList.value = uploadFileList.value.filter((f) => f.uid !== file.uid)
    return
  }

  // 上传文件
  try {
    const formData = new FormData()
    formData.append('file', rawFile)

    const response = await request.post('proceed/upload_image', formData)

    if (response.code === 200 && response.data && response.data.path) {
      uploadedImages.value.push({
        uid: file.uid,
        path: response.data.path,
      })
      // 使用返回的message或默认消息
      ElMessage.success(response.data.message || '图片上传成功')
    } else {
      ElMessage.error(response.message || '图片上传失败')
      uploadFileList.value = uploadFileList.value.filter((f) => f.uid !== file.uid)
    }
  } catch (error) {
    ElMessage.error('图片上传失败')
    console.error('图片上传失败:', error)
    uploadFileList.value = uploadFileList.value.filter((f) => f.uid !== file.uid)
  }
}

// 处理图片移除
const handleImageRemove = (file) => {
  uploadedImages.value = uploadedImages.value.filter((img) => img.uid !== file.uid)
}

// 提交处理
const submitProcess = async () => {
  if (!processFormRef.value) return

  await processFormRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      submitting.value = true

      // 构建提交数据
      const submitData = {
        phone: processForm.value.phone,
        name: processForm.value.name,
        way: processForm.value.way,
        content: processForm.value.content,
      }

      // 如果有上传的图片，添加到提交数据中
      if (uploadedImages.value.length > 0) {
        submitData.handle_images = uploadedImages.value.map((img) => img.path)
      }
      console.log(submitData)
      const response = await request.put(
        `/proceed/admin_form?uuid=${currentForm.value.uuidx}`,
        JSON.stringify(submitData),
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )

      if (response.code === 200) {
        ElMessage.success('处理成功')
        processDialogVisible.value = false
        // 刷新列表
        await fetchForms()
      } else {
        ElMessage.error(response.message || '处理失败')
      }
    } catch (error) {
      ElMessage.error('处理失败')
      console.error('Failed to process form:', error)
    } finally {
      submitting.value = false
    }
  })
}

// 重置处理表单
const resetProcessForm = () => {
  processForm.value = {
    name: '',
    phone: '',
    way: '',
    content: '',
    handle_images: [],
  }
  uploadFileList.value = []
  uploadedImages.value = []
  if (processFormRef.value) {
    processFormRef.value.resetFields()
  }
}

// 获取用户信息
const getUserInfo = async () => {
  try {
    const response = await request.get('/user/UserInfo')
    if (response.code === 200 && response.data && response.data.length > 0) {
      userInfo.value = {
        username: response.data[0].username,
        phone: response.data[0].phone,
      }
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

// 获取管理员列表
const fetchAdminList = async () => {
  try {
    const response = await request.get(
      `/user/Adminlist?page=${adminPage.value}&page_size=${adminPageSize.value}`,
    )
    if (response.code === 200) {
      // 只筛选 permission_level 为 1 和 4 的管理员
      adminList.value = (response.data.results || []).filter(
        (admin) => admin.permission_level === 1 || admin.permission_level === 4,
      )
      adminTotal.value = adminList.value.length
    } else {
      ElMessage.error(response.message || '获取管理员列表失败')
    }
  } catch (error) {
    ElMessage.error('获取管理员列表失败')
    console.error('Failed to fetch admin list:', error)
  }
}

// 管理员列表分页变化
const handleAdminPageChange = (page) => {
  adminPage.value = page
  fetchAdminList()
}

// 打开派单对话框
const handleDispatch = (row) => {
  currentDispatchForm.value = row
  selectedAdminOpenid.value = ''
  adminPage.value = 1
  fetchAdminList()
  dispatchDialogVisible.value = true
}

// 选择管理员
const handleAdminSelect = (row) => {
  selectedAdminOpenid.value = row.openid
}

// 提交派单
const submitDispatch = async () => {
  if (!currentDispatchForm.value || !selectedAdminOpenid.value) {
    ElMessage.warning('请选择要派单的管理员')
    return
  }

  try {
    dispatching.value = true
    const response = await request.post(
      `/proceed/dispatch_order?openid=${selectedAdminOpenid.value}&uuidx=${currentDispatchForm.value.uuidx}`,
    )

    if (response.code === 200) {
      ElMessage.success('派单成功')
      dispatchDialogVisible.value = false
      // 刷新表单列表
      await fetchForms()
    } else {
      ElMessage.error(response.message || '派单失败')
    }
  } catch (error) {
    ElMessage.error('派单失败')
    console.error('Failed to dispatch order:', error)
  } finally {
    dispatching.value = false
  }
}

// Lifecycle
onMounted(() => {
  getUserInfo()
  fetchForms()
})
</script>

<style scoped>
.unsolved-panel {
  background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 20px;
  flex: 1;
  overflow-y: auto;
  transition: all 0.3s ease;
}

.filter-section {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  background-color: white;
  padding: 15px 20px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.filter-label {
  font-size: 14px;
  color: #606266;
  margin-right: 15px;
  font-weight: 500;
}

.filter-radio-group {
  flex: 1;
}

:deep(.filter-radio-group .el-radio-button__inner) {
  padding: 8px 20px;
  font-size: 14px;
}

:deep(.filter-radio-group .el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background-color: #409eff;
  border-color: #409eff;
  color: white;
}

.mr-10 {
  margin-right: 10px;
}

.dispatch-dialog {
  padding: 10px 0;
}

.admin-pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

:deep(.el-table__row.current-row) {
  background-color: #ecf5ff;
}

.unsolved-panel:hover {
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

.process-dialog {
  max-height: 60vh;
  overflow-y: auto;
}

.form-info-summary {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.small-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.small-image:hover {
  transform: scale(1.05);
}

.upload-section {
  width: 100%;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
  line-height: 1.5;
}

:deep(.el-upload-list--picture-card .el-upload-list__item) {
  width: 120px;
  height: 120px;
}

:deep(.el-upload--picture-card) {
  width: 120px;
  height: 120px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-table__row) {
  cursor: pointer;
  transition: background-color 0.3s ease;
}

:deep(.el-table__row:hover) {
  background-color: #f5f7fa;
}

.empty-state {
  padding: 40px 0;
}
</style>
