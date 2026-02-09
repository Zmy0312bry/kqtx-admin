<template>
  <div class="box">
    <div class="tit">居民投诉情况</div>
    
    <!-- 切换按钮 -->
    <div class="switch-buttons">
      <button 
        v-for="type in viewTypes" 
        :key="type.value"
        :class="['switch-btn', { active: currentView === type.value }]"
        @click="switchView(type.value)"
      >
        {{ type.label }}
      </button>
    </div>
    
    <div ref="chart" class="boxnav"></div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { onMounted, ref, onUnmounted } from 'vue'
import request from '../../logic/register.js'

export default {
  name: 'ComplainSituation',
  setup() {
    const chart = ref(null)
    let myChart = null
    const loading = ref(false)
    let timer = null
    
    // 当前视图类型
    const currentView = ref('total')
    const viewTypes = [
      { label: '总数', value: 'total' },
      { label: '居民表单', value: 'normal' },
      { label: '网格员表单', value: 'grid' }
    ]
    
    // 存储完整数据
    const statusData = ref({
      normal: { unhandled: 0, handling: 0, handled: 0, waiting_callback: 0 },
      grid: { unhandled: 0, handling: 0, handled: 0, waiting_callback: 0 }
    })

    // 获取数据
    const fetchData = async () => {
      try {
        loading.value = true

        const response = await request.get('/analysis/status')
        statusData.value = response.data.status
        updateChartData()
      } catch (error) {
        console.error('获取数据失败:', error)
      } finally {
        loading.value = false
      }
    }
    
    // 根据当前视图计算要显示的数据
    const getDisplayData = () => {
      if (currentView.value === 'normal') {
        return statusData.value.normal
      } else if (currentView.value === 'grid') {
        return statusData.value.grid
      } else {
        // total: 合并 normal 和 grid
        return {
          unhandled: statusData.value.normal.unhandled + statusData.value.grid.unhandled,
          handling: statusData.value.normal.handling + statusData.value.grid.handling,
          handled: statusData.value.normal.handled + statusData.value.grid.handled,
          waiting_callback: statusData.value.normal.waiting_callback + statusData.value.grid.waiting_callback
        }
      }
    }
    
    // 更新图表数据
    const updateChartData = () => {
      if (!myChart) return
      const data = getDisplayData()
      updateChart(data)
    }
    
    // 切换视图
    const switchView = (type) => {
      currentView.value = type
      updateChartData()
    }

    const updateChart = (data) => {
      const colors = ['#37A2FF', '#00ff7f', '#FF0087', '#FFBF00']
      const option = {
        color: colors,
        // 添加动画配置
        animation: true,
        animationDuration: 500,
        animationEasing: 'cubicOut',
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow',
          },
        },
        grid: {
          left: '0%',
          right: '4%',
          bottom: '3%',
          top: '3%',
          containLabel: true,
        },
        xAxis: [
          {
            type: 'category',
            data: ['未处理', '处理中', '已处理', '待回访'],
            axisTick: {
              alignWithLabel: true,
            },
            axisLine: {
              lineStyle: {
                color: '#fff',
              },
            },
          },
        ],
        yAxis: [
          {
            type: 'value',
            axisLine: {
              lineStyle: {
                color: '#fff',
              },
            },
            splitLine: {
              lineStyle: {
                color: 'rgba(255,255,255,0.1)',
              },
            },
          },
        ],
        series: [
          {
            name: '投诉数量',
            type: 'bar',
            barWidth: '60%',
            itemStyle: {
              borderRadius: [8, 8, 0, 0],
            },
            data: [
              { value: data.unhandled, itemStyle: { color: colors[0] } },
              { value: data.handling, itemStyle: { color: colors[1] } },
              { value: data.handled, itemStyle: { color: colors[2] } },
              { value: data.waiting_callback, itemStyle: { color: colors[3] } },
            ],
          },
        ],
      }
      myChart.setOption(option)
    }

    const initChart = () => {
      if (!chart.value) return
      myChart = echarts.init(chart.value)
      fetchData()
    }

    onMounted(() => {
      initChart()
      // 添加自动刷新
      timer = setInterval(() => {
        fetchData()
      }, 5000) // 每5秒刷新一次

      window.addEventListener('resize', () => {
        myChart?.resize()
      })
    })

    onUnmounted(() => {
      // 清除定时器
      if (timer) {
        clearInterval(timer)
        timer = null
      }

      window.removeEventListener('resize', () => {
        myChart?.resize()
      })
      myChart?.dispose()
    })

    return {
      chart,
      currentView,
      viewTypes,
      switchView
    }
  },
}
</script>

<style scoped>
.box {
  height: 100%;
  background: rgba(0, 24, 106, 0.6);
  display: flex;
  flex-direction: column;
}

.tit {
  color: #fff;
  font-size: 18px;
  padding: 10px 15px 10px 30px;
  letter-spacing: normal;
  position: relative;
}

.tit:before {
  position: absolute;
  content: '';
  width: 6px;
  height: 6px;
  background: rgba(22, 214, 255, 0.9);
  box-shadow: 0 0 5px rgba(22, 214, 255, 0.9);
  border-radius: 10px;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
}

/* 切换按钮样式 */
.switch-buttons {
  display: flex;
  gap: 8px;
  padding: 0 15px 10px 15px;
  justify-content: center;
}

.switch-btn {
  flex: 1;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(22, 214, 255, 0.3);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
}

.switch-btn:hover {
  background: rgba(22, 214, 255, 0.2);
  border-color: rgba(22, 214, 255, 0.6);
  color: #fff;
  transform: translateY(-1px);
}

.switch-btn.active {
  background: rgba(22, 214, 255, 0.4);
  border-color: rgba(22, 214, 255, 0.9);
  color: #fff;
  font-weight: 600;
  box-shadow: 0 0 10px rgba(22, 214, 255, 0.5);
}

.boxnav {
  flex: 1;
  padding: 0 15px 15px;
}
</style>
