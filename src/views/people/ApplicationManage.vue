<template>
    <div class="application-manage-page">
        <div class="header">
            <h2>申请管理</h2>
            <div class="search-box">
                <el-select v-model="searchForm.peopleApplicationState" placeholder="申请状态" clearable>
                    <el-option label="待审核" :value="0"></el-option>
                    <el-option label="已处理" :value="1"></el-option>
                </el-select>
                <el-button type="primary" @click="handleSearch">查询</el-button>
                <el-button @click="resetSearch">重置</el-button>
            </div>
        </div>

        <!-- 申请列表 -->
        <el-table :data="applicationList" border style="width: 100%">
            <el-table-column prop="peopleApplicationTitle" label="申请标题" min-width="150" show-overflow-tooltip>
            </el-table-column>
            <el-table-column prop="peopleApplicant" label="申请人" width="120"></el-table-column>
            <el-table-column prop="peopleApplicationPhone" label="联系电话" width="130"></el-table-column>
            <el-table-column prop="peopleApplicationType" label="申请类型" width="100">
                <template slot-scope="scope">
                    {{ getApplicationTypeName(scope.row.peopleApplicationType) }}
                </template>
            </el-table-column>
            <el-table-column prop="peopleApplicationState" label="状态" width="100" align="center">
                <template slot-scope="scope">
                    <el-tag :type="getStatusType(scope.row.peopleApplicationState)">
                        {{ getStatusText(scope.row.peopleApplicationState) }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column prop="peopleApplicationDesc" label="处理描述" min-width="150" show-overflow-tooltip>
            </el-table-column>
            <el-table-column prop="peopleApplicationContent" label="申请内容" min-width="200" show-overflow-tooltip>
            </el-table-column>
            <el-table-column label="操作" width="180" align="center">
                <template slot-scope="scope">
                    <el-button type="text" @click="showDetail(scope.row)">查看详情</el-button>
                    <el-button v-if="scope.row.peopleApplicationState === 0" type="text"
                        @click="handleDispose(scope.row)">
                        处理
                    </el-button>
                </template>
            </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination">
            <el-pagination @size-change="handleSizeChange" @current-change="handleCurrentChange" :current-page="page"
                :page-sizes="[10, 20, 30, 50]" :page-size="limit" layout="total, sizes, prev, pager, next, jumper"
                :total="totalCount">
            </el-pagination>
        </div>

        <!-- 附件预览对话框 -->
        <el-dialog title="附件预览" :visible.sync="attachmentDialogVisible" width="80%">
            <div class="attachment-preview">
                <div v-for="(file, index) in currentAttachments" :key="index" class="attachment-preview-item">
                    <div class="file-info">
                        <span class="file-name">{{ file.name }}</span>
                        <el-button type="text" @click="downloadFile(file)">
                            <i class="el-icon-download"></i> 下载
                        </el-button>
                    </div>
                    <div class="file-content">
                        <!-- 图片预览 -->
                        <img v-if="isImage(file.name)" :src="file.fullUrl" class="preview-image"
                            @click="handleImagePreview(file)" />
                        <!-- 非图片文件 -->
                        <a v-else :href="file.fullUrl" target="_blank">{{ file.name }}</a>
                    </div>
                </div>
            </div>
        </el-dialog>

        <!-- 图片预览弹窗 -->
        <el-dialog :visible.sync="imagePreviewVisible" append-to-body class="image-preview-dialog">
            <img :src="previewImageUrl" class="preview-image-large" alt="预览图片">
        </el-dialog>

        <!-- 添加详情对话框 -->
        <el-dialog title="申请详情" :visible.sync="detailDialogVisible" width="60%">
            <div class="application-detail">
                <div class="detail-header">
                    <div class="detail-title">{{ currentApplication.peopleApplicationTitle }}</div>
                    <el-tag :type="getStatusType(currentApplication.peopleApplicationState)">
                        {{ getStatusText(currentApplication.peopleApplicationState) }}
                    </el-tag>
                </div>
                <div class="detail-meta">
                    <span>申请人：{{ currentApplication.peopleApplicant }}</span>
                    <span>联系电话：{{ currentApplication.peopleApplicationPhone }}</span>
                    <span>申请类型：{{ getApplicationTypeName(currentApplication.peopleApplicationType) }}</span>
                </div>
                <div class="detail-content">
                    <h4>申请内容：</h4>
                    <div class="content-text">{{ currentApplication.peopleApplicationContent }}</div>
                </div>
                <div v-if="currentApplication.peopleApplicationDesc" class="detail-desc">
                    <h4>处理描述：</h4>
                    <div class="desc-text">{{ currentApplication.peopleApplicationDesc }}</div>
                </div>
                <!-- 添加附件显示部分 -->
                <div v-if="currentApplication.peopleApplicationAnnex && currentApplication.peopleApplicationAnnex.length"
                    class="detail-attachments">
                    <h4>附件列表：</h4>
                    <div class="attachment-list">
                        <div v-for="(file, index) in currentAttachments" :key="index" class="attachment-item">
                            <div class="file-info">
                                <span class="file-name">{{ file.name }}</span>
                                <div class="file-actions">
                                    <el-button type="text" @click="downloadFile(file)">
                                        <i class="el-icon-download"></i> 下载
                                    </el-button>
                                    <el-button v-if="isImage(file.name)" type="text" @click="handleImagePreview(file)">
                                        <i class="el-icon-view"></i> 预览
                                    </el-button>
                                </div>
                            </div>
                            <!-- 图片预览 -->
                            <div v-if="isImage(file.name)" class="file-preview">
                                <img :src="file.fullUrl" class="preview-image" @click="handleImagePreview(file)" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </el-dialog>

        <!-- 添加处理对话框 -->
        <el-dialog title="申请处理" :visible.sync="disposeDialogVisible" width="50%">
            <el-form :model="disposeForm" ref="disposeForm" :rules="disposeRules" label-width="100px">
                <el-form-item label="处理描述" prop="peopleApplicationDesc">
                    <el-input type="textarea" v-model="disposeForm.peopleApplicationDesc" :rows="4"
                        placeholder="请输入处理描述">
                    </el-input>
                </el-form-item>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click="disposeDialogVisible = false">取 消</el-button>
                <el-button type="primary" @click="submitDispose">确 定</el-button>
            </div>
        </el-dialog>
    </div>
</template>

<script>
export default {
    name: 'ApplicationManage',
    data() {
        return {
            page: 1,
            limit: 10,
            totalCount: 0,
            applicationList: [],
            applicationTypes: {
                1: '林地使用',
                2: '林地流转',
                3: '林地开发',
                4: '林地保护建议和反馈',
                5: '举报非法占用林地行为',
                6: '参与林地保护活动',
                7: '其他'
            },
            attachmentDialogVisible: false,
            currentAttachments: [],
            imagePreviewVisible: false,
            previewImageUrl: '',
            searchForm: {
                peopleApplicationState: null
            },
            detailDialogVisible: false,
            currentApplication: {},
            disposeDialogVisible: false,
            disposeForm: {
                peopleApplicationId: '',
                peopleApplicationDesc: ''
            },
            disposeRules: {
                peopleApplicationDesc: [
                    { required: true, message: '请输入处理描述', trigger: 'blur' },
                    { min: 2, max: 500, message: '长度在 2 到 500 个字符', trigger: 'blur' }
                ]
            }
        }
    },
    created() {
        this.getApplicationList()
    },
    methods: {
        // 获取申请类型名称
        getApplicationTypeName(type) {
            return this.applicationTypes[type] || '未知类型'
        },

        // 获取申请列表
        async getApplicationList() {
            try {
                console.log('正在获取申请列表...')
                const response = await this.$axios({
                    method: 'post',
                    url: '/people_application/list',
                    data: {
                        page: this.page,
                        limit: this.limit,
                        people_application_state: this.searchForm.peopleApplicationState
                    }
                })
                console.log('获取申请列表响应:', response)

                if (response.data.code === 20000) {
                    this.applicationList = response.data.data.people_application_list
                    this.totalCount = response.data.data.total_count
                } else {
                    throw new Error(response.data.msg || '获取列表失败')
                }
            } catch (error) {
                console.error('获取申请列表失败:', error)
                this.$message.error(error.message || '获取列表失败')
            }
        },

        // 处理分页
        handleSizeChange(val) {
            this.limit = val
            this.page = 1
            this.getApplicationList()
        },
        handleCurrentChange(val) {
            this.page = val
            this.getApplicationList()
        },

        // 判断是否为图片文件
        isImage(filename) {
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
            return imageExtensions.some(ext =>
                filename.toLowerCase().endsWith(ext)
            )
        },

        // 处理图片预览
        handleImagePreview(file) {
            this.previewImageUrl = file.fullUrl
            this.imagePreviewVisible = true
        },

        // 下载文件
        downloadFile(file) {
            if (!file.fullUrl) return
            window.open(file.fullUrl, '_blank')
        },

        // 添加查询方法
        handleSearch() {
            this.page = 1  // 重置页码
            this.getApplicationList()
        },

        // 添加重置方法
        resetSearch() {
            this.searchForm.peopleApplicationState = null
            this.page = 1
            this.getApplicationList()
        },

        // 添加状态相关方法
        getStatusType(status) {
            const types = {
                0: 'info',    // 待审核
                1: 'success', // 已处理
            }
            return types[status] || 'info'
        },

        getStatusText(status) {
            const texts = {
                0: '待审核',
                1: '已处理'
            }
            return texts[status] || '未知状态'
        },

        // 修改显示详情方法
        showDetail(row) {
            this.currentApplication = { ...row }
            // 处理附件数据
            let attachments = row.peopleApplicationAnnex
            if (typeof attachments === 'string') {
                try {
                    attachments = JSON.parse(attachments)
                } catch (e) {
                    console.warn('附件解析失败:', e)
                    attachments = []
                }
            }
            this.currentAttachments = attachments.map(file => ({
                ...file,
                fullUrl: `${this.$config.fileBaseURL}/${file.url}${file.name}`
            }))
            this.detailDialogVisible = true
        },

        // 添加处理方法
        handleDispose(row) {
            this.disposeForm = {
                peopleApplicationId: row.peopleApplicationId,
                peopleApplicationDesc: ''
            }
            this.disposeDialogVisible = true
        },

        // 提交处理
        submitDispose() {
            this.$refs.disposeForm.validate(async (valid) => {
                if (valid) {
                    try {
                        console.log('提交处理数据:', this.disposeForm)
                        const response = await this.$axios.post('/people_application/dispose', this.disposeForm)

                        if (response.data.code === 20000) {
                            this.$message.success('处理成功')
                            this.disposeDialogVisible = false
                            this.getApplicationList() // 刷新列表
                        } else {
                            throw new Error(response.data.msg || '处理失败')
                        }
                    } catch (error) {
                        console.error('处理失败:', error)
                        this.$message.error(error.message || '处理失败')
                    }
                } else {
                    return false
                }
            })
        }
    }
}
</script>

<style scoped>
.application-manage-page {
    padding: 20px;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.dialog-footer {
    text-align: right;
}

.pagination {
    margin-top: 20px;
    text-align: right;
}

.delete-button {
    color: #F56C6C;
}

.delete-button:hover {
    color: #f78989;
}

.el-table {
    margin-top: 20px;
}

.el-button--text {
    padding: 0 8px;
}

.upload-demo {
    margin-top: 10px;
}

.el-upload__tip {
    line-height: 1.2;
}

/* 添加附件预览相关样式 */
.attachment-preview {
    max-height: 60vh;
    overflow-y: auto;
}

.attachment-preview-item {
    margin-bottom: 20px;
    padding: 15px;
    border: 1px solid #EBEEF5;
    border-radius: 4px;
}

.attachment-preview-item:last-child {
    margin-bottom: 0;
}

.file-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid #EBEEF5;
}

.file-content {
    padding: 10px;
    background-color: #f5f7fa;
    border-radius: 4px;
}

.file-content a {
    color: #409EFF;
    text-decoration: none;
}

.file-content a:hover {
    text-decoration: underline;
}

.el-icon-download {
    margin-right: 4px;
}

.preview-image {
    max-width: 100%;
    max-height: 200px;
    cursor: pointer;
    border-radius: 4px;
    transition: transform 0.3s;
}

.preview-image:hover {
    transform: scale(1.02);
}

.preview-image-large {
    max-width: 100%;
    max-height: 80vh;
    object-fit: contain;
}

/* 图片预览弹窗样式 */
:deep(.image-preview-dialog .el-dialog__body) {
    text-align: center;
    padding: 10px;
}

:deep(.image-preview-dialog .el-dialog__header) {
    padding: 10px;
}

/* 添加查询框样式 */
.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.search-box {
    display: flex;
    gap: 10px;
    align-items: center;
}

.el-select {
    width: 150px;
}

/* 添加详情对话框相关样式 */
.application-detail {
    padding: 20px;
}

.detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.detail-title {
    font-size: 18px;
    font-weight: bold;
}

.detail-meta {
    background-color: #f5f7fa;
    padding: 15px;
    border-radius: 4px;
    margin-bottom: 20px;
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
}

.detail-content {
    margin-bottom: 20px;
}

.content-text {
    line-height: 1.6;
    white-space: pre-wrap;
    padding: 15px;
    background-color: #f5f7fa;
    border-radius: 4px;
}

.detail-desc {
    margin-top: 20px;
    border-top: 1px solid #ebeef5;
    padding-top: 20px;
}

.desc-text {
    line-height: 1.6;
    white-space: pre-wrap;
    padding: 15px;
    background-color: #f5f7fa;
    border-radius: 4px;
}

/* 修改附件预览相关样式 */
.file-preview {
    margin-top: 10px;
    text-align: center;
}

.preview-image {
    max-width: 200px;
    max-height: 150px;
    cursor: pointer;
    border-radius: 4px;
    transition: transform 0.3s;
}

.preview-image:hover {
    transform: scale(1.05);
}

.file-actions {
    display: flex;
    gap: 10px;
}

/* 添加处理对话框相关样式 */
.dialog-footer {
    text-align: right;
}

.el-textarea {
    width: 100%;
}
</style>