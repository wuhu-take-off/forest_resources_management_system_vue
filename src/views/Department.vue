<template>
    <div class="department">
        <!-- 左侧部门管理 -->
        <div class="department-left">
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
                        <div v-for="child in dept.children" :key="child.department_id" class="department-item">
                            <div class="department-node" @contextmenu.prevent="showContextMenu($event, child)">
                                <div class="department-info">
                                    <el-button type="text" class="expand-btn" @click="toggleUserList(child)">
                                        <i :class="['el-icon-arrow-right', { 'expanded': child.showUsers }]"></i>
                                        <span class="department-name">{{ child.department_name }}</span>
                                    </el-button>
                                </div>
                            </div>
                            <!-- 子部门的用户列表 -->
                            <div v-show="child.showUsers" class="user-list-container">
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
                                    <div v-for="user in child.users" :key="user.user_id" class="user-item">
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
            </div>
        </div>

        <!-- 右侧聊天窗口 -->
        <div class="chat-window">
            <div class="chat-header">
                <h3>聊天窗口</h3>
            </div>
            <div class="chat-messages" ref="chatMessages">
                <div v-for="(message, index) in chatMessages" :key="index"
                    :class="['message-wrapper', message.type === 'sent' ? 'message-sent' : 'message-received']">
                    <div class="message-content" :class="message.contentType">
                        <!-- 文本消息 -->
                        <template v-if="message.contentType === 'text'">
                            {{ message.content }}
                        </template>
                        <!-- 文件消息 -->
                        <template v-else-if="message.contentType === 'file'">
                            <div class="file-message">
                                <i class="el-icon-document"></i>
                                <a :href="message.fileUrl" target="_blank">{{ message.content }}</a>
                            </div>
                        </template>
                    </div>
                    <div class="message-time">{{ message.time }}</div>
                </div>
            </div>
            <div class="chat-input">
                <div class="chat-toolbar">
                    <el-upload class="upload-demo" action="#" :show-file-list="false" :on-change="handleFileChange"
                        :auto-upload="false" multiple>
                        <el-button size="small" type="text">
                            <i class="el-icon-picture"></i>
                        </el-button>
                    </el-upload>
                    <el-upload class="upload-demo" action="#" :show-file-list="false" :on-change="handleFileChange"
                        :auto-upload="false" multiple>
                        <el-button size="small" type="text">
                            <i class="el-icon-document"></i>
                        </el-button>
                    </el-upload>
                    <el-popover placement="top" width="300" trigger="click">
                        <div class="emoji-picker">
                            <span v-for="emoji in emojiList" :key="emoji" @click="insertEmoji(emoji)"
                                class="emoji-item">
                                {{ emoji }}
                            </span>
                        </div>
                        <el-button slot="reference" size="small" type="text">
                            <i class="el-icon-magic-stick"></i>
                        </el-button>
                    </el-popover>
                </div>
                <el-input v-model="messageInput" type="textarea" :rows="3" placeholder="请输入消息..."
                    @keyup.enter.native.exact="sendMessage" @keyup.ctrl.enter.native="messageInput += '\n'">
                </el-input>
                <el-button type="primary" @click="sendMessage">发送</el-button>
            </div>
        </div>


        <!-- 添加/编辑部门对话框 -->
        <div class="dialog" v-if="showDepartmentDialog">
            <div class="dialog-content">
                <h3>{{ isEdit ? '编辑部门' : '添加部门' }}</h3>
                <div class="form-group">
                    <label>部门名：</label>
                    <input type="text" v-model="departmentForm.department_name" required>
                </div>
                <div class="dialog-actions">
                    <button @click="handleDepartmentSubmit">确定</button>
                    <button @click="showDepartmentDialog = false">取消</button>
                </div>
            </div>
        </div>

        <!-- 用户列表对话框 -->
        <div class="dialog" v-if="showUserListDialog">
            <div class="dialog-content">
                <h3>用户列表</h3>
                <div class="user-list">
                    <!-- 添加表头 -->
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
                    <!-- 用户列表内容 -->
                    <div v-for="user in userList" :key="user.user_id" class="user-item">
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
                <div class="dialog-actions">
                    <button @click="showUserListDialog = false">关闭</button>
                </div>
            </div>
        </div>

        <!-- 添加/编辑用户对话框 -->
        <div class="dialog" v-if="showUserDialog">
            <div class="dialog-content">
                <h3>{{ isEditUser ? '编辑用户' : '添加用户' }}</h3>
                <div class="form-group">
                    <label>用户名：</label>
                    <input type="text" v-model="userForm.username" required>
                </div>
                <div class="form-group">
                    <label>手机号：</label>
                    <input type="text" v-model="userForm.phone" placeholder="请输入手机号">
                </div>
                <div class="form-group">
                    <label>身份：</label>
                    <select v-model="userForm.identity_id" required>
                        <option value="">请选择身份</option>
                        <option v-for="identity in identityList" :key="identity.identity_id"
                            :value="identity.identity_id">
                            {{ identity.identity_name }}
                        </option>
                    </select>
                </div>
                <div class="form-group" v-if="!isEditUser">
                    <label>密码：</label>
                    <input type="password" v-model="userForm.password" required>
                </div>
                <div class="form-group" v-if="isEditUser">
                    <label>
                        <input type="checkbox" v-model="changePassword"> 修改密码
                    </label>
                </div>
                <div class="form-group" v-if="isEditUser && changePassword">
                    <label>新密码：</label>
                    <input type="password" v-model="userForm.password" required>
                </div>
                <div class="dialog-actions">
                    <button @click="handleUserSubmit">确定</button>
                    <button @click="showUserDialog = false">取消</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios'
import config from '@/config'
import WebSocketService from '@/services/websocket'

export default {
    name: 'Department',
    data() {
        return {
            departmentList: [],
            userList: [],
            showDepartmentDialog: false,
            showUserListDialog: false,
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
            // 聊天相关数据
            chatMessages: [],
            messageInput: '',
            emojiList: ['😀', '😂', '😊', '😍', '🤔', '😴', '😭', '😱', '🤮', '😇', '🤡', '🤠', '👻', '👍', '👎', '❤️', '💔', '🌹', '🌞', '🌚'],
            currentAttachments: [],
        }
    },
    created() {
        this.fetchDepartmentList()
        this.fetchIdentityList()
        // 连接 WebSocket
        WebSocketService.connect()
        // 添加消息处理器
        WebSocketService.addMessageHandler(this.handleWebSocketMessage)
    },
    mounted() {
        // 点击其他地方关闭右键菜单
        document.addEventListener('click', this.hideContextMenu)
    },
    beforeDestroy() {
        // 只移除消息处理器，不断开连接
        WebSocketService.removeMessageHandler(this.handleWebSocketMessage)
        document.removeEventListener('click', this.hideContextMenu)
    },
    methods: {
        // 部门相关方法
        async fetchDepartmentList() {
            try {
                const response = await axios.post('/department/list')
                if (response.data.code === config.successCode) {
                    // 递归部门添加 showUsers 和 users 属性
                    this.departmentList = this.processDeparmentsData(response.data.data.department_list)
                } else {
                    throw new Error(response.data.msg)
                }
            } catch (error) {
                alert('获取部门列表失败：' + error.message)
            }
        },

        // 添加递归处理部门数据的方法
        processDeparmentsData(departments) {
            return departments.map(dept => {
                const processedDept = {
                    ...dept,
                    showUsers: false,
                    users: []
                }
                if (dept.children && dept.children.length) {
                    processedDept.children = this.processDeparmentsData(dept.children)
                }
                return processedDept
            })
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

        showEditDialog(department) {
            this.isEdit = true
            this.departmentForm = {
                department_name: department.department_name,
                department_parent_id: department.department_parent_id,
                department_id: department.department_id
            }
            this.showDepartmentDialog = true
        },

        async handleDepartmentSubmit() {
            try {
                const url = this.isEdit ? '/department/modify' : '/department/create'
                const response = await axios.post(url, this.departmentForm)

                if (response.data.code === config.successCode) {
                    alert(this.isEdit ? '修改成功' : '添加成功')
                    this.showDepartmentDialog = false
                    this.fetchDepartmentList()
                } else {
                    throw new Error(response.data.msg)
                }
            } catch (error) {
                alert((this.isEdit ? '修改' : '添加') + '失败：' + error.message)
            }
        },

        async handleDelete(departmentId) {
            if (!confirm('确定要删除该部门吗？')) return

            try {
                const response = await axios.post('/department/del', {
                    department_id: departmentId
                })

                if (response.data.code === config.successCode) {
                    alert('删除成功')
                    this.fetchDepartmentList()
                } else {
                    throw new Error(response.data.msg)
                }
            } catch (error) {
                alert('删除失败：' + error.message)
            }
        },

        // 用户相关方法
        async showUserList(departmentId) {
            try {
                const response = await axios.post('/user/list', {
                    department_id: departmentId
                })

                if (response.data.code === config.successCode) {
                    this.userList = response.data.data.user_lists
                    this.currentDepartmentId = departmentId
                    this.showUserListDialog = true
                } else {
                    throw new Error(response.data.msg)
                }
            } catch (error) {
                alert('获取用户列表失败：' + error.message)
            }
        },

        showAddUserDialog(departmentId) {
            this.isEditUser = false
            this.userForm = {
                username: '',
                password: '',
                phone: '',
                department_id: departmentId,
                user_id: null,
                identity_id: ''
            }
            this.showUserDialog = true
        },

        showEditUserDialog(user) {
            this.isEditUser = true
            this.changePassword = false
            this.userForm = {
                username: user.username,
                phone: user.phone || '',
                password: '',
                department_id: user.department_id,
                user_id: user.user_id,
                identity_id: user.identity_id
            }
            this.showUserDialog = true
        },

        async handleUserSubmit() {
            try {
                const url = this.isEditUser ? '/user/modify' : '/user/create'
                const submitData = { ...this.userForm }

                if (this.isEditUser && !this.changePassword) {
                    delete submitData.password
                }

                const response = await axios.post(url, submitData)

                if (response.data.code === config.successCode) {
                    alert(this.isEditUser ? '修改成功' : '添加功')
                    this.showUserDialog = false
                    if (this.currentDepartmentId) {
                        this.showUserList(this.currentDepartmentId)
                    }
                } else {
                    throw new Error(response.data.msg)
                }
            } catch (error) {
                alert((this.isEditUser ? '修改' : '添加') + '失败：' + error.message)
            }
        },

        async handleDeleteUser(userId) {
            if (!confirm('确定要删除该用户吗？')) return

            try {
                const response = await axios.post('/user/del', {
                    user_id: userId
                })

                if (response.data.code === config.successCode) {
                    alert('删除成功')
                    if (this.currentDepartmentId) {
                        this.showUserList(this.currentDepartmentId)
                    }
                } else {
                    throw new Error(response.data.msg)
                }
            } catch (error) {
                alert('删除失败：' + error.message)
            }
        },

        async fetchIdentityList() {
            try {
                const response = await axios.post('/identity/list')
                if (response.data.code === config.successCode) {
                    this.identityList = response.data.data.identity_list
                } else {
                    throw new Error(response.data.msg)
                }
            } catch (error) {
                alert('获取身份列表失败：' + error.message)
            }
        },

        getIdentityName(identityId) {
            const identity = this.identityList.find(item => item.identity_id === identityId)
            return identity ? identity.identity_name : '未知身份'
        },

        // 显示右键菜单
        showContextMenu(event, department) {
            this.contextMenuVisible = true
            this.contextMenuStyle = {
                top: `${event.clientY}px`,
                left: `${event.clientX}px`
            }
            this.selectedDepartment = department
            event.stopPropagation()
        },

        // 隐藏右键菜单
        hideContextMenu() {
            this.contextMenuVisible = false
        },

        // 修改发送消息的方法
        async sendMessage() {
            if (!this.messageInput.trim()) return

            try {
                const token = localStorage.getItem('token')
                if (!token) {
                    window.location.href = 'http://localhost:8080'
                    return
                }

                // 发送消息使用 HTTP POST
                const response = await axios.post('/chat/private/send', {
                    receiver_id: 2,
                    message: this.messageInput.trim()
                }, {
                    headers: {
                        'Authorization': `${token}`
                    }
                })

                // 检查响应状态
                if (response.data.code === 40100) {
                    window.location.href = 'http://localhost:8080'
                    return
                }

                if (response.data.code === 20000) {
                    this.messageInput = ''
                } else {
                    throw new Error(response.data.msg || '发送失败')
                }
            } catch (error) {
                console.error('Error sending message:', error)
                if (error.response && error.response.data.code === 40100) {
                    window.location.href = 'http://localhost:8080'
                } else {
                    this.$message.error('发送消息失败')
                }
            }
        },

        // 处理接收到的消息
        handleWebSocketMessage(event) {
            try {
                const data = JSON.parse(event.data)
                const userId = parseInt(localStorage.getItem('userid'))

                let messageContent = {
                    content: data.msg,
                    type: data.send_id === userId ? 'sent' : 'received',
                    contentType: 'text',
                    time: new Date().toLocaleTimeString()
                }

                // 添加消息到聊天列表
                this.chatMessages.push(messageContent)
                this.$nextTick(() => {
                    this.scrollToBottom()
                })
            } catch (error) {
                console.error('Error parsing WebSocket message:', error)
            }
        },

        // 滚动到底部
        scrollToBottom() {
            const chatMessages = this.$refs.chatMessages
            chatMessages.scrollTop = chatMessages.scrollHeight
        },

        // 修改切换用户列表显示方法
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
                    alert('获取用户列表失败：' + error.message)
                    department.showUsers = false
                }
            }
        },

        handleFileChange(file) {
            // 判断文件类型
            if (this.isImage(file.raw)) {
                this.sendImageMessage(file.raw);
            } else {
                this.sendFileMessage(file.raw);
            }
        },

        isImage(file) {
            return file.type.startsWith('image/');
        },

        async sendImageMessage(file) {
            try {
                const formData = new FormData();
                formData.append('file', file);

                // 上传图片
                const response = await this.$axios.post('/upload', formData);

                if (response.data.code === 20000) {
                    const message = {
                        type: 'sent',
                        contentType: 'image',
                        content: response.data.data.url,
                        fileName: file.name,
                        time: new Date().toLocaleTimeString()
                    };
                    this.chatMessages.push(message);
                    this.scrollToBottom();
                }
            } catch (error) {
                this.$message.error('图片上传失败');
            }
        },

        async sendFileMessage(file) {
            try {
                const formData = new FormData();
                formData.append('file', file);

                // 上传文件
                const response = await this.$axios.post('/upload', formData);

                if (response.data.code === 20000) {
                    // 构造文件消息
                    const message = {
                        type: 2, // 文件消息类型
                        msg: response.data.data.url
                    }

                    // 发送到WebSocket
                    WebSocketService.ws.send(JSON.stringify(message))
                }
            } catch (error) {
                this.$message.error('文件发送失败')
            }
        },

        insertEmoji(emoji) {
            this.messageInput += emoji;
        },
    }
}
</script>

<style scoped>
.department-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.add-btn {
    padding: 8px 16px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.department-tree {
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 20px;
}

.department-item {
    margin-bottom: 10px;
}

.department-node {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    background-color: #f5f5f5;
    border-radius: 4px;
}

.department-actions button {
    margin-left: 10px;
    padding: 4px 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: white;
    cursor: pointer;
}

.children {
    margin-left: 30px;
    margin-top: 10px;
    border-left: 1px dashed #dcdfe6;
    padding-left: 20px;
}

.department-item {
    position: relative;
}

.department-item::before {
    content: '';
    position: absolute;
    left: -20px;
    top: 20px;
    width: 20px;
    height: 1px;
    border-top: 1px dashed #dcdfe6;
}

.dialog {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
}

.dialog-content {
    background-color: white;
    padding: 20px;
    border-radius: 4px;
    width: 400px;
}

.dialog-actions {
    margin-top: 20px;
    text-align: right;
}

.dialog-actions button {
    margin-left: 10px;
    padding: 8px 16px;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
}

.dialog-actions button:first-child {
    background-color: #4CAF50;
    color: white;
    border: none;
}

.form-group {
    margin-bottom: 15px;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
}

.form-group input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.department-info {
    display: flex;
    align-items: center;
    gap: 10px;
}

.user-btn {
    padding: 4px 8px;
    background-color: #2196F3;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.user-list {
    max-height: 300px;
    overflow-y: auto;
}

.user-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid #ddd;
}

.user-actions {
    display: flex;
    gap: 10px;
}

.user-actions button {
    padding: 4px 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
}

.dialog-content {
    min-width: 500px;
}

.user-info {
    display: flex;
    gap: 20px;
    align-items: center;
}

.user-phone {
    color: #666;
    font-size: 0.9em;
}

.form-group label input[type="checkbox"] {
    width: auto;
    margin-right: 8px;
}

.user-identity {
    background-color: #e0e0e0;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.9em;
}

.form-group select {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
}

/* 添加新的样式 */
.user-list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    background-color: #f5f5f5;
    border-bottom: 2px solid #ddd;
    font-weight: bold;
}

.user-list-header .user-info,
.user-item .user-info {
    display: grid;
    grid-template-columns: 200px 200px 200px;
    gap: 20px;
    align-items: center;
    flex: 1;
}

.col-username,
.col-phone,
.col-identity {
    font-size: 0.9em;
    padding: 4px 8px;
}

.col-identity {
    background-color: transparent;
    border-radius: 0;
    text-align: left;
}

.user-actions-header {
    width: 150px;
    text-align: center;
}

.user-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid #ddd;
}

.dialog-content {
    min-width: 800px;
    max-width: 1000px;
}

.user-list {
    max-height: 500px;
    overflow-y: auto;
}

.user-actions {
    width: 150px;
    display: flex;
    gap: 10px;
    justify-content: center;
}

/* 布局样式 */
.department {
    display: flex;
    gap: 20px;
    height: 100%;
}

.department-left {
    flex: 1;
    position: relative;
}

/* 右键菜单样式 */
.context-menu {
    position: fixed;
    background: white;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    padding: 5px 0;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, .1);
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

/* 聊天窗口样式 */
.chat-window {
    width: 500px;
    height: 100%;
    display: flex;
    flex-direction: column;
    border-left: 1px solid #dcdfe6;
    background-color: #f5f7fa;
}

.chat-header {
    padding: 15px;
    background-color: #fff;
    border-bottom: 1px solid #dcdfe6;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chat-header h3 {
    margin: 0;
    color: #303133;
    font-size: 16px;
}

.chat-messages {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 25px;
}

/* 消息包装器样式 */
.message-wrapper {
    display: flex;
    flex-direction: column;
    max-width: 70%;
    position: relative;
}

/* 发送的消息靠右 */
.message-sent {
    align-self: flex-end;
}

/* 接收的消息靠左 */
.message-received {
    align-self: flex-start;
}

/* 消息内容样式 */
.message-content {
    padding: 12px 16px;
    border-radius: 8px;
    word-break: break-word;
    position: relative;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    text-align: left;
}

/* 发送的消息样式 */
.message-sent .message-content {
    background-color: #95ec69;
    color: #000;
    margin-left: 20px;
    align-self: flex-end;
}

/* 接收的消息样式 */
.message-received .message-content {
    background-color: #ffffff;
    color: #000;
    margin-right: 20px;
    align-self: flex-start;
}

/* 消息时间样式 */
.message-time {
    font-size: 12px;
    color: #909399;
    position: absolute;
    top: -20px;
    padding: 0 8px;
}

.message-sent .message-time {
    right: 0;
}

.message-received .message-time {
    left: 0;
}

/* 文件消息样式 */
.message-content.file {
    padding: 8px;
    background-color: #fff;
}

.file-message {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    border-radius: 4px;
    background-color: rgba(0, 0, 0, 0.03);
}

.file-message a {
    color: #409EFF;
    text-decoration: none;
    font-size: 14px;
}

.file-message i {
    font-size: 20px;
    color: #909399;
}

/* 聊天输入区域样式 */
.chat-input {
    background-color: #fff;
    padding: 15px;
    border-top: 1px solid #dcdfe6;
}

.chat-toolbar {
    display: flex;
    gap: 15px;
    padding: 8px 0;
    border-bottom: 1px solid #EBEEF5;
}

/* 表情选择器样式 */
.emoji-picker {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 8px;
    padding: 12px;
}

.emoji-item {
    cursor: pointer;
    font-size: 22px;
    text-align: center;
    padding: 5px;
    border-radius: 4px;
    transition: background-color 0.2s;
}

.emoji-item:hover {
    background-color: #f0f2f5;
}

/* 输入框样式 */
.el-input {
    margin: 10px 0;
}

.el-button {
    width: 100%;
    margin-top: 10px;
}

/* 滚动条样式 */
.chat-messages::-webkit-scrollbar {
    width: 6px;
}

.chat-messages::-webkit-scrollbar-thumb {
    background-color: #c0c4cc;
    border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-track {
    background-color: transparent;
}

/* 修改部门节点样式以支持右键菜单 */
.department-node {
    cursor: context-menu;
}

/* 添加展开按钮样式 */
.expand-btn {
    display: flex;
    align-items: center;
    padding: 0;
    margin: 0;
}

.expand-btn i {
    transition: transform 0.3s;
    margin-right: 8px;
}

.expand-btn i.expanded {
    transform: rotate(90deg);
}

/* 修改用户列表容器样式 */
.user-list-container {
    margin: 10px 0 10px 24px;
    border-left: 1px dashed #dcdfe6;
    padding-left: 16px;
}

/* 修改部门节点样式 */
.department-node {
    padding: 10px;
    background-color: #f5f5f5;
    border-radius: 4px;
    margin-bottom: 8px;
}

.department-info {
    display: flex;
    align-items: center;
}

.department-name {
    font-weight: 500;
    color: #303133;
}

.chat-toolbar {
    display: flex;
    gap: 10px;
    padding: 5px 0;
    border-bottom: 1px solid #EBEEF5;
}

.emoji-picker {
    display: grid;
    grid-template-columns: repeat(10, 1fr);
    gap: 5px;
    padding: 10px;
}

.emoji-item {
    cursor: pointer;
    font-size: 20px;
    text-align: center;
    padding: 5px;
    border-radius: 4px;
}

.emoji-item:hover {
    background-color: #f5f7fa;
}

.message-image {
    max-width: 200px;
    max-height: 200px;
    border-radius: 4px;
    cursor: pointer;
}

.file-message {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    background-color: #fff;
    border-radius: 4px;
}

.file-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.message.message-sent .file-message {
    background-color: #fff;
}

.message.message-received .file-message {
    background-color: #f5f7fa;
}

.message-content.file {
    background-color: #f5f5f5;
    padding: 8px;
    border-radius: 4px;
}

.file-message {
    display: flex;
    align-items: center;
    gap: 8px;
}

.file-message a {
    color: #409EFF;
    text-decoration: none;
}

.file-message a:hover {
    text-decoration: underline;
}

.file-message i {
    font-size: 20px;
    color: #909399;
}
</style>