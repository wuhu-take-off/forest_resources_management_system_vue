<template>
    <div class="application-page">
        <div class="page-header">
            <h2><i class="el-icon-edit"></i> 民众申请</h2>
            <el-button type="primary" @click="showAddDialog">
                <i class="el-icon-plus"></i> 新增申请
            </el-button>
        </div>

        <el-table :data="applications" border style="width: 100%; margin-bottom: 20px;">
            <el-table-column prop="peopleApplicationTitle" label="申请标题" min-width="150" show-overflow-tooltip>
            </el-table-column>
            <el-table-column prop="peopleApplicant" label="申请人" min-width="100">
            </el-table-column>
            <el-table-column prop="peopleApplicationType" label="申请类型" width="120">
                <template slot-scope="scope">
                    {{ getTypeText(scope.row.peopleApplicationType) }}
                </template>
            </el-table-column>
            <el-table-column prop="modifyTime" label="提交时间" min-width="150">
                <template slot-scope="scope">
                    {{ formatTimestamp(scope.row.modifyTime) }}
                </template>
            </el-table-column>
            <el-table-column prop="peopleApplicationState" label="状态" min-width="100" align="center">
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
            <el-table-column label="操作" width="150" align="center">
                <template slot-scope="scope">
                    <el-button type="text" @click="handleEdit(scope.row)"
                        :disabled="scope.row.peopleApplicationState !== 0">编辑</el-button>
                    <el-button type="text" class="delete-button" @click="handleDelete(scope.row)"
                        :disabled="scope.row.peopleApplicationState !== 0">撤回</el-button>
                </template>
            </el-table-column>
        </el-table>

        <el-pagination @size-change="handleSizeChange" @current-change="handleCurrentChange" :current-page="currentPage"
            :page-sizes="[10, 20, 30, 50]" :page-size="pageSize" layout="total, sizes, prev, pager, next, jumper"
            :total="total">
        </el-pagination>

        <!-- 申请表单对话框 -->
        <el-dialog :title="isEdit ? '编辑申请' : '新增申请'" :visible.sync="dialogVisible" width="60%">
            <el-form :model="applicationForm" ref="applicationForm" :rules="rules" label-width="100px">
                <el-form-item label="申请标题" prop="peopleApplicationTitle">
                    <el-input v-model="applicationForm.peopleApplicationTitle" placeholder="请输入申请标题"></el-input>
                </el-form-item>
                <el-form-item label="申请人" prop="peopleApplicant">
                    <el-input v-model="applicationForm.peopleApplicant" placeholder="请输入申请人姓名"></el-input>
                </el-form-item>
                <el-form-item label="联系电话" prop="peopleApplicationPhone">
                    <el-input v-model="applicationForm.peopleApplicationPhone" placeholder="请输入联系电话"></el-input>
                </el-form-item>
                <el-form-item label="申请类型" prop="peopleApplicationType">
                    <el-select v-model="applicationForm.peopleApplicationType" placeholder="请选择申请类型"
                        style="width: 100%">
                        <el-option label="林地使用" :value="1"></el-option>
                        <el-option label="林地流转" :value="2"></el-option>
                        <el-option label="林地开发" :value="3"></el-option>
                        <el-option label="林地保护建议和反馈" :value="4"></el-option>
                        <el-option label="举报非法占用林地行为" :value="5"></el-option>
                        <el-option label="参与林地保护活动" :value="6"></el-option>
                        <el-option label="其他" :value="7"></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="申请内容" prop="peopleApplicationContent">
                    <el-input type="textarea" v-model="applicationForm.peopleApplicationContent" rows="6"
                        placeholder="请详细描述您的申请内容..."></el-input>
                </el-form-item>
                <el-form-item label="附件">
                    <el-upload class="upload-demo" action="#" :on-preview="handlePreview" :on-remove="handleRemove"
                        :before-remove="beforeRemove" :on-change="handleFileChange" :file-list="fileList"
                        :auto-upload="false" multiple>
                        <el-button size="small" type="primary">点击上传</el-button>
                        <div slot="tip" class="el-upload__tip">支持任意文件格式，单个文件不超过50MB</div>
                    </el-upload>
                </el-form-item>
            </el-form>
            <div slot="footer">
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleSubmit">提交</el-button>
            </div>
        </el-dialog>

        <!-- 详情对话框 -->
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
                    <span>提交时间：{{ formatTimestamp(currentApplication.modifyTime) }}</span>
                    <span>申请类型：{{ getTypeText(currentApplication.peopleApplicationType) }}</span>
                </div>
                <div class="detail-content">
                    <h4>申请内容：</h4>
                    <div class="content-text">{{ currentApplication.peopleApplicationContent }}</div>
                </div>
                <div v-if="currentApplication.peopleApplicationDesc" class="detail-desc">
                    <h4>处理描述：</h4>
                    <div class="desc-text">{{ currentApplication.peopleApplicationDesc }}</div>
                </div>
                <div v-if="currentApplication.peopleApplicationAnnex && currentApplication.peopleApplicationAnnex.length"
                    class="detail-attachments">
                    <h4>附件列表：</h4>
                    <div class="attachment-list">
                        <div v-for="(file, index) in currentApplication.peopleApplicationAnnex" :key="index"
                            class="attachment-item">
                            <span class="file-name">{{ file.name }}</span>
                            <div class="file-actions">
                                <el-button type="text" @click="handlePreview(file)">
                                    <i class="el-icon-view"></i> 预览
                                </el-button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </el-dialog>

        <!-- 添加附件预览对话框 -->
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
                        <a :href="file.fullUrl" target="_blank">{{ file.name }}</a>
                    </div>
                </div>
            </div>
        </el-dialog>
    </div>
</template>

<script>
export default {
    name: 'Application',
    data() {
        return {
            applications: [], // 申请列表
            currentPage: 1,
            pageSize: 10,
            total: 0,
            dialogVisible: false,
            detailDialogVisible: false,
            isEdit: false,
            applicationForm: {
                peopleApplicationTitle: '',
                peopleApplicant: '',
                peopleApplicationPhone: '',
                peopleApplicationType: '',
                peopleApplicationContent: '',
                peopleApplicationAnnex: []
            },
            currentApplication: {},
            fileList: [],
            rules: {
                peopleApplicationTitle: [
                    { required: true, message: '请输入请标题', trigger: 'blur' },
                    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
                ],
                peopleApplicant: [
                    { required: true, message: '请输入申请人姓名', trigger: 'blur' }
                ],
                peopleApplicationPhone: [
                    { required: true, message: '请输入联系电话', trigger: 'blur' },
                    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
                ],
                peopleApplicationType: [
                    { required: true, message: '请选择申请类型', trigger: 'change' }
                ],
                peopleApplicationContent: [
                    { required: true, message: '请输入申请内容', trigger: 'blur' },
                    { min: 10, max: 500, message: '长度在 10 到 500 个字符', trigger: 'blur' }
                ]
            },
            attachmentDialogVisible: false,
            currentAttachments: [],
        }
    },
    created() {
        this.getApplicationList()
    },
    methods: {
        // 获取申请列表
        async getApplicationList() {
            try {
                console.log('正在获取申请列表...')
                const response = await this.$axios.post('/people_application/list', {
                    page: this.currentPage,
                    limit: this.pageSize
                })
                console.log('获取申请列表响应:', response)

                if (response.data.code === 20000) {
                    this.applications = response.data.data.people_application_list
                    this.total = response.data.data.total_count
                } else {
                    throw new Error(response.data.msg || '获取列表失败')
                }
            } catch (error) {
                console.error('获取申请列表失败:', error)
                this.$message.error(error.message || '获取列表失败')
            }
        },

        // 获取状态类型
        getStatusType(status) {
            const types = {
                0: 'info',    // 待审核
                1: 'success', // 已处理
            }
            return types[status] || 'info'
        },

        // 获取状态文本
        getStatusText(status) {
            const texts = {
                0: '待审核',
                1: '已处理'
            }
            return texts[status] || '未知状态'
        },

        // 获取申请类型文本
        getTypeText(type) {
            const texts = {
                1: '林地使用',
                2: '林地流转',
                3: '林地开发',
                4: '林地保护建议和反馈',
                5: '举报非法占用林地行为',
                6: '参与林地保护活动',
                7: '其他'
            }
            return texts[type] || '未知类型'
        },

        // 显示新增对话框
        showAddDialog() {
            this.isEdit = false
            this.applicationForm = {
                peopleApplicationTitle: '',
                peopleApplicant: '',
                peopleApplicationPhone: '',
                peopleApplicationType: '',
                peopleApplicationContent: '',
                peopleApplicationAnnex: []
            }
            this.fileList = []
            this.dialogVisible = true
            this.$nextTick(() => {
                if (this.$refs.applicationForm) {
                    this.$refs.applicationForm.clearValidate()
                }
            })
        },

        // 处理编辑
        handleEdit(row) {
            this.isEdit = true
            this.applicationForm = { ...row }
            this.fileList = row.peopleApplicationAnnex ?
                (typeof row.peopleApplicationAnnex === 'string' ?
                    JSON.parse(row.peopleApplicationAnnex) :
                    row.peopleApplicationAnnex) :
                []
            this.dialogVisible = true
        },

        // 处理删除（撤回）
        handleDelete(row) {
            this.$confirm('确认撤回该申请吗？', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(async () => {
                try {
                    const response = await this.$axios.post('/people_application/del', {
                        peopleApplicationId: row.peopleApplicationId
                    })

                    if (response.data.code === 20000) {
                        this.$message.success('申请已撤回')
                        this.getApplicationList()
                    } else {
                        throw new Error(response.data.msg || '撤回失败')
                    }
                } catch (error) {
                    console.error('撤回失败:', error)
                    this.$message.error(error.message || '撤回失败')
                }
            }).catch(() => { })
        },

        // 显示详情
        showDetail(row) {
            this.currentApplication = {
                ...row,
                modifyTime: row.modifyTime * 1000  // 转换为毫秒以正确显示
            }
            this.detailDialogVisible = true
        },

        // 处理提交
        handleSubmit() {
            this.$refs.applicationForm.validate((valid) => {
                if (valid) {
                    console.log('表单验证通过，准备提交数据')

                    const formData = new FormData()

                    // 添加基本字段
                    formData.append('peopleApplicationTitle', this.applicationForm.peopleApplicationTitle)
                    formData.append('peopleApplicant', this.applicationForm.peopleApplicant)
                    formData.append('peopleApplicationPhone', this.applicationForm.peopleApplicationPhone)
                    formData.append('peopleApplicationType', this.applicationForm.peopleApplicationType)
                    formData.append('peopleApplicationContent', this.applicationForm.peopleApplicationContent)

                    // 添加时间戳，除以1000转换为秒
                    formData.append('modifyTime', Math.floor(Date.now() / 1000))

                    // 如果是编辑模式，添加ID
                    if (this.isEdit) {
                        formData.append('peopleApplicationId', this.applicationForm.peopleApplicationId)
                    }

                    // 添加文件
                    this.fileList.forEach(file => {
                        if (file.raw) {
                            formData.append('peopleApplicationAnnex', file.raw)
                        }
                    })

                    console.log('提交的数据:', formData)

                    // 发送请求
                    this.$axios.post(
                        this.isEdit ? '/people_application/modify' : '/people_application/create',
                        formData,
                        {
                            headers: {
                                'Content-Type': 'multipart/form-data'
                            }
                        }
                    ).then(res => {
                        console.log('请求响应:', res)
                        if (res.data.code === 20000) {
                            this.$message.success(this.isEdit ? '修改成功' : '添加成功')
                            this.dialogVisible = false
                            this.getApplicationList()
                        } else {
                            this.$message.error(res.data.msg || (this.isEdit ? '修改失败' : '添加失败'))
                        }
                    }).catch(error => {
                        console.error('请求错误:', error)
                        this.$message.error(this.isEdit ? '修改失败' : '添加失败')
                    })
                } else {
                    console.log('表单验证失败')
                    return false
                }
            })
        },

        // 格式化时间戳
        formatTimestamp(timestamp) {
            if (!timestamp) return ''
            const date = new Date(timestamp * 1000)  // 修改这里，乘以1000转换为毫秒
            return date.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }).replace(/\//g, '-')
        },

        // 文件相关方法
        handlePreview(file) {
            let fileList = [file]
            if (typeof file === 'string') {
                try {
                    fileList = JSON.parse(file)
                } catch (e) {
                    console.warn('附件解析失败:', e)
                    fileList = []
                }
            }

            this.currentAttachments = fileList.map(file => ({
                ...file,
                fullUrl: `${this.$config.fileBaseURL}/${file.url}${file.name}`
            }))
            this.attachmentDialogVisible = true
        },

        handleRemove(file, fileList) {
            console.log('移除文件:', file, fileList)
            this.fileList = fileList
        },

        beforeRemove(file) {
            return this.$confirm(`确定移除 ${file.name}？`)
        },

        handleFileChange(file, fileList) {
            console.log('文件变化:', file, fileList)
            this.fileList = fileList
        },

        downloadFile(file) {
            if (!file.fullUrl) return
            window.open(file.fullUrl, '_blank')
        },

        // 分页方法
        handleSizeChange(val) {
            this.pageSize = val
            this.currentPage = 1
            this.getApplicationList()
        },

        handleCurrentChange(val) {
            this.currentPage = val
            this.getApplicationList()
        },

        // 修改查看附件方法
        viewAttachments(attachments) {
            let fileList = attachments
            if (typeof attachments === 'string') {
                try {
                    fileList = JSON.parse(attachments)
                } catch (e) {
                    console.warn('附件解析失败:', e)
                    fileList = []
                }
            }

            this.currentAttachments = fileList.map(file => ({
                ...file,
                fullUrl: `${this.$config.fileBaseURL}/${file.url}${file.name}`
            }))
            this.attachmentDialogVisible = true
        },
    }
}
</script>

<style scoped>
.application-page {
    padding: 20px;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.page-header h2 {
    margin: 0;
    font-size: 20px;
    display: flex;
    align-items: center;
}

.page-header h2 i {
    margin-right: 8px;
}

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

.detail-attachments {
    border-top: 1px solid #ebeef5;
    padding-top: 20px;
}

.attachment-list {
    margin-top: 10px;
}

.attachment-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #ebeef5;
}

.attachment-item:last-child {
    border-bottom: none;
}

.file-name {
    color: #606266;
}

.delete-button {
    color: #F56C6C;
}

.delete-button:hover {
    color: #f78989;
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

.file-actions {
    display: flex;
    gap: 10px;
}

.el-icon-view,
.el-icon-download {
    margin-right: 4px;
}
</style>