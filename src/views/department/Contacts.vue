<template>
    <div class="contacts">
        <div class="department-header">
            <h2>林地资源管理</h2>
            <div class="header-right">
                <el-button type="primary" size="small" @click="showAddDialog">
                    <i class="el-icon-plus"></i> 添加部门
                </el-button>
            </div>
        </div>

        <!-- 部门树形展示 -->
        <div class="department-tree">
            <div v-for="dept in departmentList" :key="dept.department_id" class="department-item">
                <div class="department-node" @contextmenu.prevent="showContextMenu($event, dept)">
                    <div class="department-info">
                        <el-button type="text" class="expand-btn" @click="toggleUserList(dept)">
                            <i :class="['el-icon-arrow-right', { 'expanded': dept.showUsers }]"></i>
                            <div class="dept-title">
                                <i class="el-icon-folder"></i>
                                <span class="department-name">{{ dept.department_name }}</span>
                            </div>
                        </el-button>
                    </div>
                </div>
                <!-- 用户列表 -->
                <div v-show="dept.showUsers" class="user-list-container">
                    <div class="user-list">
                        <div v-for="user in dept.users" :key="user.user_id" class="user-item" @contextmenu.prevent="showUserContextMenu($event, user)">
                            <div class="user-info">
                                <div class="user-avatar">
                                    <i class="el-icon-user"></i>
                                </div>
                                <div class="user-details">
                                    <span class="username">{{ user.username }}</span>
                                    <span class="identity">{{ getIdentityName(user.identity_id) }}</span>
                                </div>
                                <div class="user-contact">
                                    <span class="phone">{{ user.phone || '未设置' }}</span>
                                </div>
                            </div>
                            <div class="user-actions">
                                <el-button type="text" size="mini" @click="showEditUserDialog(user)">
                                    <i class="el-icon-edit"></i>
                                </el-button>
                                <el-button type="text" size="mini" @click="handleDeleteUser(user.user_id)">
                                    <i class="el-icon-delete"></i>
                                </el-button>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- 递归渲染子部门 -->
                <div class="children" v-if="dept.children && dept.children.length">
                    <div v-for="childDept in dept.children" :key="childDept.department_id" class="department-item">
                        <div class="department-node" @contextmenu.prevent="showContextMenu($event, childDept)">
                            <div class="department-info">
                                <el-button type="text" class="expand-btn" @click="toggleUserList(childDept)">
                                    <i :class="['el-icon-arrow-right', { 'expanded': childDept.showUsers }]"></i>
                                    <div class="dept-title">
                                        <i class="el-icon-folder"></i>
                                        <span class="department-name">{{ childDept.department_name }}</span>
                                    </div>
                                </el-button>
                            </div>
                        </div>
                        <!-- 子部门的用户列表 -->
                        <div v-show="childDept.showUsers" class="user-list-container">
                            <div class="user-list">
                                <div v-for="user in childDept.users" :key="user.user_id" class="user-item" @contextmenu.prevent="showUserContextMenu($event, user)">
                                    <div class="user-info">
                                        <div class="user-avatar">
                                            <i class="el-icon-user"></i>
                                        </div>
                                        <div class="user-details">
                                            <span class="username">{{ user.username }}</span>
                                            <span class="identity">{{ getIdentityName(user.identity_id) }}</span>
                                        </div>
                                        <div class="user-contact">
                                            <span class="phone">{{ user.phone || '未设置' }}</span>
                                        </div>
                                    </div>
                                    <div class="user-actions">
                                        <el-button type="text" size="mini" @click="showEditUserDialog(user)">
                                            <i class="el-icon-edit"></i>
                                        </el-button>
                                        <el-button type="text" size="mini" @click="handleDeleteUser(user.user_id)">
                                            <i class="el-icon-delete"></i>
                                        </el-button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- 递归渲染更深层级的子部门 -->
                        <div class="children" v-if="childDept.children && childDept.children.length">
                            <div v-for="grandChildDept in childDept.children" :key="grandChildDept.department_id">
                                <!-- 递归组件 -->
                                <department-item :dept="grandChildDept" />
                            </div>
                        </div>
                    </div>
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
            <div class="context-menu-item" @click="startDepartmentChat(selectedDepartment)">
                <i class="el-icon-chat-line-round"></i> 发起部门聊天
            </div>
            <div class="context-menu-item" @click="showSendAnnouncement(selectedDepartment)">
                <i class="el-icon-bell"></i> 发送部门公告
            </div>
        </div>

        <!-- 添加/编辑部门对话框 -->
        <el-dialog 
            :title="isEdit ? '编辑部门' : '添加部门'" 
            :visible.sync="showDepartmentDialog" 
            width="500px">
            <el-form :model="departmentForm" label-width="100px">
                <el-form-item label="部门名称">
                    <el-input 
                        v-model="departmentForm.department_name" 
                        placeholder="请入部门名称">
                    </el-input>
                </el-form-item>
            </el-form>
            <span slot="footer" class="dialog-footer">
                <el-button @click="showDepartmentDialog = false">取 消</el-button>
                <el-button type="primary" @click="handleSubmitDepartment">确 定</el-button>
            </span>
        </el-dialog>

        <!-- 添加/编辑用户对话框 -->
        <el-dialog 
            :title="isEditUser ? '编辑用户' : '添加用户'" 
            :visible.sync="showUserDialog" 
            width="500px">
            <el-form :model="userForm" label-width="100px">
                <el-form-item label="用户名">
                    <el-input 
                        v-model="userForm.username" 
                        placeholder="请输入用户名">
                    </el-input>
                </el-form-item>
                <el-form-item label="密码" v-if="!isEditUser || changePassword">
                    <div class="password-input" v-if="isEditUser">
                        <el-checkbox v-model="changePassword" @change="handlePasswordChange">修改密码</el-checkbox>
                    </div>
                    <el-input 
                        v-model="userForm.password" 
                        type="password"
                        placeholder="请输入新密码">
                    </el-input>
                </el-form-item>
                <el-form-item label="手机号">
                    <el-input 
                        v-model="userForm.phone" 
                        placeholder="请输入手机号">
                    </el-input>
                </el-form-item>
                <el-form-item label="用户身份">
                    <el-select v-model="userForm.identity_id" placeholder="请选择用户身份">
                        <el-option
                            v-for="item in identityList"
                            :key="item.identity_id"
                            :label="item.identity_name"
                            :value="item.identity_id">
                        </el-option>
                    </el-select>
                </el-form-item>
            </el-form>
            <span slot="footer" class="dialog-footer">
                <el-button @click="showUserDialog = false">取 消</el-button>
                <el-button type="primary" @click="handleSubmitUser">确 定</el-button>
            </span>
        </el-dialog>

        <!-- 用户右键菜单 -->
        <div v-show="userContextMenuVisible" :style="userContextMenuStyle" class="context-menu">
            <div class="context-menu-item" @click="startChat(selectedUser)">
                <i class="el-icon-chat-line-round"></i> 发起私聊
            </div>
        </div>

        <!-- 发送公告对话框 -->
        <el-dialog 
            title="发送部门公告" 
            :visible.sync="showAnnouncementDialog" 
            width="500px">
            <el-form :model="announcementForm" label-width="80px">
                <el-form-item label="公告标题">
                    <el-input 
                        v-model="announcementForm.title" 
                        placeholder="请输入公告标题">
                    </el-input>
                </el-form-item>
                <el-form-item label="公告内容">
                    <el-input 
                        v-model="announcementForm.content" 
                        type="textarea"
                        :rows="4"
                        placeholder="请输入公告内容">
                    </el-input>
                </el-form-item>
            </el-form>
            <span slot="footer" class="dialog-footer">
                <el-button @click="showAnnouncementDialog = false">取 消</el-button>
                <el-button type="primary" @click="handleSubmitAnnouncement">发 送</el-button>
            </span>
        </el-dialog>
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
            userContextMenuVisible: false,
            userContextMenuStyle: {
                top: '0px',
                left: '0px'
            },
            selectedUser: null,
            currentUserDeptId: null,
            affiliatedDepartments: [],
            showAnnouncementDialog: false,
            announcementForm: {
                department_id: null,
                content: '',
                title: ''
            }
        }
    },
    created() {
        this.fetchDepartmentList()
        this.fetchIdentityList()
        this.getCurrentUserDept()
        // 添加点击其他地方关闭右键菜单的监听
        document.addEventListener('click', () => {
            this.hideContextMenu()
            this.hideUserContextMenu()
        })
    },
    beforeDestroy() {
        // 移除监听器
        document.removeEventListener('click', () => {
            this.hideContextMenu()
            this.hideUserContextMenu()
        })
    },
    methods: {
        // 从原 Department.vue 复制所有部门管理相关方法
        async fetchDepartmentList() {
            try {
                const response = await axios.post('/department/list')
                if (response.data.code === 20000) {
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
                users: [],
                children: dept.children || []
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

        // 添加取身份列表的方法
        async fetchIdentityList() {
            try {
                const response = await axios.post('/identity/list')
                if (response.data.code === config.successCode) {
                    this.identityList = response.data.data.identity_list
                } else {
                    throw new Error(response.data.msg)
                }
            } catch (error) {
                this.$message.error('获取身份列表失' + error.message)
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
        },

        // 处理部门表单提交
        async handleSubmitDepartment() {
            try {
                const url = this.isEdit ? '/department/modify' : '/department/create'
                const response = await axios.post(url, this.departmentForm)
                
                if (response.data.code === 20000) {
                    this.$message.success(this.isEdit ? '部门更新成功' : '部门添加成功')
                    this.showDepartmentDialog = false
                    await this.fetchDepartmentList() // 刷新部门列表
                } else {
                    throw new Error(response.data.msg)
                }
            } catch (error) {
                this.$message.error(this.isEdit ? '更新部门失败：' : '添加部门失败：' + error.message)
            }
        },

        // 显示编辑对话框
        showEditDialog(department) {
            this.isEdit = true
            this.departmentForm = {
                department_id: department.department_id,
                department_name: department.department_name,
                department_parent_id: department.department_parent_id
            }
            this.showDepartmentDialog = true
            this.hideContextMenu()
        },

        // 处理删除部门
        async handleDelete(departmentId) {
            try {
                await this.$confirm('确认删除该部门吗？', '提', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                })

                const response = await axios.post('/department/del', {
                    department_id: departmentId
                })

                if (response.data.code === 20000) {
                    this.$message.success('删除部门成功')
                    await this.fetchDepartmentList() // 刷新部门列表
                } else {
                    throw new Error(response.data.msg)
                }
            } catch (error) {
                if (error !== 'cancel') {
                    this.$message.error('删除部门失败：' + error.message)
                }
            }
            this.hideContextMenu()
        },

        // 显示添加用户对话框
        showAddUserDialog(departmentId) {
            this.isEditUser = false
            this.userForm = {
                username: '',
                password: '',
                phone: '',
                department_id: departmentId,
                user_id: null,
                identity_id: null
            }
            this.showUserDialog = true
            this.hideContextMenu()
        },

        // 显示编辑用户对话框
        showEditUserDialog(user) {
            this.isEditUser = true
            this.changePassword = false // 重置修改密码选项
            this.userForm = {
                ...user,
                password: '' // 清空密码字段
            }
            this.showUserDialog = true
        },

        // 处理删除用户
        async handleDeleteUser(userId) {
            try {
                await this.$confirm('确认删除该用户吗？', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                })

                const response = await axios.post('/user/delete', {
                    user_id: userId
                })

                if (response.data.code === config.successCode) {
                    this.$message.success('删除用户成功')
                    // 刷新当前部门的用户列表
                    const department = this.findDepartmentByUserId(userId)
                    if (department) {
                        await this.toggleUserList(department)
                    }
                } else {
                    throw new Error(response.data.msg)
                }
            } catch (error) {
                if (error !== 'cancel') {
                    this.$message.error('删除用户失败：' + error.message)
                }
            }
        },

        // 查找用户所在的部门
        findDepartmentByUserId(userId) {
            for (const dept of this.departmentList) {
                if (dept.users && dept.users.some(user => user.user_id === userId)) {
                    return dept
                }
            }
            return null
        },

        // 处理用户表单提交
        async handleSubmitUser() {
            try {
                const url = this.isEditUser ? '/user/modify' : '/user/create'
                
                // 创建要提交的数据对象
                const submitData = {
                    username: this.userForm.username,
                    phone: this.userForm.phone,
                    identity_id: this.userForm.identity_id
                }
                
                // 如果是编辑模式，添加user_id
                if (this.isEditUser) {
                    submitData.user_id = this.userForm.user_id
                }
                
                // 只有在以下情况添加password字段：
                // 1. 新建用户
                // 2. 编辑用户且选择修改密码且密码为空
                if (!this.isEditUser || (this.isEditUser && this.changePassword && this.userForm.password)) {
                    submitData.password = this.userForm.password
                }

                const response = await axios.post(url, submitData)
                
                if (response.data.code === 20000) {
                    this.$message.success(this.isEditUser ? '用户更新成功' : '用户添加成功')
                    this.showUserDialog = false
                    this.changePassword = false // 重置修改密码选项
                    
                    // 刷新当前部门的用户列��
                    const department = this.findDepartmentById(this.userForm.department_id)
                    if (department) {
                        await this.toggleUserList(department)
                    }
                } else {
                    throw new Error(response.data.msg)
                }
            } catch (error) {
                this.$message.error(this.isEditUser ? '更新用户失败：' : '添加用户失败：' + error.message)
            }
        },

        // 根据部门ID查找部门
        findDepartmentById(departmentId) {
            const findDept = (deptList) => {
                for (const dept of deptList) {
                    if (dept.department_id === departmentId) {
                        return dept
                    }
                    if (dept.children && dept.children.length) {
                        const found = findDept(dept.children)
                        if (found) return found
                    }
                }
                return null
            }
            return findDept(this.departmentList)
        },

        // 处理密码修改选项变化
        handlePasswordChange(val) {
            if (!val) {
                this.userForm.password = '' // 取消修改密码时清空密码字段
            }
        },

        // 显示用户右键菜单
        showUserContextMenu(event, user) {
            this.userContextMenuVisible = true
            this.userContextMenuStyle = {
                top: `${event.clientY}px`,
                left: `${event.clientX}px`
            }
            this.selectedUser = user
            event.stopPropagation()
        },

        // 隐藏用户右键菜单
        hideUserContextMenu() {
            this.userContextMenuVisible = false
        },

        // 发起私聊
        async startChat(user) {
            try {
                // 发送初始化私聊请求
                const response = await axios.post('/chat/private/send', {
                    receiver_id: user.user_id
                })

                if (response.data.code === 20000) {
                    // 请求成功后跳转到消息页面
                    this.$router.push({
                        name: 'Messages',
                        params: { 
                            userId: user.user_id,
                            username: user.username,
                            addToList: true,
                            autoSelect: true  // 添加自动选择标记
                        }
                    })
                } else {
                    throw new Error(response.data.msg)
                }
            } catch (error) {
                this.$message.error('初始化私聊失败：' + error.message)
            }
            this.hideUserContextMenu()
        },

        // 获取当前用户部门信息
        async getCurrentUserDept() {
            try {
                const response = await this.$axios.post('/user/single/user/info')
                if (response.data.code === 20000) {
                    this.currentUserDeptId = response.data.data.department_id
                    this.affiliatedDepartments = response.data.data.affiliated_department || []
                }
            } catch (error) {
                console.error('获取用户部门信息失败:', error)
            }
        },

        // 检查是否可以与该部门聊天
        canChatWithDepartment(deptId) {
            return this.affiliatedDepartments.includes(deptId)
        },

        // 发起部门聊天
        async startDepartmentChat(department) {
            if (!this.canChatWithDepartment(department.department_id)) {
                this.$message.warning('只能与自己所在部门或关联部门进行聊天')
                return
            }

            try {
                // 发送初始化群聊请求
                const response = await this.$axios.post('/chat/group/send', {
                    receiver_id: department.department_id,
                })

                if (response.data.code === 20000) {
                    // 请求成功后跳转到消息页面
                    this.$router.push({
                        name: 'Messages',
                        params: { 
                            groupId: department.department_id,
                            groupName: department.department_name,
                            addToList: true,
                            autoSelect: true
                        }
                    })
                } else {
                    throw new Error(response.data.msg)
                }
            } catch (error) {
                this.$message.error('初始化部门聊天失败：' + error.message)
            }
            this.hideContextMenu()
        },

        // 显示发送公告对话框
        showSendAnnouncement(department) {
            if (!this.canChatWithDepartment(department.department_id)) {
                this.$message.warning('只能向自己所在部门或关联部门发送公告')
                return
            }
            
            this.announcementForm = {
                department_id: department.department_id,
                content: '',
                title: ''
            }
            this.showAnnouncementDialog = true
            this.hideContextMenu()
        },

        // 发送部门公告
        async handleSubmitAnnouncement() {
            if (!this.announcementForm.title.trim() || !this.announcementForm.content.trim()) {
                this.$message.warning('公告标题和内容不能为空')
                return
            }

            try {
                const response = await this.$axios.post('/department_affiche/create', {
                    department_id: this.announcementForm.department_id,
                    title: this.announcementForm.title.trim(),
                    content: this.announcementForm.content.trim()
                })

                if (response.data.code === 20000) {
                    this.$message.success('公告发送成功')
                    this.showAnnouncementDialog = false
                } else {
                    throw new Error(response.data.msg || '发送失败')
                }
            } catch (error) {
                this.$message.error('发送公告失败：' + error.message)
            }
        }
    }
}
</script>

<style scoped>
.contacts {
    height: 100%;
    background-color: #f5f7fa;
    padding: 20px;
}

.department-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 0 10px;
}

.department-header h2 {
    font-size: 20px;
    color: #333;
    margin: 0;
}

.department-tree {
    background: #fff;
    border-radius: 4px;
    padding: 15px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    border: 1px solid #ebeef5;
}

.department-item {
    margin-bottom: 2px;
    position: relative;
}

.department-node {
    padding: 8px;
    border-radius: 4px;
    transition: background-color 0.3s;
    display: flex;
    align-items: center;
}

.department-node:hover {
    background-color: #f5f7fa;
}

.department-info {
    display: flex;
    align-items: center;
    flex: 1;
}

.expand-btn {
    display: flex;
    align-items: center;
    padding: 0;
    width: 100%;
}

.el-icon-arrow-right {
    transition: transform 0.3s;
    margin-right: 8px;
    font-size: 12px;
    width: 12px;
    height: 12px;
    flex-shrink: 0;
}

.el-icon-arrow-right.expanded {
    transform: rotate(90deg);
}

.dept-title {
    display: flex;
    align-items: center;
    flex: 1;
}

.el-icon-folder {
    color: #409EFF;
    margin-right: 8px;
    font-size: 16px;
    width: 16px;
    height: 16px;
    flex-shrink: 0;
}

.department-name {
    font-size: 14px;
    color: #333;
    margin-right: 8px;
    flex: 1;
}

.user-list-container {
    margin-left: 24px;
    margin-top: 8px;
}

.user-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border-radius: 4px;
    transition: background-color 0.3s;
}

.user-item:hover {
    background-color: #f5f7fa;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 12px;
}

.user-avatar {
    width: 32px;
    height: 32px;
    background-color: #e6f1fc;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.user-avatar i {
    color: #409EFF;
}

.user-details {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.username {
    font-size: 14px;
    color: #333;
}

.identity {
    font-size: 12px;
    color: #909399;
}

.user-contact {
    margin-left: 24px;
}

.phone {
    font-size: 13px;
    color: #606266;
}

.user-actions {
    opacity: 0;
    transition: opacity 0.3s;
}

.user-item:hover .user-actions {
    opacity: 1;
}

.context-menu {
    position: fixed;
    background: white;
    border-radius: 4px;
    padding: 5px 0;
    min-width: 150px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    z-index: 3000;
}

.context-menu-item {
    padding: 8px 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
}

.context-menu-item:hover {
    background-color: #f5f7fa;
}

.context-menu-item i {
    font-size: 16px;
    color: #909399;
}

.children {
    margin-left: 28px;
    border-left: 1px solid #ebeef5;
    padding-left: 16px;
}

.department-item::before {
    content: '';
    position: absolute;
    left: -16px;
    top: 18px;
    width: 16px;
    height: 1px;
    background-color: #ebeef5;
}

.password-input {
    margin-bottom: 10px;
}

.el-checkbox {
    color: #606266;
}

.el-dialog__body {
    padding: 20px;
}

.el-form-item {
    margin-bottom: 20px;
}

.el-textarea__inner {
    font-family: inherit;
}
</style>