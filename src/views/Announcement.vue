<template>
    <div class="announcement">
        <el-tabs v-model="activeTab" type="border-card">
            <!-- 政策信息展示 -->
            <el-tab-pane label="政策信息" name="policyInfo">
                <div class="operation-bar">
                    <el-input v-model="policySearch" placeholder="搜索政策" style="width: 200px;" clearable>
                        <i slot="prefix" class="el-icon-search"></i>
                    </el-input>
                </div>
                <el-timeline>
                    <el-timeline-item v-for="policy in filteredPolicies" :key="policy.id" :timestamp="policy.date"
                        placement="top" :type="policy.type">
                        <el-card>
                            <h4>{{ policy.title }}</h4>
                            <p>{{ policy.content }}</p>
                            <div class="policy-footer">
                                <span class="policy-department">发布部门：{{ policy.department }}</span>
                                <el-button type="text" @click="viewPolicyDetail(policy)">查看详情</el-button>
                            </div>
                        </el-card>
                    </el-timeline-item>
                </el-timeline>
            </el-tab-pane>

            <!-- 公告信息展示 -->
            <el-tab-pane label="公告信息" name="noticeInfo">
                <div class="operation-bar">
                    <el-input v-model="noticeSearch" placeholder="搜索公告" style="width: 200px;" clearable>
                        <i slot="prefix" class="el-icon-search"></i>
                    </el-input>
                </div>
                <div class="notice-list">
                    <el-card v-for="notice in filteredNotices" :key="notice.id" class="notice-item">
                        <div slot="header">
                            <span class="notice-title">{{ notice.title }}</span>
                            <el-tag size="small" :type="notice.priority === 'high' ? 'danger' : 'info'">
                                {{ notice.priority === 'high' ? '重要' : '普通' }}
                            </el-tag>
                        </div>
                        <div class="notice-content">{{ notice.content }}</div>
                        <div class="notice-footer">
                            <span>发布时间：{{ notice.date }}</span>
                            <span>发布人：{{ notice.publisher }}</span>
                            <el-button type="text" @click="viewNoticeDetail(notice)">查看详情</el-button>
                        </div>
                    </el-card>
                </div>
            </el-tab-pane>

            <!-- 政策管理 -->
            <el-tab-pane label="政策管理" name="policyManage">
                <div class="operation-bar">
                    <el-button type="primary" @click="showAddPolicyDialog">
                        <i class="el-icon-plus"></i> 新增政策
                    </el-button>
                </div>
                <el-table :data="policies" border style="width: 100%">
                    <el-table-column prop="title" label="政策标题" min-width="200"></el-table-column>
                    <el-table-column prop="department" label="发布部门" width="150"></el-table-column>
                    <el-table-column prop="date" label="发布日期" width="150"></el-table-column>
                    <el-table-column prop="type" label="类型" width="100">
                        <template slot-scope="scope">
                            <el-tag :type="scope.row.type === 'primary' ? 'primary' : 'success'">
                                {{ scope.row.type === 'primary' ? '重要' : '普通' }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="200" fixed="right">
                        <template slot-scope="scope">
                            <el-button type="text" @click="editPolicy(scope.row)">编辑</el-button>
                            <el-button type="text" class="delete-button" @click="deletePolicy(scope.row)">删除</el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </el-tab-pane>

            <!-- 公告管理 -->
            <el-tab-pane label="公告管理" name="noticeManage">
                <div class="operation-bar">
                    <el-button type="primary" @click="showAddNoticeDialog">
                        <i class="el-icon-plus"></i> 新增公告
                    </el-button>
                </div>
                <el-table :data="notices" border style="width: 100%">
                    <el-table-column prop="title" label="公告标题" min-width="200"></el-table-column>
                    <el-table-column prop="publisher" label="发布人" width="120"></el-table-column>
                    <el-table-column prop="date" label="发布日期" width="150"></el-table-column>
                    <el-table-column prop="priority" label="优先级" width="100">
                        <template slot-scope="scope">
                            <el-tag :type="scope.row.priority === 'high' ? 'danger' : 'info'">
                                {{ scope.row.priority === 'high' ? '重要' : '普通' }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="200" fixed="right">
                        <template slot-scope="scope">
                            <el-button type="text" @click="editNotice(scope.row)">编辑</el-button>
                            <el-button type="text" class="delete-button" @click="deleteNotice(scope.row)">删除</el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </el-tab-pane>
        </el-tabs>

        <!-- 政策详情对话框 -->
        <el-dialog title="政策详情" :visible.sync="policyDetailVisible" width="50%">
            <div v-if="selectedPolicy">
                <h3>{{ selectedPolicy.title }}</h3>
                <div class="detail-info">
                    <p><strong>发布部门：</strong>{{ selectedPolicy.department }}</p>
                    <p><strong>发布日期：</strong>{{ selectedPolicy.date }}</p>
                    <p><strong>政策内容：</strong></p>
                    <div class="detail-content">{{ selectedPolicy.content }}</div>
                </div>
            </div>
        </el-dialog>

        <!-- 公告详情对话框 -->
        <el-dialog title="公告详情" :visible.sync="noticeDetailVisible" width="50%">
            <div v-if="selectedNotice">
                <h3>{{ selectedNotice.title }}</h3>
                <div class="detail-info">
                    <p><strong>发布人：</strong>{{ selectedNotice.publisher }}</p>
                    <p><strong>发布日期：</strong>{{ selectedNotice.date }}</p>
                    <p><strong>公告内容：</strong></p>
                    <div class="detail-content">{{ selectedNotice.content }}</div>
                </div>
            </div>
        </el-dialog>
    </div>
</template>

<script>
export default {
    name: 'Announcement',
    data() {
        return {
            activeTab: 'policyInfo',
            policySearch: '',
            noticeSearch: '',
            policyDetailVisible: false,
            noticeDetailVisible: false,
            selectedPolicy: null,
            selectedNotice: null,
            // 政策列表假数据
            policies: [
                {
                    id: 1,
                    title: '关于加强林地资源保护的政策指导',
                    department: '林业局',
                    date: '2024-03-15',
                    type: 'primary',
                    content: '为加强林地资源保护，提升生态环境质量，特制定本政策...'
                },
                {
                    id: 2,
                    title: '林地资源可持续发展实施方案',
                    department: '环保局',
                    date: '2024-03-10',
                    type: 'success',
                    content: '为实现林地资源的可持续发展，特制定本实施方案...'
                }
            ],
            // 公告列表假数据
            notices: [
                {
                    id: 1,
                    title: '关于开展春季林地资源普查的通知',
                    publisher: '张主任',
                    date: '2024-03-18',
                    priority: 'high',
                    content: '定于2024年3月20日开始进行春季林地资源普查工作...'
                },
                {
                    id: 2,
                    title: '林地养护工作表彰公告',
                    publisher: '李经理',
                    date: '2024-03-16',
                    priority: 'normal',
                    content: '表彰在林地养护工作中表现突出的个人和团队...'
                }
            ]
        }
    },
    computed: {
        filteredPolicies() {
            return this.policies.filter(policy =>
                policy.title.toLowerCase().includes(this.policySearch.toLowerCase()) ||
                policy.content.toLowerCase().includes(this.policySearch.toLowerCase())
            )
        },
        filteredNotices() {
            return this.notices.filter(notice =>
                notice.title.toLowerCase().includes(this.noticeSearch.toLowerCase()) ||
                notice.content.toLowerCase().includes(this.noticeSearch.toLowerCase())
            )
        }
    },
    methods: {
        viewPolicyDetail(policy) {
            this.selectedPolicy = policy
            this.policyDetailVisible = true
        },
        viewNoticeDetail(notice) {
            this.selectedNotice = notice
            this.noticeDetailVisible = true
        },
        showAddPolicyDialog() {
            // 实现添加政策的逻辑
            this.$message.success('打开添加政策对话框')
        },
        showAddNoticeDialog() {
            // 实现添加公告的逻辑
            this.$message.success('打开添加公告对话框')
        },
        editPolicy(policy) {
            // 实现编辑政策的逻辑
            this.$message.success(`编辑政策：${policy.title}`)
        },
        editNotice(notice) {
            // 实现编辑公告的逻辑
            this.$message.success(`编辑公告：${notice.title}`)
        },
        deletePolicy(policy) {
            this.$confirm('确认删除该政策吗？', '提示', {
                type: 'warning'
            }).then(() => {
                // 实现删除政策的逻辑
                this.$message.success(`删除政策：${policy.title}`)
            }).catch(() => { })
        },
        deleteNotice(notice) {
            this.$confirm('确认删除该公告吗？', '提示', {
                type: 'warning'
            }).then(() => {
                // 实现删除公告的逻辑
                this.$message.success(`删除公告：${notice.title}`)
            }).catch(() => { })
        }
    }
}
</script>

<style scoped>
.announcement {
    padding: 20px;
}

.operation-bar {
    margin-bottom: 20px;
    display: flex;
    justify-content: flex-end;
}

.notice-list {
    margin-top: 20px;
}

.notice-item {
    margin-bottom: 20px;
}

.notice-title {
    font-size: 16px;
    font-weight: bold;
    margin-right: 10px;
}

.notice-content {
    margin: 10px 0;
    color: #666;
}

.notice-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #999;
    font-size: 14px;
}

.policy-footer {
    margin-top: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #999;
}

.policy-department {
    font-size: 14px;
}

.detail-info {
    margin-top: 20px;
}

.detail-content {
    margin-top: 10px;
    padding: 15px;
    background-color: #f8f8f8;
    border-radius: 4px;
    line-height: 1.6;
}

.delete-button {
    color: #F56C6C;
}

.delete-button:hover {
    color: #f78989;
}

/* 时间线样式优化 */
.el-timeline-item {
    margin-bottom: 20px;
}

.el-timeline-item__content {
    width: 100%;
}

/* 表格内的标签样式 */
.el-tag {
    margin-right: 5px;
}

/* 对话框内容样式 */
.el-dialog__body {
    padding: 20px 30px;
}
</style>