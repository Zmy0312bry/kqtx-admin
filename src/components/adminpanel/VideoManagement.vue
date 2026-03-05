<template>
  <div class="video-management">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>视频管理</h2>
      <el-button type="primary" @click="openAddDialog">
        <el-icon><Plus /></el-icon>
        新增视频
      </el-button>
    </div>

    <!-- 视频列表表格 -->
    <el-table
      :data="videoList"
      v-loading="loading"
      stripe
      class="video-table"
      header-row-class-name="table-header"
    >
      <el-table-column prop="title" label="标题" min-width="200" />

      <el-table-column prop="description" label="描述" min-width="300" show-overflow-tooltip />

      <el-table-column prop="uploaded_at" label="上传时间" min-width="180">
        <template #default="{ row }">
          {{ formatTime(row.uploaded_at) }}
        </template>
      </el-table-column>

      <el-table-column prop="updated_at" label="更新时间" min-width="180">
        <template #default="{ row }">
          {{ formatTime(row.updated_at) }}
        </template>
      </el-table-column>

      <el-table-column label="操作" width="320" fixed="right" align="center">
        <template #default="{ row }">
          <div class="action-buttons">
            <el-button type="primary" size="small" @click="handlePreview(row)">
              <el-icon><View /></el-icon>
              预览
            </el-button>
            <el-button type="warning" size="small" @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="totalVideos"
        :page-sizes="[5, 10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>

    <!-- 新增/编辑视频对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑视频' : '新增视频'"
      width="600px"
      lock-scroll
      destroy-on-close
      close-on-click-modal
      close-on-press-escape
      append-to-body
    >
      <el-form :model="videoForm" label-width="100px" :rules="rules" ref="formRef">
        <el-form-item label="视频标题" prop="title">
          <el-input v-model="videoForm.title" placeholder="请输入视频标题" />
        </el-form-item>

        <el-form-item label="视频描述">
          <el-input
            v-model="videoForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入视频描述（可选）"
          />
        </el-form-item>

        <el-form-item label="视频文件" prop="file_path" :required="!isEdit">
          <div class="video-upload">
            <el-upload
              class="video-uploader"
              :auto-upload="false"
              :show-file-list="false"
              :on-change="handleVideoChange"
              accept="video/*"
            >
              <div class="upload-placeholder" v-if="!videoForm.file_path">
                <el-icon class="upload-icon"><Plus /></el-icon>
                <div class="upload-text">点击上传视频</div>
                <div class="upload-tip">支持 MP4、WebM 格式，建议不超过100MB</div>
              </div>
              <div v-else class="uploaded-video">
                <video :src="getVideoUrl(videoForm.file_path)" class="video-preview" controls />
                <div class="video-info">已选择视频</div>
              </div>
            </el-upload>
          </div>
          <div class="upload-progress" v-if="uploadProgress > 0 && uploadProgress < 100">
            <el-progress :percentage="uploadProgress" />
            <div class="progress-text">{{ uploadStatusText }}</div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false" :disabled="submitLoading">取消</el-button>
          <el-button type="primary" @click="submitVideo" :loading="submitLoading">
            {{ isEdit ? '保存修改' : '提交' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 视频预览对话框 -->
    <el-dialog
      v-model="previewVisible"
      title="视频预览"
      width="800px"
      lock-scroll
      destroy-on-close
      append-to-body
    >
      <div class="preview-container" v-if="currentVideo">
        <video
          v-if="currentVideo.video_file"
          :src="getVideoUrl(currentVideo.video_file)"
          controls
          class="preview-video"
        />
        <div v-else class="preview-info">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="标题">
              {{ currentVideo.title }}
            </el-descriptions-item>
            <el-descriptions-item label="描述">
              {{ currentVideo.description || '无' }}
            </el-descriptions-item>
            <el-descriptions-item label="上传时间">
              {{ formatTime(currentVideo.uploaded_at) }}
            </el-descriptions-item>
          </el-descriptions>
          <el-alert type="error" :closable="false" style="margin-top: 20px">
            视频文件无法加载或不存在
          </el-alert>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, View, Edit, Delete } from '@element-plus/icons-vue'
import request from '../../logic/register.js'

const formRef = ref(null)
const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const previewVisible = ref(false)

// 列表数据
const videoList = ref([])
const currentPage = ref(1)
const pageSize = ref(5)
const totalVideos = ref(0)
const totalPages = ref(0)

// 当前编辑/预览的视频
const currentVideo = ref(null)
const isEdit = ref(false)

// 上传进度
const uploadProgress = ref(0)
const uploadStatusText = ref('')

// 视频表单
const videoForm = ref({
  id: null,
  title: '',
  description: '',
  file_path: '',
})

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入视频标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度在 2 到 100 个字符', trigger: 'blur' },
  ],
  file_path: [
    {
      validator: (rule, value, callback) => {
        if (!isEdit.value && !value) {
          callback(new Error('请上传视频文件'))
        } else {
          callback()
        }
      },
      trigger: 'change',
    },
  ],
}

// 获取视频URL
const getVideoUrl = (filePath) => {
  if (!filePath) return ''
  let baseURL = import.meta.env.VITE_API_BASE_URL || ''
  baseURL = baseURL.replace(/\/api$/, '')
  return `${baseURL}${filePath}`
}

// 格式化时间
const formatTime = (dateString) => {
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

// 获取视频列表
const getVideoList = async () => {
  try {
    loading.value = true
    const response = await request.get(
      `/community/video/info?page=${currentPage.value}&page_size=${pageSize.value}`,
    )

    if (response.code === 200 && response.data) {
      videoList.value = response.data.results || []
      totalVideos.value = response.data.total || 0
      totalPages.value = response.data.total_pages || 0
    }
  } catch (error) {
    ElMessage.error('获取视频列表失败')
    console.error('获取视频列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 打开新增对话框
const openAddDialog = () => {
  isEdit.value = false
  currentVideo.value = null
  videoForm.value = {
    id: null,
    title: '',
    description: '',
    file_path: '',
  }
  uploadProgress.value = 0
  uploadStatusText.value = ''
  dialogVisible.value = true
}

// 打开编辑对话框
const handleEdit = (row) => {
  isEdit.value = true
  currentVideo.value = row
  videoForm.value = {
    id: row.id,
    title: row.title || '',
    description: row.description || '',
    file_path: row.video_file || '',
  }
  uploadProgress.value = 0
  uploadStatusText.value = ''
  dialogVisible.value = true
}

// 处理视频文件选择
const handleVideoChange = async (file) => {
  const rawFile = file.raw

  // 验证文件类型
  if (!rawFile.type.startsWith('video/')) {
    ElMessage.error('只能上传视频文件!')
    return
  }

  // 验证文件大小 (50MB)
  const isLt50M = rawFile.size / 1024 / 1024 < 50
  if (!isLt50M) {
    ElMessage.error('上传视频大小不能超过 50MB!')
    return
  }

  // 上传文件
  try {
    uploadProgress.value = 0
    uploadStatusText.value = '上传中...'

    const formData = new FormData()
    formData.append('video', rawFile)

    const response = await request.post('/community/video/upload', formData, {
      onUploadProgress: (progressEvent) => {
        uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        uploadStatusText.value = `上传中... ${uploadProgress.value}%`
      },
    })

    console.log('上传响应:', response)
    if (
      response.code === 200 &&
      response.data &&
      response.data.data &&
      response.data.data.file_path
    ) {
      uploadProgress.value = 100
      uploadStatusText.value = '上传成功'
      videoForm.value.file_path = response.data.data.file_path
      ElMessage.success('视频上传成功')
    } else {
      console.error('上传响应格式不正确:', response)
      throw new Error(response.message || '上传失败，响应格式不正确')
    }
  } catch (error) {
    uploadProgress.value = 0
    uploadStatusText.value = '上传失败'
    console.error('视频上传失败:', error)
    console.error('错误详情:', error.response || error.message || error)
    ElMessage.error(error.message || '视频上传失败')
    videoForm.value.file_path = ''
  }
}

// 提交视频信息
const submitVideo = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      submitLoading.value = true

      const submitData = {
        title: videoForm.value.title,
        description: videoForm.value.description,
        file_path: videoForm.value.file_path,
      }

      if (isEdit.value) {
        // 编辑模式 - PUT请求
        await request.put(`/community/video/info?pk=${videoForm.value.id}`, submitData)
        ElMessage.success('视频信息修改成功')
      } else {
        // 新增模式 - POST请求
        if (!videoForm.value.file_path) {
          ElMessage.error('请先上传视频文件')
          return
        }
        await request.post('/community/video/info', submitData)
        ElMessage.success('视频添加成功')
      }

      dialogVisible.value = false
      await getVideoList() // 刷新列表
    } catch (error) {
      ElMessage.error(isEdit.value ? '修改失败' : '添加失败')
      console.error('提交失败:', error)
    } finally {
      submitLoading.value = false
    }
  })
}

// 删除视频
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除视频 "${row.title}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await request.delete(`/community/video/info?pk=${row.id}`)
    ElMessage.success('删除成功')
    await getVideoList() // 刷新列表
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error('删除失败:', error)
    }
  }
}

// 预览视频
const handlePreview = (row) => {
  currentVideo.value = row
  previewVisible.value = true
}

// 处理页码变化
const handlePageChange = (page) => {
  currentPage.value = page
  getVideoList()
}

// 处理每页数量变化
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  getVideoList()
}

// 组件挂载时获取列表
onMounted(() => {
  getVideoList()
})
</script>

<style scoped>
.video-management {
  background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 20px;
  flex: 1;
  overflow-y: auto;
  transition: all 0.3s ease;
}

.video-management:hover {
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
}

/* 页面标题 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #ebeef5;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

/* 表格样式 */
.video-table {
  border-radius: 8px;
  overflow: hidden;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
}

:deep(.table-header th) {
  background-color: #f5f7fa;
  font-weight: 600;
  color: #606266;
}

:deep(.el-table) {
  background-color: transparent;
}

:deep(.el-table tr) {
  background-color: rgba(255, 255, 255, 0.5);
  transition: all 0.3s ease;
}

:deep(.el-table td) {
  border-bottom: 1px solid #ebeef5;
  padding: 12px 0;
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
  background-color: rgba(249, 250, 251, 0.5);
}

:deep(.el-table__body tr:hover > td) {
  background-color: rgba(236, 245, 255, 0.5);
}

/* 分页 */
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

:deep(.el-pagination) {
  padding: 10px 0;
}

:deep(.el-pagination .el-pager li) {
  background-color: rgba(255, 255, 255, 0.8);
  border: 1px solid #dcdfe6;
  margin: 0 4px;
}

:deep(.el-pagination .el-pager li:hover) {
  border-color: #409eff;
  color: #409eff;
}

:deep(.el-pagination .el-pager li.is-active) {
  background-color: #409eff;
  border-color: #409eff;
  color: #000;
  font-weight: bold;
}

/* 按钮 */
:deep(.el-button) {
  border-radius: 6px;
  padding: 8px 16px;
  font-weight: 500;
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
  background: linear-gradient(45deg, #f56c6c, #f78989);
  border: none;
}

:deep(.el-button--danger:hover) {
  background: linear-gradient(45deg, #f78989, #f56c6c);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.3);
}

:deep(.el-button--warning) {
  background: linear-gradient(45deg, #e6a23c, #ebb563);
  border: none;
}

:deep(.el-button--warning:hover) {
  background: linear-gradient(45deg, #ebb563, #e6a23c);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(230, 162, 60, 0.3);
}

/* 对话框 */
:deep(.el-dialog) {
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

:deep(.el-dialog__header) {
  border-bottom: 1px solid #ebeef5;
  padding: 20px 24px;
}

:deep(.el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

:deep(.el-dialog__body) {
  padding: 24px;
}

:deep(.el-dialog__footer) {
  border-top: 1px solid #ebeef5;
  padding: 16px 24px;
}

/* 视频上传 */
.video-upload {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.video-uploader {
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;
  width: 100%;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.5);
}

.video-uploader:hover {
  border-color: #409eff;
  background: rgba(64, 158, 255, 0.05);
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px;
}

.upload-icon {
  font-size: 48px;
  color: #909399;
}

.upload-text {
  font-size: 16px;
  color: #606266;
  font-weight: 500;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}

.uploaded-video {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.video-preview {
  width: 100%;
  max-height: 300px;
  border-radius: 6px;
}

.video-info {
  text-align: center;
  color: #67c23a;
  font-weight: 500;
  font-size: 14px;
}

.upload-progress {
  margin-top: 10px;
  padding: 10px;
  background: rgba(64, 158, 255, 0.05);
  border-radius: 6px;
}

.progress-text {
  margin-top: 8px;
  text-align: center;
  font-size: 14px;
  color: #409eff;
  font-weight: 500;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 预览 */
.preview-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.preview-video {
  width: 100%;
  max-height: 600px;
  border-radius: 8px;
  background: #000;
  object-fit: contain;
}

.preview-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
