<template>
    <div class="policy-info">
        <div class="filter-container">
            <el-form :inline="true" :model="filterForm" class="filter-form">
                <el-form-item label="政策类型">
                    <el-select v-model="filterForm.type" placeholder="请选择" clearable>
                        <el-option label="重要" :value="1"></el-option>
                        <el-option label="普通" :value="2"></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="截止时间">
                    <el-date-picker v-model="filterForm.expirationDate" type="datetime" placeholder="选择截止时间"
                        value-format="timestamp" clearable>
                    </el-date-picker>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="handleFilter">查询</el-button>
                    <el-button @click="resetFilter">重置</el-button>
                </el-form-item>
            </el-form>
        </div>

        <el-table :data="policies" border style="width: 100%; margin-bottom: 20px;">
            <el-table-column prop="policyHeadline" label="政策标题" min-width="100" show-overflow-tooltip>
                <template slot-scope="scope">
                    <el-button type="text" @click="showDetail(scope.row)">
                        {{ scope.row.policyHeadline }}
                    </el-button>
                </template>
            </el-table-column>
            <el-table-column prop="policyDepartment" label="发布部门" min-width="150" show-overflow-tooltip>
            </el-table-column>
            <el-table-column prop="policyTime" label="发布日期" min-width="200">
                <template slot-scope="scope">
                    {{ formatTimestamp(scope.row.policyTime) }}
                </template>
            </el-table-column>
            <el-table-column prop="policyType" label="类型" min-width="100" align="center">
                <template slot-scope="scope">
                    <el-tag :type="scope.row.policyType === 1 ? 'danger' : 'info'">
                        {{ scope.row.policyType === 1 ? '重要' : '普通' }}
                    </el-tag>
                </template>
            </el-table-column>
        </el-table>

        <el-pagination @size-change="handleSizeChange" @current-change="handleCurrentChange" :current-page="currentPage"
            :page-sizes="[10, 20, 30, 50]" :page-size="pageSize" layout="total, sizes, prev, pager, next, jumper"
            :total="total">
        </el-pagination>

        <el-dialog :title="currentPolicy.policyHeadline" :visible.sync="detailDialogVisible" width="60%"
            class="policy-detail-dialog">
            <div class="policy-detail">
                <div class="policy-meta">
                    <span>发布部门：{{ currentPolicy.policyDepartment }}</span>
                    <span>发布时间：{{ formatTimestamp(currentPolicy.policyTime) }}</span>
                    <span>
                        类型：
                        <el-tag :type="currentPolicy.policyType === 1 ? 'danger' : 'info'" size="small">
                            {{ currentPolicy.policyType === 1 ? '重要' : '普通' }}
                        </el-tag>
                    </span>
                </div>
                <div class="policy-content-container">
                    <div class="policy-content" v-html="formatContent(currentPolicy.policyContent)"></div>
                </div>

                <div v-if="currentPolicy.attachments && currentPolicy.attachments.length" class="policy-attachments">
                    <h4>附件列表：</h4>
                    <div class="attachment-list">
                        <div v-for="(file, index) in currentPolicy.attachments" :key="index" class="attachment-item">
                            <div class="file-info">
                                <i class="el-icon-document"></i>
                                <span class="file-name" :title="file.name">{{ file.name }}</span>
                            </div>
                            <div class="file-actions">
                                <el-tooltip content="预览" placement="top" :disabled="!isPreviewable(file)">
                                    <el-button type="text" :disabled="!isPreviewable(file)" @click="previewFile(file)">
                                        <i class="el-icon-view"></i>
                                    </el-button>
                                </el-tooltip>
                                <el-tooltip content="下载" placement="top">
                                    <el-button type="text" @click="downloadFile(file)">
                                        <i class="el-icon-download"></i>
                                    </el-button>
                                </el-tooltip>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </el-dialog>

        <el-dialog title="文件预览" :visible.sync="previewDialogVisible" width="80%" class="preview-dialog"
            :append-to-body="true" :destroy-on-close="true">
            <div class="preview-container">
                <iframe v-if="currentPreviewFile && currentPreviewFile.type === 'pdf'"
                    :src="getPreviewUrl(currentPreviewFile)" class="preview-iframe">
                </iframe>

                <img v-else-if="currentPreviewFile && isImageFile(currentPreviewFile)"
                    :src="getPreviewUrl(currentPreviewFile)" class="preview-image">

                <iframe v-else-if="currentPreviewFile && isOfficeFile(currentPreviewFile)"
                    :src="`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(getPreviewUrl(currentPreviewFile))}`"
                    class="preview-iframe">
                </iframe>

                <div v-else class="preview-unsupported">
                    <i class="el-icon-warning-outline"></i>
                    <p>该文件类型暂不支持预览，请下载后查看</p>
                    <el-button type="primary" @click="downloadFile(currentPreviewFile)">下载文件</el-button>
                </div>
            </div>
        </el-dialog>
    </div>
</template>

<script>
export default {
    name: 'PolicyInfo',
    data() {
        return {
            policies: [],
            currentPage: 1,
            pageSize: 10,
            total: 0,
            filterForm: {
                type: null,
                expirationDate: null
            },
            detailDialogVisible: false,
            currentPolicy: {
                policyHeadline: '',
                policyDepartment: '',
                policyTime: '',
                policyType: 1,
                policyContent: '',
                attachments: []
            },
            previewDialogVisible: false,
            currentPreviewFile: null
        }
    },
    created() {
        this.getPolicyList()
    },
    methods: {
        // 获取政策列表
        async getPolicyList() {
            try {
                const params = {
                    page: this.currentPage,
                    limit: this.pageSize
                }

                if (this.filterForm.type !== null) {
                    params.type = this.filterForm.type
                }
                if (this.filterForm.expirationDate) {
                    params.expiration_date = Math.floor(this.filterForm.expirationDate / 1000)
                }

                const res = await this.$axios.post('/policy/info/list', params)

                if (res.data.code === this.$config.successCode) {
                    this.policies = res.data.data.polityList.map(policy => ({
                        ...policy,
                        attachments: policy.policyAnnex ?
                            (typeof policy.policyAnnex === 'string' ?
                                JSON.parse(policy.policyAnnex) :
                                policy.policyAnnex) :
                            []
                    }))
                    this.total = res.data.data.total_count

                    if (this.policies.length === 0 && this.currentPage > 1) {
                        this.currentPage--
                        this.getPolicyList()
                    }
                } else {
                    this.$message.error(res.data.message || '获取政策列表失败')
                }
            } catch (error) {
                console.error('获取政策列表失败:', error)
                this.$message.error('获取政策列表失败')
            }
        },

        // 处理筛选
        handleFilter() {
            this.currentPage = 1
            this.getPolicyList()
        },

        // 重置筛选
        resetFilter() {
            this.filterForm = {
                type: null,
                expirationDate: null
            }
            this.currentPage = 1
            this.getPolicyList()
        },

        // 处理每页显示数量变化
        handleSizeChange(val) {
            this.pageSize = val
            this.currentPage = 1
            this.getPolicyList()
        },

        // 处理页码变化
        handleCurrentChange(val) {
            this.currentPage = val
            this.getPolicyList()
        },

        // 格式化时间戳
        formatTimestamp(timestamp) {
            if (!timestamp) return ''
            const date = new Date(timestamp * 1000)
            return date.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }).replace(/\//g, '-')
        },

        // 修改显示详情方法，直接使用传入的数据
        showDetail(policy) {
            this.currentPolicy = {
                ...policy,
                attachments: policy.policyAnnex ?
                    (typeof policy.policyAnnex === 'string' ?
                        JSON.parse(policy.policyAnnex) :
                        policy.policyAnnex) :
                    []
            }
            this.detailDialogVisible = true
        },

        // 格式化内容（将换行符转换为 HTML 换行）
        formatContent(content) {
            if (!content) return ''
            return content.replace(/\n/g, '<br>')
        },

        // 判断文件是否可预览
        isPreviewable(file) {
            const previewableTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'jpg', 'jpeg', 'png', 'gif']
            const extension = file.name.split('.').pop().toLowerCase()
            return previewableTypes.includes(extension)
        },

        // 预览文件
        previewFile(file) {
            this.currentPreviewFile = file
            this.previewDialogVisible = true
        },

        // 下载文件
        downloadFile(file) {
            const fileUrl = `${this.$config.fileBaseURL}/${file.url}${file.name}`
            const link = document.createElement('a')
            link.href = fileUrl
            link.download = file.name
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        },

        // 获取预览URL
        getPreviewUrl(file) {
            return `${this.$config.fileBaseURL}/${file.url}${file.name}`
        },

        // 判断是否为图片文件
        isImageFile(file) {
            const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp']
            const extension = file.name.split('.').pop().toLowerCase()
            return imageTypes.includes(extension)
        },

        // 判断是否为Office文件
        isOfficeFile(file) {
            const officeTypes = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']
            const extension = file.name.split('.').pop().toLowerCase()
            return officeTypes.includes(extension)
        },

        // 获取文件类型
        getFileType(file) {
            const extension = file.name.split('.').pop().toLowerCase()
            if (extension === 'pdf') return 'pdf'
            if (this.isImageFile(file)) return 'image'
            if (this.isOfficeFile(file)) return 'office'
            return 'other'
        }
    }
}
</script>

<style scoped>
.policy-info {
    padding: 20px;
}

.filter-container {
    margin-bottom: 20px;
    background-color: #f5f7fa;
    padding: 15px;
    border-radius: 4px;
}

.filter-form {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
}

.filter-form .el-form-item {
    margin-bottom: 0;
    margin-right: 20px;
}

.el-table {
    margin-top: 20px;
}

.el-pagination {
    text-align: right;
    margin-top: 20px;
}

.el-tag {
    margin: 0;
}

.policy-detail-dialog {
    .policy-detail {
        padding: 0 20px;
    }

    .policy-meta {
        margin-bottom: 20px;
        color: #666;
        font-size: 14px;

        span {
            margin-right: 20px;
        }
    }

    .policy-content-container {
        background-color: #f5f7fa;
        border-radius: 4px;
        padding: 20px;
        margin-bottom: 30px;
        border: 1px solid #e4e7ed;
    }

    .policy-content {
        line-height: 1.8;
        white-space: pre-wrap;
        color: #303133;
        font-size: 14px;
    }

    .policy-attachments {
        border-top: 1px solid #eee;
        padding-top: 20px;

        h4 {
            margin: 0 0 15px;
            color: #333;
        }
    }

    .attachment-list {
        .attachment-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            border-bottom: 1px solid #eee;

            &:last-child {
                border-bottom: none;
            }

            &:hover {
                background-color: #f5f7fa;
            }
        }

        .file-info {
            display: flex;
            align-items: center;
            flex: 1;

            i {
                margin-right: 8px;
                font-size: 18px;
                color: #909399;
            }

            .file-name {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
        }

        .file-actions {
            .el-button {
                padding: 0 8px;

                &[disabled] {
                    color: #C0C4CC;
                }
            }
        }
    }
}

:deep(.el-dialog__body) {
    max-height: 70vh;
    overflow-y: auto;
}

.preview-dialog {
    :deep(.el-dialog__body) {
        padding: 0;
        height: 80vh;
    }
}

.preview-container {
    height: 100%;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #f5f7fa;
}

.preview-iframe {
    width: 100%;
    height: 100%;
    border: none;
}

.preview-image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

.preview-unsupported {
    text-align: center;
    padding: 40px;

    i {
        font-size: 48px;
        color: #909399;
        margin-bottom: 20px;
    }

    p {
        color: #606266;
        margin-bottom: 20px;
    }
}

/* 确保预览对话框在全屏模式下也能正常显示 */
:deep(.el-dialog__wrapper) {
    display: flex;
    justify-content: center;
    align-items: center;

    .el-dialog {
        margin: 0 !important;
        display: flex;
        flex-direction: column;
        max-height: 90vh;

        .el-dialog__body {
            flex: 1;
            overflow: auto;
        }
    }
}
</style>