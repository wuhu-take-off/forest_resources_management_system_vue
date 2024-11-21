<template>
    <div class="forest-view">
        <div class="page-header">
            <h2><i class="el-icon-view"></i> 资源查看</h2>
        </div>

        <el-card class="filter-card">
            <el-form :inline="true" :model="filterForm">
                <el-form-item label="林地名称">
                    <el-select v-model="filterForm.forestId" placeholder="请选择林地" clearable>
                        <el-option v-for="item in forestList" :key="item.forest_id" :label="item.forest_name"
                            :value="item.forest_id">
                        </el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="树种">
                    <el-select v-model="filterForm.treeSpeciesId" placeholder="请选择树种" clearable>
                        <el-option v-for="item in treeSpeciesList" :key="item.tree_species_id"
                            :label="item.tree_species_name" :value="item.tree_species_id">
                        </el-option>
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="handleSearch">查询</el-button>
                    <el-button @click="resetForm">重置</el-button>
                    <el-button type="success" @click="exportToExcel">
                        <i class="el-icon-download"></i> 导出Excel
                    </el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <el-card class="chart-card">
            <div slot="header">
                <el-radio-group v-model="activeChartTab" size="small">
                    <el-radio-button label="bar">监测数据统计</el-radio-button>
                    <el-radio-button label="pie">树种分布</el-radio-button>
                </el-radio-group>
            </div>

            <div class="chart-wrapper">
                <div v-show="activeChartTab === 'bar'" id="barChart" class="chart-container"></div>
                <div v-show="activeChartTab === 'pie'" id="pieChart" class="chart-container"></div>
            </div>
        </el-card>
    </div>
</template>

<script>
import * as echarts from 'echarts'
import * as XLSX from 'xlsx'

export default {
    name: 'ForestView',
    data() {
        return {
            filterForm: {
                forestId: null,
                treeSpeciesId: null
            },
            forestList: [],
            treeSpeciesList: [],
            resourceList: [],
            previewVisible: false,
            previewImages: [],
            chartInstance: null,
            pieChartInstance: null,
            activeChartTab: 'bar',
            total: 0,
        }
    },
    created() {
        this.getForestList()
        this.getTreeSpeciesList()
        this.getResourceList()
    },
    mounted() {
        this.$nextTick(() => {
            this.initCharts()
            window.addEventListener('resize', this.handleResize)
        })
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.handleResize)
        if (this.chartInstance) {
            this.chartInstance.dispose()
        }
        if (this.pieChartInstance) {
            this.pieChartInstance.dispose()
        }
    },
    methods: {
        // 获取林地列表
        async getForestList() {
            try {
                const response = await this.$axios.post('http://127.0.0.1:8000/forest_list')
                if (response.data.code === 20000) {
                    this.forestList = response.data.data.forest_list
                }
            } catch (error) {
                console.error('获取林地列表失败:', error)
                this.$message.error('获取林地列表失败')
            }
        },

        // 获取树种列表
        async getTreeSpeciesList() {
            try {
                const response = await this.$axios.get('http://127.0.0.1:8000/tree_species_list')
                if (response.data.code === 20000) {
                    this.treeSpeciesList = response.data.data.tree_species_list
                }
            } catch (error) {
                console.error('获取树种列表失败:', error)
                this.$message.error('获取树种列表失败')
            }
        },

        // 获取资源列表
        async getResourceList() {
            try {
                const params = {}
                if (this.filterForm.forestId) {
                    params.forestId = this.filterForm.forestId
                }
                if (this.filterForm.treeSpeciesId) {
                    params.treeSpeciesId = this.filterForm.treeSpeciesId
                }

                const response = await this.$axios.post('/forest_resource_info/list', params)
                if (response.data.code === 20000) {
                    this.resourceList = response.data.data.forest_resource_info_list
                    this.total = response.data.data.total_count
                    this.$nextTick(() => {
                        this.updateCharts()
                    })
                }
            } catch (error) {
                console.error('获取资源列表失败:', error)
                this.$message.error('获取资源列表失败')
            }
        },

        // 查询
        handleSearch() {
            this.getResourceList()
        },

        // 重置
        resetForm() {
            this.filterForm = {
                forestId: null,
                treeSpeciesId: null
            }
            this.getResourceList()
        },

        // 获取林地名称
        getForestName(forestId) {
            const forest = this.forestList.find(item => item.forest_id === forestId)
            return forest ? forest.forest_name : `未知林地(${forestId})`
        },

        // 获取树种名称
        getTreeSpeciesName(treeSpeciesId) {
            const species = this.treeSpeciesList.find(item => item.tree_species_id === treeSpeciesId)
            return species ? species.tree_species_name : `未知树种(${treeSpeciesId})`
        },

        // 格式化日期
        formatDate(dateStr) {
            const date = new Date(dateStr)
            return date.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            })
        },

        // 获取检查类型文本
        getExamineTypeText(type) {
            const types = {
                1: '常规巡检',
                2: '病虫害检查',
                3: '生长状况检查'
            }
            return types[type] || '未知类型'
        },

        // 获取状态文本
        getStatusText(status) {
            const statuses = {
                1: '良好',
                2: '一般',
                3: '需要关注'
            }
            return statuses[status] || '未知状态'
        },

        // 获取状态标签类型
        getStatusTypeByCode(status) {
            const types = {
                1: 'success',
                2: 'warning',
                3: 'danger'
            }
            return types[status] || 'info'
        },

        // 查看照片
        async viewPhotos(photos) {
            if (!photos || !photos.length) return

            try {
                this.previewImages = []

                // 直接通过 nginx 访问图片
                for (const photo of photos) {
                    // 构建完整的 nginx URL
                    const imageUrl = `http://localhost:80/${photo.url}${photo.name}`
                    this.previewImages.push(imageUrl)
                }

                if (this.previewImages.length > 0) {
                    this.previewVisible = true
                }
            } catch (error) {
                console.error('查看图片失败:', error)
                this.$message.error('查看图片失败')
            }
        },

        // 查看视频
        async viewVideos(videos) {
            if (!videos || !videos.length) return

            try {
                for (const video of videos) {
                    // 构建完整的 nginx URL
                    const videoUrl = `http://localhost:80/${video.url}${video.name}`

                    this.$alert(
                        `<video controls style="width: 100%">
                            <source src="${videoUrl}" type="video/mp4">
                            您的浏览器不支持视频播放
                        </video>`,
                        video.name,
                        {
                            dangerouslyUseHTMLString: true,
                            customClass: 'video-preview-dialog'
                        }
                    )
                }
            } catch (error) {
                console.error('查看视频失败:', error)
                this.$message.error('查看视频失败')
            }
        },

        // 获取MIME类型
        getMimeType(filename) {
            const ext = filename.split('.').pop().toLowerCase()
            const mimeTypes = {
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'png': 'image/png',
                'gif': 'image/gif',
                'bmp': 'image/bmp',
                'webp': 'image/webp'
            }
            return mimeTypes[ext] || 'image/jpeg'
        },

        // 处理窗口大小变化
        handleResize() {
            if (this.chartInstance) {
                this.chartInstance.resize()
            }
            if (this.pieChartInstance) {
                this.pieChartInstance.resize()
            }
        },

        // 修改初始化图表方法
        initCharts() {
            const barContainer = document.getElementById('barChart')
            const pieContainer = document.getElementById('pieChart')

            if (barContainer) {
                if (this.chartInstance) {
                    this.chartInstance.dispose()
                }
                this.chartInstance = echarts.init(barContainer)
            }

            if (pieContainer) {
                if (this.pieChartInstance) {
                    this.pieChartInstance.dispose()
                }
                this.pieChartInstance = echarts.init(pieContainer)
            }

            if (this.resourceList.length > 0) {
                this.updateCharts()
            }
        },

        // 更新图表数据
        updateCharts() {
            if (!this.resourceList.length) return

            // 准备数据
            const forestNames = [...new Set(this.resourceList.map(item => this.getForestName(item.forestId)))]
            const treeSpeciesNames = [...new Set(this.resourceList.map(item => this.getTreeSpeciesName(item.treeSpeciesId)))]

            // 处理柱状图数据
            const heightData = []
            const dbhData = []
            const densityData = []

            forestNames.forEach(forestName => {
                const forestData = this.resourceList.filter(item => this.getForestName(item.forestId) === forestName)
                const avgHeight = this.calculateAverage(forestData, 'meanHeight')
                const avgDBH = this.calculateAverage(forestData, 'meanDBH')
                const avgDensity = this.calculateAverage(forestData, 'density')

                heightData.push(avgHeight)
                dbhData.push(avgDBH)
                densityData.push(avgDensity)
            })

            // 设置柱状图配置
            const barOption = {
                title: {
                    text: '林地资源监测数据统计',
                    left: 'center'
                },
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'shadow'
                    }
                },
                legend: {
                    data: ['平均高度(m)', '平均胸径(cm)', '密度(株/亩)'],
                    top: 30
                },
                xAxis: {
                    type: 'category',
                    data: forestNames,
                    axisLabel: {
                        interval: 0,
                        rotate: 30
                    }
                },
                yAxis: [
                    {
                        type: 'value',
                        name: '高度/胸径'
                    },
                    {
                        type: 'value',
                        name: '密度',
                        axisLabel: {
                            formatter: '{value} 株/亩'
                        }
                    }
                ],
                series: [
                    {
                        name: '平均高度(m)',
                        type: 'bar',
                        data: heightData
                    },
                    {
                        name: '平均胸径(cm)',
                        type: 'bar',
                        data: dbhData
                    },
                    {
                        name: '密度(株/亩)',
                        type: 'bar',
                        yAxisIndex: 1,
                        data: densityData
                    }
                ]
            }

            // 处理饼图数据
            const treeSpeciesData = treeSpeciesNames.map(name => {
                const count = this.resourceList.filter(item =>
                    this.getTreeSpeciesName(item.treeSpeciesId) === name
                ).length
                return { value: count, name: name }
            })

            // 修改饼图配置
            const pieOption = {
                title: {
                    text: '树种分布统计',
                    left: 'center',
                    top: 20,
                    textStyle: {
                        fontSize: 20,
                        fontWeight: 'bold'
                    }
                },
                tooltip: {
                    trigger: 'item',
                    formatter: '{a} <br/>{b}: {c} ({d}%)',
                    textStyle: {
                        fontSize: 14
                    }
                },
                legend: {
                    orient: 'vertical',
                    left: '5%',
                    top: 'middle',
                    itemWidth: 10,
                    itemHeight: 10,
                    textStyle: {
                        fontSize: 14
                    }
                },
                series: [
                    {
                        name: '树种分布',
                        type: 'pie',
                        radius: ['35%', '70%'],
                        center: ['55%', '50%'],
                        avoidLabelOverlap: true,
                        itemStyle: {
                            borderRadius: 10,
                            borderColor: '#fff',
                            borderWidth: 2
                        },
                        label: {
                            show: true,
                            position: 'outside',
                            formatter: '{b}: {c} ({d}%)',
                            fontSize: 14,
                            fontWeight: 'bold'
                        },
                        emphasis: {
                            label: {
                                show: true,
                                fontSize: 16,
                                fontWeight: 'bold'
                            },
                            itemStyle: {
                                shadowBlur: 10,
                                shadowOffsetX: 0,
                                shadowColor: 'rgba(0, 0, 0, 0.5)'
                            }
                        },
                        data: treeSpeciesData
                    }
                ],
                color: [
                    '#5470c6',
                    '#91cc75',
                    '#fac858',
                    '#ee6666',
                    '#73c0de',
                    '#3ba272',
                    '#fc8452',
                    '#9a60b4'
                ]
            }

            // 更新图表
            this.chartInstance.setOption(barOption)
            this.pieChartInstance.setOption(pieOption)
        },

        // 计算平均值的辅助方法
        calculateAverage(data, key) {
            if (!data.length) return 0
            const sum = data.reduce((acc, curr) => acc + curr.forestResourceExamineInfo[key], 0)
            return Number((sum / data.length).toFixed(2))
        },

        // 修改图表切换处理
        async handleChartTabChange() {
            await this.$nextTick()
            this.handleResize()
            this.updateCharts()
        },

        // 添加导出Excel方法
        async exportToExcel() {
            try {
                // 获取所有数据
                const params = {}
                if (this.filterForm.forestId) {
                    params.forestId = this.filterForm.forestId
                }
                if (this.filterForm.treeSpeciesId) {
                    params.treeSpeciesId = this.filterForm.treeSpeciesId
                }

                const response = await this.$axios.post('/forest_resource_info/list', params)

                if (response.data.code === 20000) {
                    const data = response.data.data.forest_resource_info_list

                    // 转换数据格式
                    const exportData = data.map(item => ({
                        '林地名称': this.getForestName(item.forestId),
                        '树种名称': this.getTreeSpeciesName(item.treeSpeciesId),
                        '检查日期': this.formatDate(item.forestResourceExamineTime),
                        '检查类型': this.getExamineTypeText(item.forestResourceExamineType),
                        '林地状态': this.getStatusText(item.forestStatus),
                        '平均高度(m)': item.forestResourceExamineInfo.meanHeight,
                        '平均胸径(cm)': item.forestResourceExamineInfo.meanDBH,
                        '密度(株/亩)': item.forestResourceExamineInfo.density,
                        '问题描述': item.problemDes || '',
                        '处理建议': item.treatmentSuggestion || ''
                    }))

                    // 创建工作簿
                    const wb = XLSX.utils.book_new()
                    // 创建工作表
                    const ws = XLSX.utils.json_to_sheet(exportData)

                    // 设置列宽
                    const colWidths = [
                        { wch: 15 }, // 林地名称
                        { wch: 15 }, // 树种名称
                        { wch: 20 }, // 检查日期
                        { wch: 15 }, // 检查类型
                        { wch: 10 }, // 林地状态
                        { wch: 12 }, // 平均高度
                        { wch: 12 }, // 平均胸径
                        { wch: 12 }, // 密度
                        { wch: 30 }, // 问题描述
                        { wch: 30 }  // 处理建议
                    ]
                    ws['!cols'] = colWidths

                    // 添加工作表到工作簿
                    XLSX.utils.book_append_sheet(wb, ws, '林地资源统计')

                    // 生成文件名
                    const fileName = `林地资源统计_${new Date().toLocaleDateString()}.xlsx`

                    // 导出文件
                    XLSX.writeFile(wb, fileName)

                    this.$message.success('导出成功')
                } else {
                    throw new Error(response.data.msg || '获取数据失败')
                }
            } catch (error) {
                console.error('导出失败:', error)
                this.$message.error('导出失败')
            }
        }
    },

    watch: {
        activeChartTab() {
            this.handleChartTabChange()
        }
    }
}
</script>

<style>
/* 视频预览对话框样式 */
.video-preview-dialog {
    width: 80% !important;
    max-width: 1000px;
}

.video-preview-dialog .el-message-box__content {
    padding: 10px;
}

.video-preview-dialog .el-message-box__message {
    padding: 0;
}

.video-preview-dialog video {
    max-height: 80vh;
    object-fit: contain;
}

/* 图片预览对话框样式 */
.preview-dialog .el-dialog__body {
    padding: 10px;
    text-align: center;
}

.preview-dialog .el-carousel__container {
    display: flex;
    align-items: center;
    justify-content: center;
}

.preview-dialog img {
    max-height: 70vh;
    object-fit: contain;
}
</style>

<style scoped>
.forest-view {
    padding: 10px 20px;
}

.page-header {
    margin-bottom: 15px;
}

.page-header h2 {
    font-size: 20px;
    color: #303133;
    display: flex;
    align-items: center;
    margin: 0;
}

.page-header h2 i {
    margin-right: 8px;
}

.filter-card {
    margin-bottom: 15px;
}

.chart-card {
    margin-bottom: 15px;
    background: #fff;
}

.chart-wrapper {
    position: relative;
    width: 100%;
    height: 600px;
}

.chart-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

.el-radio-group {
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
}

.el-radio-button__inner {
    padding: 10px 25px;
}

/* 确保切换时的平滑过渡 */
#barChart,
#pieChart {
    transition: opacity 0.3s ease;
}
</style>