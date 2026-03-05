<template>
  <div class="community-show">
    <!-- 左栏 -->
    <div class="left-panel">
      <div class="add-section">
        <el-button type="primary" @click="showAddDialog">添加风采</el-button>
      </div>
      <div class="show-list" @scroll="handleScroll" ref="listRef">
        <div
          v-for="item in showList"
          :key="item.id"
          class="show-item"
          :class="{ active: currentShow?.id === item.id }"
          @click="selectShow(item)"
        >
          <span class="title">{{ item.title }}</span>
          <el-icon class="delete-icon" @click.stop="deleteShow(item)">
            <Close />
          </el-icon>
        </div>
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-more">
          <el-icon class="is-loading">
            <Loading />
          </el-icon>
          加载中...
        </div>
      </div>
    </div>

    <!-- 右栏 -->
    <div class="right-panel">
      <div v-if="!currentShow" class="empty-hint">选择一个以打开</div>
      <div v-else class="show-content" v-html="currentShow.content"></div>
    </div>

    <!-- 添加对话框 -->
    <el-dialog v-model="dialogVisible" title="添加新风采" width="500px">
      <el-form :model="newshow" label-width="80px">
        <el-form-item label="链接">
          <el-input v-model="newshow.url" placeholder="请输入微信公众号链接" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="addShow" :loading="loading"> 确定 </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Close, Loading } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import request from '../../logic/register.js'

const showList = ref([])
const currentShow = ref(null)
const dialogVisible = ref(false)
const loading = ref(false)
const newshow = ref({
  url: '',
})

const currentPage = ref(1)
const pageSize = ref(9)
const hasMore = ref(true)
const listRef = ref(null)

// 获取风采列表
const getShowList = async (isLoadMore = false) => {
  if (!hasMore.value && isLoadMore) return

  try {
    loading.value = true
    const response = await request.get(
      `/community/tweet?page=${currentPage.value}&page_size=${pageSize.value}`,
    )

    const results = response.data.results
    const count = response.data.total

    // 判断是否还有更多数据
    hasMore.value = currentPage.value * pageSize.value < count

    // 追加或替换数据
    if (isLoadMore) {
      showList.value = [...showList.value, ...results]
    } else {
      showList.value = results
    }
  } catch (error) {
    ElMessage.error('获取风采列表失败')
    console.error('获取风采列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 添加风采后重置列表
const addShow = async () => {
  if (!newshow.value.url) {
    ElMessage.warning('请填写完整信息')
    return
  }

  try {
    loading.value = true
    const formData = new FormData()
    formData.append('url', newshow.value.url)
    await request.post('/community/tweet', formData)
    ElMessage.success('添加成功')
    dialogVisible.value = false
    // 重置分页并重新加载
    currentPage.value = 1
    await getShowList()
  } catch (error) {
    ElMessage.error('添加失败')
    console.error('添加失败:', error)
  } finally {
    loading.value = false
  }
}

// 删除风采
const deleteShow = async (show) => {
  try {
    await ElMessageBox.confirm('确定要删除这条风采吗？', '提示', {
      type: 'warning',
    })

    loading.value = true
    await request.delete(`/community/tweet?pk=${show.id}`)
    if (currentShow.value?.id === show.id) {
      currentShow.value = null
    }
    await getShowList()
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

// 处理滚动事件
const handleScroll = async (e) => {
  const { scrollHeight, scrollTop, clientHeight } = e.target
  // 当距离底部不足50px时加载更多
  if (scrollHeight - scrollTop - clientHeight < 50 && !loading.value && hasMore.value) {
    currentPage.value++
    await getShowList(true)
  }
}

// 选择风采
const selectShow = (show) => {
  currentShow.value = show
}

// 显示添加对话框
const showAddDialog = () => {
  newshow.value.url = ''
  dialogVisible.value = true
}

// 组件加载时获取风采列表
onMounted(() => {
  getShowList()
})
</script>

<style scoped>
.community-show {
  display: flex;
  height: calc(100vh - 200px);
  min-height: 500px;
  background-color: #f5f7fa;
}

.left-panel {
  width: 300px;
  border-right: 1px solid #dcdfe6;
  background-color: white;
  display: flex;
  flex-direction: column;
}

.add-section {
  padding: 20px;
  border-bottom: 1px solid #dcdfe6;
}

.show-list {
  flex: 1;
  overflow-y: auto;
}

.show-item {
  padding: 15px 20px;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.show-item:hover {
  background-color: #f5f7fa;
}

.show-item .title {
  color: #333333;
  font-size: 16px;
}

.show-item.active {
  background-color: #ecf5ff;
  color: #409eff;
}

.delete-icon {
  opacity: 0;
  transition: opacity 0.3s;
}

.show-item:hover .delete-icon {
  opacity: 1;
}

.right-panel {
  flex: 1;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: white;
  margin: 20px;
  border-radius: 4px;
}

.empty-hint {
  color: #909399;
  font-size: 14px;
}

.show-content {
  width: 100%;
  height: 100%;
  padding: 20px;
  overflow-y: auto;
}

.show-content .el-image {
  max-width: 100%;
  max-height: 100%;
}

:deep(.show-content img) {
  max-width: 100%;
  height: auto;
}

:deep(.show-content) {
  line-height: 1.6;
}

.loading-more {
  text-align: center;
  padding: 10px 0;
  color: #909399;
  font-size: 14px;
}

.loading-more .el-icon {
  margin-right: 5px;
  vertical-align: middle;
}

.show-list {
  flex: 1;
  overflow-y: auto;
  scroll-behavior: smooth;
}
</style>
