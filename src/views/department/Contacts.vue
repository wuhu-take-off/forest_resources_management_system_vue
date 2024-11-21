<template>
    <div class="contacts">
        <div class="department-header">
            <h2>部门管理</h2>
            <button class="add-btn" @click="showAddDialog">添加部门</button>
        </div>

        <!-- 部门树形展示 -->
        <div class="department-tree">
            <div v-for="dept in departmentList" :key="dept.department_id" class="department-item">
                <div class="department-node" @contextmenu.prevent="showContextMenu($event, dept)">
                    <div class="department-info">
                        <el-button type="text" class="expand-btn" @click="toggleUserList(dept)">
                            <i :class="['el-icon-arrow-right', { 'expanded': dept.showUsers }]"></i>
                            <span class="department-name">{{ dept.department_name }}</span>
                        </el-button>
                    </div>
                </div>
                <!-- 用户列表 -->
                <div v-show="dept.showUsers" class="user-list-container">
                    <div class="user-list">
                        <div class="user-list-header">
                            <div class="user-info">
                                <span class="col-username">用户名</span>
                                <span class="col-phone">手机号码</span>
                                <span class="col-identity">用户身份</span>
                            </div>
                            <div class="user-actions-header">
                                <span>操作</span>
                            </div>
                        </div>
                        <div v-for="user in dept.users" :key="user.user_id" class="user-item">
                            <div class="user-info">
                                <span class="col-username">{{ user.username }}</span>
                                <span class="col-phone">{{ user.phone || '未设置' }}</span>
                                <span class="col-identity">{{ getIdentityName(user.identity_id) }}</span>
                            </div>
                            <div class="user-actions">
                                <button @click="showEditUserDialog(user)">编辑</button>
                                <button @click="handleDeleteUser(user.user_id)">删除</button>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- 递归渲染子部门 -->
                <div class="children" v-if="dept.children && dept.children.length">
                    <!-- 递归部分的代码 -->
                </div>
            </div>
        </div>

        <!-- 右键菜单 -->
        <div v-show="contextMenuVisible" :style="contextMenuStyle" class="context-menu">
            <div class="context-menu-item" @click="showAddUserDialog(selectedDepartment.department_id)">
                <i class="el-icon-user-solid"></i> 添加用户
            </div>
            <div class="context-menu-item" @click="showEditDialog(selectedDepartment)">
                <i class="el-icon-edit"></i> 编辑部门
            </div>
            <div class="context-menu-item" @click="handleDelete(selectedDepartment.department_id)">
                <i class="el-icon-delete"></i> 删除部门
            </div>
            <div class="context-menu-item" @click="showAddDialog(selectedDepartment.department_id)">
                <i class="el-icon-plus"></i> 添加子部门
            </div>
        </div>

        <!-- 添加/编辑部门对话框 -->
        <div class="dialog" v-if="showDepartmentDialog">
            <!-- 部门对话框内容 -->
        </div>

        <!-- 添加/编辑用户对话框 -->
        <div class="dialog" v-if="showUserDialog">
            <!-- 用户对话框内容 -->
        </div>
    </div>
</template>

<script>
import axios from 'axios'
import config from '@/config'

export default {
    name: 'Contacts',
    data() {
        return {
            departmentList: [],
            userList: [],
            showDepartmentDialog: false,
            showUserDialog: false,
            isEdit: false,
            isEditUser: false,
            currentDepartmentId: null,
            departmentForm: {
                department_name: '',
                department_parent_id: 0,
                department_id: null
            },
            userForm: {
                username: '',
                password: '',
                phone: '',
                department_id: null,
                user_id: null,
                identity_id: null
            },
            changePassword: false,
            identityList: [],
            contextMenuVisible: false,
            contextMenuStyle: {
                top: '0px',
                left: '0px'
            },
            selectedDepartment: null,
        }
    },
    created() {
        this.fetchDepartmentList()
        this.fetchIdentityList()
        // 添加点击其他地方关闭右键菜单的监听
        document.addEventListener('click', this.hideContextMenu)
    },
    beforeDestroy() {
        // 移除监听器
        document.removeEventListener('click', this.hideContextMenu)
    },
    methods: {
        // 从原 Department.vue 复制所有部门管理相关方法
        async fetchDepartmentList() {
            try {
                const response = await axios.post('/department/list')
                if (response.data.code === config.successCode) {
                    this.departmentList = this.processDeparmentsData(response.data.data.department_list)
                } else {
                    throw new Error(response.data.msg)
                }
            } catch (error) {
                this.$message.error('获取部门列表失败：' + error.message)
            }
        },

        processDeparmentsData(departments) {
            return departments.map(dept => ({
                ...dept,
                showUsers: false,
                users: []
            }))
        },

        showAddDialog(parentId = 0) {
            this.isEdit = false
            this.departmentForm = {
                department_name: '',
                department_parent_id: parentId,
                department_id: null
            }
            this.showDepartmentDialog = true
        },

        // 添加获取身份列表的方法
        async fetchIdentityList() {
            try {
                const response = await axios.post('/identity/list')
                if (response.data.code === config.successCode) {
                    this.identityList = response.data.data.identity_list
                } else {
                    throw new Error(response.data.msg)
                }
            } catch (error) {
                this.$message.error('获取身份列表失败：' + error.message)
            }
        },

        // 添加获取身份名称的方法
        getIdentityName(identityId) {
            const identity = this.identityList.find(item => item.identity_id === identityId)
            return identity ? identity.identity_name : '未知身份'
        },

        // 添加切换用户列表显示的方法
        async toggleUserList(department) {
            department.showUsers = !department.showUsers
            if (department.showUsers && (!department.users || department.users.length === 0)) {
                try {
                    const response = await axios.post('/user/list', {
                        department_id: department.department_id
                    })

                    if (response.data.code === config.successCode) {
                        this.$set(department, 'users', response.data.data.user_lists)
                    } else {
                        throw new Error(response.data.msg)
                    }
                } catch (error) {
                    this.$message.error('获取用户列表失败：' + error.message)
                    department.showUsers = false
                }
            }
        },

        // 添加显示右键菜单的方法
        showContextMenu(event, department) {
            this.contextMenuVisible = true
            this.contextMenuStyle = {
                top: `${event.clientY}px`,
                left: `${event.clientX}px`
            }
            this.selectedDepartment = department
            event.stopPropagation()
        },

        // 添加隐藏右键菜单的方法
        hideContextMenu() {
            this.contextMenuVisible = false
        }
    }
}
</script>

<style scoped>
/* 从原 Department.vue 复制部门管理相关样式 */
</style>