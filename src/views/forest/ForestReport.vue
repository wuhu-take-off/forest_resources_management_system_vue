<template>
    <div class="forest-report">
        <div class="page-header">
            <h2><i class="el-icon-document"></i> 资源汇报</h2>
        </div>

        <el-card>
            <div slot="header">
                <span>汇报记录</span>
                <el-button style="float: right; margin-left: 10px" type="primary" size="small"
                    @click="showReportDialog">
                    新增汇报
                </el-button>
                <el-button style="float: right" type="success" size="small" @click="exportToExcel">
                    <i class="el-icon-download"></i> 导出Excel
                </el-button>
            </div>

            <el-table :data="reportList" border stripe>
                <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
                <el-table-column prop="forestName" label="林地名称" min-width="120">
                    <template slot-scope="scope">
                        {{ getForestName(scope.row.forestId) }}
                    </template>
                </el-table-column>
                <el-table-column prop="treeSpeciesName" label="树种名称" min-width="120">
                    <template slot-scope="scope">
                        {{ getTreeSpeciesName(scope.row.treeSpeciesId) }}
                    </template>
                </el-table-column>
                <el-table-column prop="forestResourceExamineTime" label="检查日期" width="180" align="center">
                    <template slot-scope="scope">
                        {{ formatDate(scope.row.forestResourceExamineTime) }}
                    </template>
                </el-table-column>
                <el-table-column prop="forestResourceExamineType" label="检查类型" width="120" align="center">
                    <template slot-scope="scope">
                        {{ getExamineTypeText(scope.row.forestResourceExamineType) }}
                    </template>
                </el-table-column>
                <el-table-column prop="forestStatus" label="林地状态" width="100" align="center">
                    <template slot-scope="scope">
                        <el-tag :type="getStatusTypeByCode(scope.row.forestStatus)">
                            {{ getStatusText(scope.row.forestStatus) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="监测数据" min-width="280">
                    <template slot-scope="scope">
                        <div>平高度: {{ scope.row.forestResourceExamineInfo.meanHeight }}m</div>
                        <div>平均胸径: {{ scope.row.forestResourceExamineInfo.meanDBH }}cm</div>
                        <div>密度: {{ scope.row.forestResourceExamineInfo.density }}株/亩</div>
                    </template>
                </el-table-column>
                <el-table-column prop="problemDes" label="问题描述" show-overflow-tooltip min-width="200"></el-table-column>
                <el-table-column prop="treatmentSuggestion" label="处理建议" show-overflow-tooltip
                    min-width="200"></el-table-column>
                <el-table-column label="资料" width="120" align="center">
                    <template slot-scope="scope">
                        <el-button v-if="scope.row.scenePhoto.length > 0" type="text"
                            @click="viewPhotos(scope.row.scenePhoto)">
                            <i class="el-icon-picture-outline"></i> 照片({{ scope.row.scenePhoto.length }})
                        </el-button>
                        <el-button v-if="scope.row.sceneVideo.length > 0" type="text"
                            @click="viewVideos(scope.row.sceneVideo)">
                            <i class="el-icon-video-camera"></i> 视频({{ scope.row.sceneVideo.length }})
                        </el-button>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="120" fixed="right" align="center">
                    <template slot-scope="scope">
                        <el-button type="text" @click="viewReport(scope.row)">
                            <i class="el-icon-view"></i> 查看
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>

            <div class="pagination">
                <el-pagination @current-change="handleCurrentChange" :current-page="currentPage" :page-size="5"
                    layout="total, prev, pager, next, jumper" :total="total">
                </el-pagination>
            </div>
        </el-card>

        <!-- 新增汇报对话框 -->
        <el-dialog title="新增汇报" :visible.sync="dialogVisible" width="60%" :close-on-click-modal="false"
            :modal-append-to-body="true" :append-to-body="true" :destroy-on-close="true" custom-class="report-dialog"
            @close="handleCancel">
            <el-form :model="reportForm" ref="reportForm" label-width="100px" :rules="rules" @submit.native.prevent>
                <el-tabs v-model="activeTab">
                    <!-- 基本信息和监测数据 -->
                    <el-tab-pane label="基本信息" name="basic">
                        <el-row :gutter="20">
                            <el-col :span="12">
                                <el-form-item label="林地选择" prop="forestId">
                                    <el-select v-model="reportForm.forestId" placeholder="请选择林地"
                                        style="width: calc(100% - 100px)">
                                        <el-option v-for="item in forestList" :key="item.forest_id"
                                            :label="item.forest_name" :value="item.forest_id">
                                        </el-option>
                                    </el-select>
                                    <el-button type="primary" size="small" style="margin-left: 10px"
                                        @click="showCreateForestDialog">
                                        新建林地
                                    </el-button>
                                </el-form-item>
                            </el-col>
                            <el-col :span="12">
                                <el-form-item label="树种" prop="treeSpeciesId">
                                    <el-select v-model="reportForm.treeSpeciesId" placeholder="请选择树种"
                                        style="width: calc(100% - 100px)">
                                        <el-option v-for="item in treeSpeciesList" :key="item.tree_species_id"
                                            :label="item.tree_species_name" :value="item.tree_species_id">
                                        </el-option>
                                    </el-select>
                                    <el-button type="primary" size="small" style="margin-left: 10px"
                                        @click="showCreateTreeSpeciesDialog">
                                        新增树种
                                    </el-button>
                                </el-form-item>
                            </el-col>
                        </el-row>

                        <el-row :gutter="20">
                            <el-col :span="12">
                                <el-form-item label="检查日期" prop="date">
                                    <el-date-picker v-model="reportForm.date" type="date" placeholder="选择日期">
                                    </el-date-picker>
                                </el-form-item>
                            </el-col>
                            <el-col :span="12">
                                <el-form-item label="检查类型" prop="type">
                                    <el-select v-model="reportForm.type" placeholder="请选择检查类型">
                                        <el-option label="常规巡检" value="常规巡检"></el-option>
                                        <el-option label="病虫害检查" value="病虫害检查"></el-option>
                                        <el-option label="生长状况检查" value="生长状况检查"></el-option>
                                    </el-select>
                                </el-form-item>
                            </el-col>
                        </el-row>

                        <el-row :gutter="20">
                            <el-col :span="24">
                                <el-form-item label="林地状态" prop="status">
                                    <el-radio-group v-model="reportForm.status">
                                        <el-radio label="良好">良好</el-radio>
                                        <el-radio label="一般">一般</el-radio>
                                        <el-radio label="需要关注">需特别关注</el-radio>
                                    </el-radio-group>
                                </el-form-item>
                            </el-col>
                        </el-row>

                        <el-divider content-position="left">监测数据</el-divider>

                        <el-row :gutter="20">
                            <el-col :span="8">
                                <el-form-item label="平均高度" prop="monitorData.height">
                                    <el-input-number v-model="reportForm.monitorData.height" :precision="2" :step="0.1"
                                        :min="0">
                                        <template slot="append">m</template>
                                    </el-input-number>
                                </el-form-item>
                            </el-col>
                            <el-col :span="8">
                                <el-form-item label="平均胸径" prop="monitorData.diameter">
                                    <el-input-number v-model="reportForm.monitorData.diameter" :precision="2"
                                        :step="0.1" :min="0">
                                        <template slot="append">cm</template>
                                    </el-input-number>
                                </el-form-item>
                            </el-col>
                            <el-col :span="8">
                                <el-form-item label="密度" prop="monitorData.density">
                                    <el-input-number v-model="reportForm.monitorData.density" :precision="0" :step="1"
                                        :min="0">
                                        <template slot="append">株/亩</template>
                                    </el-input-number>
                                </el-form-item>
                            </el-col>
                        </el-row>
                    </el-tab-pane>

                    <!-- 问题反馈 -->
                    <el-tab-pane label="问题反馈" name="issues">
                        <!-- <el-form-item label="存在问题" prop="issues">
                            <el-checkbox-group v-model="reportForm.issues">
                                <el-checkbox label="病虫害">病虫害</el-checkbox>
                                <el-checkbox label="生长不良">生长不良</el-checkbox>
                                <el-checkbox label="环境破坏">环境破坏</el-checkbox>
                                <el-checkbox label="他">其他</el-checkbox>
                            </el-checkbox-group>
                        </el-form-item> -->

                        <el-form-item label="问题描述" prop="description">
                            <el-input type="textarea" v-model="reportForm.description" rows="4"
                                placeholder="请详细描述发现的问题"></el-input>
                        </el-form-item>

                        <el-form-item label="处理建议" prop="suggestion">
                            <el-input type="textarea" v-model="reportForm.suggestion" rows="4"
                                placeholder="请输入处理建议"></el-input>
                        </el-form-item>
                    </el-tab-pane>

                    <!-- 资料上传 -->
                    <el-tab-pane label="资料上传" name="upload">
                        <el-form-item label="现场照片">
                            <el-upload action="#" list-type="picture-card" :auto-upload="false" :file-list="photoList"
                                :on-preview="handlePreview" :on-remove="handleRemove" :on-change="handlePhotoChange"
                                :before-upload="beforePhotoUpload" accept="image/*" multiple>
                                <i class="el-icon-plus"></i>
                            </el-upload>
                        </el-form-item>

                        <el-form-item label="视频记录">
                            <el-upload class="upload-video" action="#" :auto-upload="false" :file-list="videoList"
                                :on-remove="handleRemove" :on-change="handleVideoChange"
                                :before-upload="beforeVideoUpload" accept="video/mp4" multiple>
                                <el-button size="small" type="primary">点击上传视频</el-button>
                                <div slot="tip" class="el-upload__tip">支持mp4格式视频，大小不超过500MB</div>
                            </el-upload>
                        </el-form-item>
                    </el-tab-pane>
                </el-tabs>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click="handleCancel">取消</el-button>
                <el-button type="primary" @click="submitReport">提交</el-button>
            </div>
        </el-dialog>

        <!-- 图片预览 -->
        <el-dialog :visible.sync="previewVisible" width="70%" class="preview-dialog">
            <el-carousel v-if="previewImages.length > 1" height="500px">
                <el-carousel-item v-for="(url, index) in previewImages" :key="index">
                    <img :src="url" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                </el-carousel-item>
            </el-carousel>
            <img v-else :src="previewImages[0]" style="max-width: 100%;">
        </el-dialog>

        <!-- 新建林地对话框 -->
        <el-dialog title="新建林地" :visible.sync="createForestVisible" width="30%" :close-on-click-modal="false"
            :modal-append-to-body="true" :append-to-body="true" :destroy-on-close="true">
            <el-form :model="forestForm" ref="forestForm" label-width="80px" :rules="forestRules">
                <el-form-item label="林地名称" prop="forest_name">
                    <el-input v-model="forestForm.forest_name" placeholder="请输入林地名称"></el-input>
                </el-form-item>
            </el-form>
            <div slot="footer">
                <el-button @click="createForestVisible = false">取消</el-button>
                <el-button type="primary" @click="createForest">确定</el-button>
            </div>
        </el-dialog>

        <!-- 新建树种对话框 -->
        <el-dialog title="新建树种" :visible.sync="createTreeSpeciesVisible" width="30%" :close-on-click-modal="false"
            :modal-append-to-body="true" :append-to-body="true" :destroy-on-close="true">
            <el-form :model="treeSpeciesForm" ref="treeSpeciesForm" label-width="80px" :rules="treeSpeciesRules">
                <el-form-item label="树种名称" prop="tree_species_name">
                    <el-input v-model="treeSpeciesForm.tree_species_name" placeholder="请输入树种名称"></el-input>
                </el-form-item>
            </el-form>
            <div slot="footer">
                <el-button @click="createTreeSpeciesVisible = false">取消</el-button>
                <el-button type="primary" @click="createTreeSpecies">确定</el-button>
            </div>
        </el-dialog>
    </div>
</template>

<script>
import * as XLSX from 'xlsx'

export default {
    name: 'ForestReport',
    data() {
        return {
            activeTab: 'basic',
            reportList: [
                {
                    forestName: '东部杉木林',
                    date: '2024-03-15',
                    type: '常规巡检',
                    status: '良好',
                    monitorData: {
                        height: 15.5,
                        diameter: 20.3,
                        density: 180
                    },
                    issues: ['生长不良'],
                    description: '生长状况良好，局部区域需要关注',
                    reporter: '张三'
                },
                {
                    forestName: '南部竹林',
                    date: '2024-03-14',
                    type: '病虫害检查',
                    status: '需要关注',
                    monitorData: {
                        height: 12.8,
                        diameter: 18.5,
                        density: 220
                    },
                    issues: ['病虫害', '环境破坏'],
                    description: '发现局部病虫害，需要及时处理',
                    reporter: '李四'
                }
            ],
            currentPage: 1,
            total: 20,
            dialogVisible: false,
            previewVisible: false,
            previewUrl: '',
            photoList: [],
            videoList: [],
            reportForm: {
                forestId: '',
                treeSpeciesId: '',
                date: '',
                type: '',
                status: '',
                description: '',
                suggestion: '',
                issues: [],
                monitorData: {
                    height: 0,
                    diameter: 0,
                    density: 0
                }
            },
            rules: {
                forestId: [{ required: true, message: '请选择林地', trigger: 'change' }],
                treeSpeciesId: [{ required: true, message: '请选择树种', trigger: 'change' }],
                date: [{ required: true, message: '请选择检查日期', trigger: 'change' }],
                type: [{ required: true, message: '请选择检查类型', trigger: 'change' }],
                status: [{ required: true, message: '请选择林地状态', trigger: 'change' }]
            },
            forestList: [], // 林地列表
            createForestVisible: false, // 新建林地对话框显示状态
            forestForm: {
                forest_name: ''
            },
            forestRules: {
                forest_name: [
                    { required: true, message: '请输入林名称', trigger: 'blur' }
                ]
            },
            treeSpeciesList: [], // 树种列表
            createTreeSpeciesVisible: false, // 新建树种对话框显示状态
            treeSpeciesForm: {
                tree_species_name: ''
            },
            treeSpeciesRules: {
                tree_species_name: [
                    { required: true, message: '请输入树种名称', trigger: 'blur' }
                ]
            },
            previewImages: [], // 存储所有预览图片的 URL
            isEdit: false, // 是否是编辑模式
            editId: null,  // 正在编辑的记录ID
        }
    },
    methods: {
        getStatusType(status) {
            const types = {
                '良好': 'success',
                '一般': 'warning',
                '需要关注': 'danger'
            }
            return types[status] || 'info'
        },
        showReportDialog() {
            this.resetForm()
            this.$nextTick(() => {
                this.dialogVisible = true
            })
        },
        async handleCurrentChange(val) {
            this.currentPage = val
            await this.getReportList() // 切换页码后重新获取数据
        },
        async viewReport(row) {
            this.isEdit = true
            this.editId = row.forest_resource_info_id

            // 填充表单数据
            this.reportForm = {
                forestId: row.forestId,
                treeSpeciesId: row.treeSpeciesId,
                date: row.forestResourceExamineTime,
                type: this.getExamineTypeText(row.forestResourceExamineType),
                status: this.getStatusText(row.forestStatus),
                description: row.problemDes,
                suggestion: row.treatmentSuggestion,
                monitorData: {
                    height: row.forestResourceExamineInfo.meanHeight,
                    diameter: row.forestResourceExamineInfo.meanDBH,
                    density: row.forestResourceExamineInfo.density
                }
            }

            // 如果有照片和视频，需要显示已有的文件
            if (row.scenePhoto && row.scenePhoto.length) {
                this.photoList = row.scenePhoto.map(photo => ({
                    name: photo.name,
                    url: photo.url,
                    isExisting: true // 标记为已存在的文件
                }))
            }

            if (row.sceneVideo && row.sceneVideo.length) {
                this.videoList = row.sceneVideo.map(video => ({
                    name: video.name,
                    url: video.url,
                    isExisting: true // 标记为已存在的文件
                }))
            }

            this.dialogVisible = true
        },
        deleteReport(row) {
            this.$confirm('确认删除该汇报记录吗？', '提示', {
                type: 'warning'
            }).then(() => {
                this.$message.success('删除成功')
            }).catch(() => { })
        },
        handlePreview(file) {
            if (file.url) {
                this.previewUrl = file.url
                this.previewVisible = true
            }
        },
        handleRemove(file, fileList) {
            // 根据文件类型更新对应的列表
            if (file.raw.type.startsWith('image/')) {
                this.photoList = fileList
            } else if (file.raw.type.startsWith('video/')) {
                this.videoList = fileList
            }
        },
        handlePhotoChange(file, fileList) {
            this.photoList = fileList
        },
        handleVideoChange(file, fileList) {
            this.videoList = fileList
        },
        beforePhotoUpload(file) {
            const isImage = file.type.startsWith('image/')
            const isLt5M = file.size / 1024 / 1024 < 5

            if (!isImage) {
                this.$message.error('只能上传图片文件!')
                return false
            }
            if (!isLt5M) {
                this.$message.error('图片大小不能超过 5MB!')
                return false
            }
            return true
        },
        beforeVideoUpload(file) {
            const isMP4 = file.type === 'video/mp4'
            const isLt500M = file.size / 1024 / 1024 < 500

            if (!isMP4) {
                this.$message.error('只能上传 MP4 格式的视频!')
                return false
            }
            if (!isLt500M) {
                this.$message.error('视频大小不能超过 500MB!')
                return false
            }
            return true
        },
        submitReport() {
            this.$refs.reportForm.validate(valid => {
                if (!valid) {
                    this.$message.warning('请填写必要的信息')
                    return
                }

                // 构建提交数据
                const formData = new FormData()

                // 如果是编辑模式，添加ID
                if (this.isEdit) {
                    formData.append('forest_resource_info_id', this.editId)
                }

                // 添加基本信息
                formData.append('forestId', this.reportForm.forestId)
                formData.append('treeSpeciesId', this.reportForm.treeSpeciesId)
                formData.append('forestResourceExamineTime', this.reportForm.date)
                formData.append('forestResourceExamineType', this.getExamineType(this.reportForm.type))
                formData.append('forestStatus', this.getForestStatus(this.reportForm.status))

                // 添加检测数据
                const examineInfo = {
                    meanHeight: this.reportForm.monitorData.height,
                    meanDBH: this.reportForm.monitorData.diameter,
                    density: this.reportForm.monitorData.density
                }
                formData.append('forestResourceExamineInfo', JSON.stringify(examineInfo))

                // 添加问题描述和处理建议
                formData.append('problemDes', this.reportForm.description || '')
                formData.append('treatmentSuggestion', this.reportForm.suggestion || '')

                // 添加新上传的照片文件
                if (this.photoList.length > 0) {
                    this.photoList.forEach(file => {
                        if (file.raw && !file.isExisting) {
                            formData.append('scenePhoto', file.raw)
                        }
                    })
                }

                // 添加新上传的视频文件
                if (this.videoList.length > 0) {
                    this.videoList.forEach(file => {
                        if (file.raw && !file.isExisting) {
                            formData.append('sceneVideo', file.raw)
                        }
                    })
                }

                // 发送请求
                const url = this.isEdit ? '/forest_resource_info/modify' : '/forest_resource_info/create'
                this.$axios.post(url, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }).then(response => {
                    if (response.data.code === this.$config.successCode) {
                        this.$message.success(this.isEdit ? '修改成功' : '提交成功')
                        this.dialogVisible = false
                        this.resetForm()
                        this.getReportList() // 刷新列表
                    } else {
                        throw new Error(response.data.msg || '提交失败')
                    }
                }).catch(error => {
                    this.$message.error(error.message || '提交失败')
                })
            })
        },
        handleCancel() {
            this.dialogVisible = false
            this.$nextTick(() => {
                this.resetForm()
            })
        },
        handleClose(done) {
            this.dialogVisible = false
            this.$nextTick(() => {
                this.resetForm()
                done()
            })
        },
        hasFormChanged() {
            return this.reportForm.forestId ||
                this.reportForm.treeSpeciesId ||
                this.reportForm.date ||
                this.reportForm.type ||
                this.reportForm.status ||
                this.reportForm.description ||
                this.reportForm.issues.length > 0 ||
                this.reportForm.monitorData.height !== 0 ||
                this.reportForm.monitorData.diameter !== 0 ||
                this.reportForm.monitorData.density !== 0
        },
        // 获取林地列表
        async getForestList() {
            try {
                const response = await this.$axios.post('http://127.0.0.1:8000/forest_list')
                if (response.data.code === this.$config.successCode) {
                    this.forestList = response.data.data.forest_list
                } else {
                    throw new Error(response.data.msg || '获取林地列表失败')
                }
            } catch (error) {
                this.$message.error(error.message)
            }
        },

        // 显示新建林地对话框
        showCreateForestDialog() {
            this.createForestVisible = true
            this.forestForm.forest_name = ''
        },

        // 创建新林地
        async createForest() {
            this.$refs.forestForm.validate(async (valid) => {
                if (!valid) return

                try {
                    const response = await this.$axios.post('/forest/create', {
                        forest_name: this.forestForm.forest_name
                    })

                    if (response.data.code === this.$config.successCode) {
                        this.$message.success('创建成功')
                        this.createForestVisible = false
                        // 重新获取林地列表
                        await this.getForestList()
                    } else {
                        throw new Error(response.data.msg || '创建失败')
                    }
                } catch (error) {
                    this.$message.error(error.message)
                }
            })
        },

        // 获取树种列表
        async getTreeSpeciesList() {
            try {
                const response = await this.$axios.get('http://127.0.0.1:8000/tree_species_list')
                if (response.data.code === 20000) {
                    this.treeSpeciesList = response.data.data.tree_species_list
                } else {
                    throw new Error(response.data.msg || '获取树种列表失败')
                }
            } catch (error) {
                console.error('获取树种列表失败:', error)
                this.$message.error('获取树种列表失败')
            }
        },

        // 显示新建树种对话框
        showCreateTreeSpeciesDialog() {
            this.createTreeSpeciesVisible = true
            this.treeSpeciesForm.tree_species_name = ''
        },

        // 创建新树种
        async createTreeSpecies() {
            this.$refs.treeSpeciesForm.validate(async (valid) => {
                if (!valid) return

                try {
                    const response = await this.$axios.post('/tree_species/create', {
                        tree_species_name: this.treeSpeciesForm.tree_species_name
                    })

                    if (response.data.code === this.$config.successCode) {
                        this.$message.success('创建成功')
                        this.createTreeSpeciesVisible = false
                        // 重新获取树种列表
                        await this.getTreeSpeciesList()
                    } else {
                        throw new Error(response.data.msg || '创建失败')
                    }
                } catch (error) {
                    this.$message.error(error.message)
                }
            })
        },

        // 添加检查类型转换方法
        getExamineType(type) {
            const typeMap = {
                '常规巡检': 1,
                '病虫害检查': 2,
                '生长状况检查': 3
            }
            return typeMap[type] || 1
        },

        // 添加林地状态转换方法
        getForestStatus(status) {
            const statusMap = {
                '良好': 1,
                '一般': 2,
                '需要关注': 3
            }
            return statusMap[status] || 1
        },

        // 修改重置方法，增加编辑状态的重置
        resetForm() {
            this.isEdit = false
            this.editId = null
            this.reportForm = {
                forestId: '',
                treeSpeciesId: '',
                date: '',
                type: '',
                status: '',
                description: '',
                suggestion: '',
                issues: [],
                monitorData: {
                    height: 0,
                    diameter: 0,
                    density: 0
                }
            }
            this.photoList = []
            this.videoList = []
            this.activeTab = 'basic'

            this.$nextTick(() => {
                if (this.$refs.reportForm) {
                    this.$refs.reportForm.clearValidate()
                }
            })
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
                2: '般',
                3: '需要关注'
            }
            return statuses[status] || '未知状态'
        },

        // 根据状态码获取标签类型
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

        // 获取汇报列表
        async getReportList() {
            try {
                // 确保先获取树种和林地列表
                await Promise.all([
                    this.getTreeSpeciesList(),
                    this.getForestList()
                ])

                const response = await this.$axios.post('/forest_resource_info/list', {
                    page: this.currentPage,
                    limit: 5
                })

                if (response.data.code === 20000) {
                    this.reportList = response.data.data.forest_resource_info_list
                    this.total = response.data.data.total_count
                } else {
                    throw new Error(response.data.msg || '获取列表失败')
                }
            } catch (error) {
                console.error('获取汇报列表失败:', error)
                this.$message.error(error.message || '获取列表失败')
            }
        },

        // 获取林地名称
        getForestName(forestId) {
            if (!this.forestList || !forestId) return '未知林地'
            const forest = this.forestList.find(item => item.forest_id === forestId)
            return forest ? forest.forest_name : `未知林地(${forestId})`
        },

        // 获取树种名称
        getTreeSpeciesName(treeSpeciesId) {
            if (!this.treeSpeciesList || !treeSpeciesId) return '未知树种'
            const species = this.treeSpeciesList.find(item => item.tree_species_id === treeSpeciesId)
            return species ? species.tree_species_name : `未知树种(${treeSpeciesId})`
        },

        // 添加获取MIME类型的辅助方法
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

        // 导出Excel方法
        async exportToExcel() {
            try {
                // 获取所有数据
                const response = await this.$axios.post('/forest_resource_info/list', {
                    page: 1,
                    limit: 999999 // 获取所有数据
                })

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
                    XLSX.utils.book_append_sheet(wb, ws, '林地资源汇报记录')

                    // 生成文件名
                    const fileName = `林地资源汇报记录_${new Date().toLocaleDateString()}.xlsx`

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
    created() {
        // 先获取基础数据，再获取列表
        Promise.all([
            this.getTreeSpeciesList(),
            this.getForestList()
        ]).then(() => {
            this.getReportList()
        }).catch(error => {
            console.error('初始化数据失败:', error)
            this.$message.error('初始化数据失败')
        })
    }
}
</script>

<style>
/* 全局样式，确保对话框和遮罩层的层级关系正确 */
.el-dialog__wrapper {
    position: fixed !important;
    z-index: 2000 !important;
}

.v-modal {
    z-index: 1999 !important;
}

/* 确保下拉菜单等浮层在对话框之上 */
.el-select-dropdown,
.el-date-picker,
.el-picker-panel {
    z-index: 2100 !important;
}

/* 确保对话框内容可滚动 */
.el-dialog__body {
    max-height: 70vh;
    overflow-y: auto;
    padding: 20px;
}

/* 确保标签页内容可见 */
.el-tabs__content {
    overflow: visible !important;
}

/* 修复表单控件的样式 */
.el-form-item {
    margin-bottom: 22px;
}

.el-select {
    width: 100%;
}

.el-date-editor.el-input {
    width: 100%;
}

.el-input-number {
    width: 100%;
}

/* 添加到已有的全局样式中 */
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
/* 页面基础样式 */
.forest-report {
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

.pagination {
    margin-top: 20px;
    text-align: right;
}

/* 上传组件样式 */
.upload-video {
    text-align: left;
}

.el-upload__tip {
    line-height: 1.2;
}

/* 表单布局样式 */
.el-select {
    vertical-align: middle;
}

.el-button {
    vertical-align: middle;
}

/* 对话框内的表单样式 */
:deep(.el-dialog__body) {
    padding: 20px 20px 0 20px;
}

:deep(.el-form-item:last-child) {
    margin-bottom: 0;
}

:deep(.el-tabs__content) {
    padding: 20px 0;
}
</style>