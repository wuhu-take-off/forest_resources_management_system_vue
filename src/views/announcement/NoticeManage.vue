<template>
    <div class="notice-manage">
        <div class="page-header">
            <h2><i class="el-icon-setting"></i> 公告管理</h2>
            <el-button type="primary" @click="showAddDialog">
                <i class="el-icon-plus"></i> 新增公告
            </el-button>
        </div>

        <el-table :data="notices" border style="width: 100%">
            <el-table-column prop="noticeContent" label="公告标题" min-width="100" show-overflow-tooltip>
            </el-table-column>
            <el-table-column prop="noticePublisher" label="发布人" min-width="150">
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
            <el-table-column label="附件" min-width="100" align="center">
                <template slot-scope="scope">
                    <el-button v-if="scope.row.attachments && scope.row.attachments.length" type="text"
                        @click="viewAttachments(scope.row.attachments)">
                        <i class="el-icon-document"></i>
                        {{ scope.row.attachments.length }}个文件
                    </el-button>
                </template>
            </el-table-column>
            <el-table-column label="操作" min-width="150" fixed="right">
                <template slot-scope="scope">
                    <el-button type="text" @click="handleEdit(scope.row)">编辑</el-button>
                    <el-button type="text" class="delete-button" @click="handleDelete(scope.row)">删除</el-button>
                </template>
            </el-table-column>
        </el-table>

        <el-pagination @size-change="handleSizeChange" @current-change="handleCurrentChange" :current-page="currentPage"
            :page-sizes="[10, 20, 30, 50]" :page-size="pageSize" layout="total, sizes, prev, pager, next, jumper"
            :total="total">
        </el-pagination>

        <el-dialog :title="isEdit ? '编辑公告' : '新增公告'" :visible.sync="dialogVisible" width="60%">
            <el-form :model="noticeForm" ref="noticeForm" :rules="rules" label-width="100px">
                <el-form-item label="发布人" prop="noticePublisher">
                    <el-input v-model="noticeForm.noticePublisher"></el-input>
                </el-form-item>

                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="发布日期" prop="noticeTime">
                            <el-date-picker v-model="noticeForm.noticeTime" type="datetime" placeholder="选择日期时间"
                                format="yyyy-MM-dd HH:mm:ss" value-format="timestamp" style="width: 100%">
                            </el-date-picker>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="优先级" prop="noticePriority">
                            <el-select v-model="noticeForm.noticePriority" placeholder="请选择" style="width: 100%">
                                <el-option label="重要" :value="1"></el-option>
                                <el-option label="普通" :value="2"></el-option>
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-form-item label="公告内容" prop="noticeContent">
                    <el-input type="textarea" v-model="noticeForm.noticeContent" rows="6"></el-input>
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
                <el-button type="primary" @click="handleSubmit">确定</el-button>
            </div>
        </el-dialog>
    </div>
</template>

<script>
export default {
    name: 'NoticeManage',
    data() {
        return {
            notices: [],
            currentPage: 1,
            pageSize: 10,
            total: 0,
            dialogVisible: false,
            isEdit: false,
            noticeForm: {
                noticeId: '',
                noticePublisher: '',
                noticeTime: '',
                noticePriority: 2,
                noticeContent: ''
            },
            fileList: [],
            rules: {
                noticePublisher: [{ required: true, message: '请输入发布人', trigger: 'blur' }],
                noticeTime: [{ required: true, message: '请选择发布日期', trigger: 'change' }],
                noticePriority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
                noticeContent: [{ required: true, message: '请输入公告内容', trigger: 'blur' }]
            },
            baseURL: 'http://localhost:8000'
        }
    },
    created() {
        this.getNoticeList()
    },
    methods: {
        // 获取公告列表
        async getNoticeList() {
            try {
                const res = await this.$axios.post(`${this.baseURL}/notice/list`, {
                    page: this.currentPage,
                    limit: this.pageSize
                })

                if (res.data.code === this.$config.successCode) {
                    this.notices = res.data.data.notice_list.map(notice => ({
                        ...notice,
                        attachments: notice.noticeAnnex ?
                            (typeof notice.noticeAnnex === 'string' ?
                                JSON.parse(notice.noticeAnnex) :
                                notice.noticeAnnex) :
                            []
                    }))
                    this.total = res.data.data.total_count
                } else {
                    this.$message.error(res.data.message || '获取公告列表失败')
                }
            } catch (error) {
                console.error('获取公告列表失败:', error)
                this.$message.error('获取公告列表失败')
            }
        },

        // 处理提交
        async handleSubmit() {
            this.$refs.noticeForm.validate(async (valid) => {
                if (valid) {
                    try {
                        const formData = new FormData()

                        Object.keys(this.noticeForm).forEach(key => {
                            if (key === 'noticeTime') {
                                formData.append(key, Math.floor(this.noticeForm[key] / 1000))
                            } else {
                                formData.append(key, this.noticeForm[key])
                            }
                        })

                        // 添加附件
                        this.fileList.forEach(file => {
                            if (file.raw) {
                                formData.append('noticeAnnex', file.raw)
                            }
                        })

                        const url = this.isEdit ?
                            `${this.baseURL}/notice/modify` :
                            `${this.baseURL}/notice/create`
                        const res = await this.$axios.post(url, formData)

                        if (res.data.code === this.$config.successCode) {
                            this.$message.success(this.isEdit ? '修改成功' : '添加成功')
                            this.dialogVisible = false
                            this.getNoticeList()
                        } else {
                            this.$message.error(res.data.message || (this.isEdit ? '修改失败' : '添加失败'))
                        }
                    } catch (error) {
                        console.error(this.isEdit ? '修改失败' : '添加失败', error)
                        this.$message.error(this.isEdit ? '修改失败' : '添加失败')
                    }
                }
            })
        },

        // 处理删除
        async handleDelete(row) {
            try {
                await this.$confirm('确认删除该公告吗？', '提示', {
                    type: 'warning'
                })

                const res = await this.$axios.post(`${this.baseURL}/notice/del`, {
                    notice_id: row.noticeId
                })

                if (res.data.code === this.$config.successCode) {
                    this.$message.success('删除成功')
                    this.getNoticeList()
                } else {
                    this.$message.error(res.data.message || '删除失败')
                }
            } catch (error) {
                if (error !== 'cancel') {
                    console.error('删除失败:', error)
                    this.$message.error('删除失败')
                }
            }
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

        // 处理每页显示数量变化
        handleSizeChange(val) {
            this.pageSize = val
            this.currentPage = 1
            this.getNoticeList()
        },

        // 处理页码变化
        handleCurrentChange(val) {
            this.currentPage = val
            this.getNoticeList()
        },

        // 显示新增对话框
        showAddDialog() {
            this.isEdit = false
            this.noticeForm = {
                noticeId: '',
                noticePublisher: '',
                noticeTime: Date.now(),
                noticePriority: 2,
                noticeContent: ''
            }
            this.fileList = []
            this.dialogVisible = true

            this.$nextTick(() => {
                if (this.$refs.noticeForm) {
                    this.$refs.noticeForm.clearValidate()
                }
            })
        },

        // 编辑公告
        handleEdit(row) {
            this.isEdit = true
            this.noticeForm = {
                noticeId: row.noticeId,
                noticePublisher: row.noticePublisher,
                noticeTime: row.noticeTime * 1000,
                noticePriority: row.noticePriority,
                noticeContent: row.noticeContent
            }
            this.fileList = row.attachments || []
            this.dialogVisible = true

            this.$nextTick(() => {
                if (this.$refs.noticeForm) {
                    this.$refs.noticeForm.clearValidate()
                }
            })
        },

        // 处理文件预览
        handlePreview(file) {
            const fileUrl = `${this.$config.fileBaseURL}/${file.url}${file.name}`
            window.open(fileUrl, '_blank')
        },

        // 处理文件移除
        handleRemove(file, fileList) {
            this.fileList = fileList
        },

        // 处理文件移除前的确认
        beforeRemove(file) {
            return this.$confirm(`确定移除 ${file.name}？`)
        },

        // 处理文件变化
        handleFileChange(file, fileList) {
            this.fileList = fileList
        },

        // 查看附件
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
        }
    }
}
</script>

<style scoped>
.notice-manage {
    padding: 20px;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.page-header h2 {
    display: flex;
    align-items: center;
    font-size: 20px;
    margin: 0;
}

.page-header h2 i {
    margin-right: 8px;
}

.delete-button {
    color: #F56C6C;
}

.delete-button:hover {
    color: #f78989;
}

.upload-demo {
    margin-top: 10px;
}

.el-upload__tip {
    line-height: 1.2;
}

.el-select {
    width: 100%;
}

.el-date-picker {
    width: 100%;
}

.el-form-item {
    margin-bottom: 22px;
}

.el-row {
    margin-bottom: -22px;
}
</style>