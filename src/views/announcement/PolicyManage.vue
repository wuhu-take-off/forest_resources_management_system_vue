<template>
    <div class="policy-manage">
        <div class="page-header">
            <h2><i class="el-icon-edit-outline"></i> 政策管理</h2>
            <el-button type="primary" @click="showAddDialog">
                <i class="el-icon-plus"></i> 新增政策
            </el-button>
        </div>

        <el-table :data="policies" border style="width: 100%; margin-bottom: 20px;">
            <el-table-column prop="policyHeadline" label="政策标题" min-width="100" show-overflow-tooltip>
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
            <el-table-column label="附件" min-width="100" align="center">
                <template slot-scope="scope">
                    <el-button v-if="scope.row.attachments && scope.row.attachments.length" type="text"
                        @click="viewAttachments(scope.row.attachments)">
                        <i class="el-icon-document"></i>
                        {{ scope.row.attachments.length }}
                    </el-button>
                </template>
            </el-table-column>
            <el-table-column label="操作" min-width="150" fixed="right" align="center">
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

        <el-dialog :title="isEdit ? '编辑政策' : '新增政策'" :visible.sync="dialogVisible" width="60%">
            <el-form :model="policyForm" ref="policyForm" :rules="rules" label-width="100px">
                <el-form-item label="政策标题" prop="policyHeadline">
                    <el-input v-model="policyForm.policyHeadline"></el-input>
                </el-form-item>
                <el-form-item label="发布部门" prop="policyDepartment">
                    <el-input v-model="policyForm.policyDepartment"></el-input>
                </el-form-item>
                <el-form-item label="发布日期" prop="policyTime">
                    <el-date-picker v-model="policyForm.policyTime" type="datetime" placeholder="选择日期时间"
                        format="yyyy-MM-dd HH:mm:ss" value-format="timestamp" style="width: 100%">
                    </el-date-picker>
                </el-form-item>
                <el-form-item label="政策类型" prop="policyType">
                    <el-select v-model="policyForm.policyType" placeholder="请选择">
                        <el-option label="重要" :value="1">
                            <el-tag size="small" type="danger">重要</el-tag>
                        </el-option>
                        <el-option label="普通" :value="2">
                            <el-tag size="small" type="info">普通</el-tag>
                        </el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="政策内容" prop="policyContent">
                    <el-input type="textarea" v-model="policyForm.policyContent" rows="6"></el-input>
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

        <!-- 添加附件预览对话框 -->
        <el-dialog title="附件列表" :visible.sync="attachmentDialogVisible" width="50%" class="attachment-dialog">
            <div class="attachment-list">
                <div v-for="(file, index) in currentAttachments" :key="index" class="attachment-item">
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
        </el-dialog>
    </div>
</template>

<script>
export default {
    name: 'PolicyManage',
    data() {
        return {
            policies: [],
            currentPage: 1,
            pageSize: 10,
            total: 0,
            dialogVisible: false,
            isEdit: false,
            policyForm: {
                policyId: '',
                policyHeadline: '',
                policyDepartment: '',
                policyTime: '',
                policyType: 1,
                policyContent: ''
            },
            fileList: [],
            rules: {
                policyHeadline: [{ required: true, message: '请输入政策标题', trigger: 'blur' }],
                policyDepartment: [{ required: true, message: '请输入发布部门', trigger: 'blur' }],
                policyTime: [{ required: true, message: '请选择发布日期', trigger: 'change' }],
                policyType: [{ required: true, message: '请选择政策类型', trigger: 'change' }],
                policyContent: [{ required: true, message: '请输入政策内容', trigger: 'blur' }]
            },
            attachmentDialogVisible: false,
            currentAttachments: [],
        }
    },
    created() {
        this.getPolicyList()
    },
    methods: {
        // 获取政策列表
        async getPolicyList() {
            try {
                const res = await this.$axios.post('/policy/list', {
                    page: this.currentPage,
                    limit: this.pageSize
                })

                console.log('政策列表响应:', res)

                if (res.data.code === this.$config.successCode) {
                    // 处理附件字段 - 添加错误处理
                    this.policies = res.data.data.polityList.map(item => {
                        let attachments = []
                        try {
                            attachments = item.policyAnnex ? JSON.parse(item.policyAnnex) : []
                        } catch (e) {
                            console.warn('附件解析失败:', e)
                        }
                        return {
                            ...item,
                            attachments
                        }
                    })
                    this.total = res.data.data.total_count

                    // 如果当前页没有数据且不是第一页，则回到上一页
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

        // 处理每页显示数量变化
        handleSizeChange(val) {
            this.pageSize = val
            this.currentPage = 1 // 重置到第一页
            this.getPolicyList()
        },

        // 处理页码变化
        handleCurrentChange(val) {
            this.currentPage = val
            this.getPolicyList()
        },

        // 提交表单
        handleSubmit() {
            this.$refs.policyForm.validate(async (valid) => {
                if (valid) {
                    try {
                        const formData = new FormData()

                        Object.keys(this.policyForm).forEach(key => {
                            if (key === 'policyTime') {
                                formData.append(key, Math.floor(this.policyForm[key] / 1000))
                            } else {
                                formData.append(key, this.policyForm[key])
                            }
                        })

                        // 添加附件
                        this.fileList.forEach(file => {
                            if (file.raw) {
                                formData.append('policyAnnex', file.raw)
                            }
                        })

                        let res
                        if (this.isEdit) {
                            res = await this.$axios.post('/policy/modify', formData)
                        } else {
                            res = await this.$axios.post('/policy/create', formData)
                        }

                        if (res.data.code === this.$config.successCode) {
                            this.$message.success(this.isEdit ? '修改成功' : '添加成功')
                            this.dialogVisible = false
                            this.getPolicyList()
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

        // 删除政策
        handleDelete(row) {
            this.$confirm('确认删除该政策吗？', '提示', {
                type: 'warning'
            }).then(async () => {
                try {
                    const res = await this.$axios.post('/policy/del', {
                        policy_id: row.policyId
                    })

                    if (res.data.code === this.$config.successCode) {
                        this.$message.success('删除成功')
                        this.getPolicyList()
                    } else {
                        this.$message.error(res.data.message || '删除失败')
                    }
                } catch (error) {
                    console.error('删除失败:', error)
                    this.$message.error('删除失败')
                }
            }).catch(() => { })
        },

        // 编辑政策
        handleEdit(row) {
            this.isEdit = true
            this.policyForm = {
                policyId: row.policyId,
                policyHeadline: row.policyHeadline,
                policyDepartment: row.policyDepartment,
                policyTime: row.policyTime * 1000,
                policyType: row.policyType,
                policyContent: row.policyContent
            }
            this.fileList = row.attachments || []
            this.dialogVisible = true

            this.$nextTick(() => {
                if (this.$refs.policyForm) {
                    this.$refs.policyForm.clearValidate()
                }
            })
        },

        // 处理文件预览
        handlePreview(file) {
            // 构建完整的文件URL
            const fileUrl = `${this.$config.fileBaseURL}/${file.url}`
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

        // 判断文件是否可预览
        isPreviewable(file) {
            const previewableTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'jpg', 'jpeg', 'png', 'gif']
            const extension = file.name.split('.').pop().toLowerCase()
            return previewableTypes.includes(extension)
        },

        // 预览文件
        previewFile(file) {
            window.open(file.fullUrl, '_blank')
        },

        // 下载文件
        downloadFile(file) {
            const link = document.createElement('a')
            link.href = file.fullUrl
            link.download = file.name
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        },

        // 添加显示新增对话框方法
        showAddDialog() {
            this.isEdit = false
            this.policyForm = {
                policyId: '',
                policyHeadline: '',
                policyDepartment: '',
                policyTime: Date.now(),
                policyType: 2,
                policyContent: ''
            }
            this.fileList = []
            this.dialogVisible = true

            this.$nextTick(() => {
                if (this.$refs.policyForm) {
                    this.$refs.policyForm.clearValidate()
                }
            })
        },

        // 添加时间戳格式化方法
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
        }
    }
}
</script>

<style scoped>
.policy-manage {
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

.el-pagination {
    text-align: right;
    margin-top: 20px;
}

/* 添加表格相关样式 */
.el-table {
    font-size: 14px;
}

.el-table .cell {
    line-height: 20px;
    padding: 8px 0;
}

.el-button--text {
    padding: 0 8px;
}

.el-button--text+.el-button--text {
    margin-left: 8px;
}

.el-tag {
    margin: 0;
}

/* 添加附件预览对话框样式 */
.attachment-dialog {
    .attachment-list {
        max-height: 400px;
        overflow-y: auto;
    }

    .attachment-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        border-bottom: 1px solid #EBEEF5;
        transition: background-color 0.3s;

        &:hover {
            background-color: #F5F7FA;
        }

        &:last-child {
            border-bottom: none;
        }
    }

    .file-info {
        display: flex;
        align-items: center;
        flex: 1;
        min-width: 0;

        i {
            font-size: 20px;
            color: #909399;
            margin-right: 10px;
        }
    }

    .file-name {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-right: 20px;
    }

    .file-actions {
        display: flex;
        gap: 8px;

        .el-button {
            padding: 0 8px;

            &[disabled] {
                color: #C0C4CC;
                cursor: not-allowed;
            }

            i {
                font-size: 16px;
            }
        }
    }
}

/* 确保弹窗内的滚动条样式美观 */
.attachment-list::-webkit-scrollbar {
    width: 6px;
}

.attachment-list::-webkit-scrollbar-thumb {
    background-color: #909399;
    border-radius: 3px;
}

.attachment-list::-webkit-scrollbar-track {
    background-color: #F5F7FA;
}
</style>