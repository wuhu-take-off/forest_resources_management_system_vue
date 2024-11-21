<template>
    <div class="notice-info">
        <div class="filter-container">
            <el-form :inline="true" :model="filterForm" class="filter-form">
                <el-form-item label="优先级">
                    <el-select v-model="filterForm.priority" placeholder="请选择" clearable>
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

        <el-table :data="notices" border style="width: 100%; margin-bottom: 20px;">
            <el-table-column prop="noticeContent" label="公告内容" min-width="200" show-overflow-tooltip>
                <template slot-scope="scope">
                    <el-button type="text" @click="showDetail(scope.row)">
                        {{ scope.row.noticeContent }}
                    </el-button>
                </template>
            </el-table-column>
            <el-table-column prop="noticePublisher" label="发布人" min-width="150" show-overflow-tooltip>
            </el-table-column>
            <el-table-column prop="noticeTime" label="发布日期" min-width="200">
                <template slot-scope="scope">
                    {{ formatTimestamp(scope.row.noticeTime) }}
                </template>
            </el-table-column>
            <el-table-column prop="noticePriority" label="优先级" min-width="100" align="center">
                <template slot-scope="scope">
                    <el-tag :type="scope.row.noticePriority === 1 ? 'danger' : 'info'">
                        {{ scope.row.noticePriority === 1 ? '重要' : '普通' }}
                    </el-tag>
                </template>
            </el-table-column>
        </el-table>

        <el-pagination @size-change="handleSizeChange" @current-change="handleCurrentChange" :current-page="currentPage"
            :page-sizes="[10, 20, 30, 50]" :page-size="pageSize" layout="total, sizes, prev, pager, next, jumper"
            :total="total">
        </el-pagination>

        <el-dialog title="公告详情" :visible.sync="detailDialogVisible" width="60%" class="notice-detail-dialog">
            <div class="notice-detail">
                <div class="notice-meta">
                    <span>发布人：{{ currentNotice.noticePublisher }}</span>
                    <span>发布时间：{{ formatTimestamp(currentNotice.noticeTime) }}</span>
                    <span>
                        优先级：
                        <el-tag :type="currentNotice.noticePriority === 1 ? 'danger' : 'info'" size="small">
                            {{ currentNotice.noticePriority === 1 ? '重要' : '普通' }}
                        </el-tag>
                    </span>
                </div>
                <div class="notice-content-container">
                    <div class="notice-content" v-html="formatContent(currentNotice.noticeContent)"></div>
                </div>

                <div v-if="currentNotice.attachments && currentNotice.attachments.length" class="notice-attachments">
                    <h4>附件列表：</h4>
                    <div class="attachment-list">
                        <div v-for="(file, index) in currentNotice.attachments" :key="index" class="attachment-item">
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

        <!-- 预览对话框 -->
        <el-dialog title="文件预览" :visible.sync="previewDialogVisible" width="80%" class="preview-dialog"
            :append-to-body="true" :destroy-on-close="true">
            <div class="preview-container">
                <!-- 预览内容与PolicyInfo.vue相同 -->
            </div>
        </el-dialog>
    </div>
</template>

<script>
export default {
    name: 'NoticeInfo',
    data() {
        return {
            notices: [],
            currentPage: 1,
            pageSize: 10,
            total: 0,
            filterForm: {
                priority: null,
                expirationDate: null
            },
            detailDialogVisible: false,
            currentNotice: {
                noticeContent: '',
                noticePublisher: '',
                noticeTime: '',
                noticePriority: 1,
                attachments: []
            },
            previewDialogVisible: false,
            currentPreviewFile: null
        }
    },
    created() {
        this.getNoticeList()
    },
    methods: {
        // 获取公告列表
        async getNoticeList() {
            try {
                const params = {
                    page: this.currentPage,
                    limit: this.pageSize
                }

                if (this.filterForm.priority !== null) {
                    params.notice_priority = this.filterForm.priority
                }
                if (this.filterForm.expirationDate) {
                    params.expiration_date = Math.floor(this.filterForm.expirationDate / 1000)
                }

                const res = await this.$axios.post('/notice/info/list', params)

                if (res.data.code === 20000) {
                    const { notice_info_list, total_count } = res.data.data

                    this.notices = notice_info_list.map(notice => ({
                        ...notice,
                        attachments: notice.noticeAnnex ?
                            (typeof notice.noticeAnnex === 'string' ?
                                JSON.parse(notice.noticeAnnex) :
                                notice.noticeAnnex) :
                            []
                    }))
                    this.total = total_count

                    if (this.notices.length === 0 && this.currentPage > 1) {
                        this.currentPage--
                        this.getNoticeList()
                    }
                } else {
                    this.$message.error(res.data.msg || '获取公告列表失败')
                }
            } catch (error) {
                console.error('获取公告列表失败:', error)
                this.$message.error('获取公告列表失败')
            }
        },

        // 其他方法与PolicyInfo.vue相同，只需将policy相关文字改为notice
        handleFilter() {
            this.currentPage = 1
            this.getNoticeList()
        },

        resetFilter() {
            this.filterForm = {
                priority: null,
                expirationDate: null
            }
            this.currentPage = 1
            this.getNoticeList()
        },

        // ... 其他方法保持不变，只需将变量名中的policy改为notice

        isPreviewable(file) {
            const previewableTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'jpg', 'jpeg', 'png', 'gif']
            const extension = file.name.split('.').pop().toLowerCase()
            return previewableTypes.includes(extension)
        },

        previewFile(file) {
            this.currentPreviewFile = file
            this.previewDialogVisible = true
        },

        downloadFile(file) {
            const fileUrl = `${this.$config.fileBaseURL}/${file.url}${file.name}`
            const link = document.createElement('a')
            link.href = fileUrl
            link.download = file.name
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        },

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

        formatContent(content) {
            if (!content) return ''
            return content.replace(/\n/g, '<br>')
        },

        showDetail(notice) {
            this.currentNotice = {
                ...notice,
                attachments: notice.noticeAnnex ?
                    (typeof notice.noticeAnnex === 'string' ?
                        JSON.parse(notice.noticeAnnex) :
                        notice.noticeAnnex) :
                    []
            }
            this.detailDialogVisible = true
        },

        handleSizeChange(val) {
            this.pageSize = val
            this.currentPage = 1
            this.getNoticeList()
        },

        handleCurrentChange(val) {
            this.currentPage = val
            this.getNoticeList()
        }
    }
}
</script>

<style scoped>
/* 样式与PolicyInfo.vue相同，只需将policy相关类名改为notice */
.notice-info {
    padding: 20px;
}

/* ... 其他样式保持不变 */
</style>