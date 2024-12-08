<template>
    <div class="chat-container">
        <!-- 左侧好友列表 -->
        <div class="friends-list">
            <div class="friends-header">
                <h3>联系人</h3>
            </div>
            <div class="friends-search">
                <el-input v-model="searchText" prefix-icon="el-icon-search" placeholder="搜索联系人" clearable>
                </el-input>
            </div>
            <div class="friends-content">
                <div v-for="friend in filteredFriends" :key="friend.id"
                    :class="['friend-item', { 'active': currentFriend && currentFriend.id === friend.id }]"
                    @click="selectFriend(friend)">
                    <div class="friend-avatar" :style="{ backgroundColor: friend.avatarColor }">
                        {{ friend.avatar }}
                    </div>
                    <div class="friend-info">
                        <div class="friend-name">{{ friend.username }}</div>
                        <div class="friend-type">{{ friend.type === 'group' ? '群聊' : '用户' }}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 右侧聊天窗 -->
        <div class="chat-window" v-if="currentFriend">
            <div class="chat-header">
                <div class="header-left">
                    <h3>{{ currentFriend.name }}</h3>
                    <span class="chat-type">{{ currentFriend.type === 'group' ? '群聊' : '私聊' }}</span>
                </div>
                <div class="header-right" v-if="currentFriend && currentFriend.type === 'group'">
                    <el-button 
                        type="text" 
                        @click="showAnnouncements = !showAnnouncements"
                        :class="{ 'active': showAnnouncements }">
                        <i class="el-icon-bell"></i> 公告
                    </el-button>
                </div>
            </div>
            <div class="announcements-panel" v-if="showAnnouncements && currentFriend && currentFriend.type === 'group'">
                <div class="announcements-list">
                    <div v-for="announcement in departmentAnnouncements" 
                        :key="announcement.department_affiche_id" 
                        class="announcement-item">
                        <div class="announcement-header">
                            <h4>{{ announcement.department_affiche_title }}</h4>
                            <span class="announcement-time">{{ announcement.create_time }}</span>
                        </div>
                        <div class="announcement-content">
                            {{ announcement.department_affiche_content }}
                        </div>
                    </div>
                    <div v-if="departmentAnnouncements.length === 0" class="no-announcements">
                        暂无公告
                    </div>
                </div>
            </div>
            <div class="chat-messages" ref="chatMessages">
                <div v-for="(message, index) in chatMessages" :key="index"
                    :class="['message-wrapper', message.type === 'sent' ? 'message-sent' : 'message-received']">
                    <div class="message-content" :class="[message.contentType]">
                        <!-- 文本消息 -->
                        <template v-if="message.contentType === 'text'">
                            {{ message.content }}
                        </template>
                        <!-- 图片/文件消息 -->
                        <template v-else-if="message.contentType === 'file'">
                            <!-- 如果是图片，直接显示图片 -->
                            <template v-if="isImageFile(message.content)">
                                <img :src="getFileUrl(message.content)" class="message-image"
                                    @click="previewImage(message.content)">
                            </template>
                            <!-- 如果是其他文件，显示文件链接 -->
                            <template v-else>
                                <div class="file-message">
                                    <i class="el-icon-document"></i>
                                    <a :href="getFileUrl(message.content)" target="_blank">{{
                                        getFileName(message.content) }}</a>
                                </div>
                            </template>
                        </template>
                    </div>
                    <div class="message-time">{{ formatTime(message.send_time) }}</div>
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
        <!-- 未选择聊天对象时显示的提示 -->
        <div class="chat-placeholder" v-else>
            <i class="el-icon-chat-line-round"></i>
            <p>请选择一个聊天对象</p>
        </div>
    </div>
</template>

<script>
import WebSocketService from '@/services/websocket'

export default {
    name: 'Messages',
    data() {
        return {
            chatMessages: [],
            messageInput: '',
            emojiList: ['😀', '😂', '😊', '😍', '🤔', '😴', '😭', '😱', '🤮', '😇', '🤡', '🤠', '👻', '👍', '👎', '❤️', '💔', '🌹', '🌞', '🌚'],
            currentAttachments: [],
            searchText: '',
            friends: [], // 好友列表
            currentFriend: null, // 当前选中的好友
            departmentAnnouncements: [], // 存储部门公告列表
            showAnnouncements: false, // 控制公告显示状态
        }
    },
    computed: {
        filteredFriends() {
            if (!this.searchText) return this.friends
            const searchLower = this.searchText.toLowerCase()
            return this.friends.filter(friend =>
                friend.username.toLowerCase().includes(searchLower)
            )
        }
    },
    created() {
        // 连接 WebSocket
        WebSocketService.connect()
        // 添加消息处理器
        WebSocketService.addMessageHandler(this.handleWebSocketMessage)
        
        // 先获取好友列表
        this.fetchFriendsList().then(() => {
            // 获取好友列表成功后，检查是否需要自动选择用户或群组
            const { userId, username, groupId, groupName, addToList, autoSelect } = this.$route.params
            
            if (userId) {
                // 处理私聊
                const newFriend = {
                    id: userId,
                    username: username,
                    name: username,
                    avatar: username.charAt(0).toUpperCase(),
                    type: 'user',
                    avatarColor: this.getRandomColor()
                }
                
                // 如果需要添加到聊天列表且列表中不存在该用户
                if (addToList && !this.friends.some(friend => friend.id === userId)) {
                    this.friends.push(newFriend)
                }
                
                // 如果需要自动选择，则选择该用户
                if (autoSelect) {
                    this.currentFriend = newFriend
                    this.loadChatHistory()
                }
            } else if (groupId) {
                // 处理群聊/部门聊天
                const newGroup = {
                    id: groupId,
                    username: groupName,
                    name: groupName,
                    avatar: groupName.charAt(0).toUpperCase(),
                    type: 'group',
                    avatarColor: this.getRandomColor()
                }
                
                // 如果需要添加到聊天列表且列表中不存在该群组
                if (addToList && !this.friends.some(friend => friend.id === groupId)) {
                    this.friends.push(newGroup)
                }
                
                // 如果需要自动选择，则选择该群组
                if (autoSelect) {
                    this.currentFriend = newGroup
                    this.loadChatHistory()
                }
            }
        })
    },
    beforeDestroy() {
        // 只移除消息处理器，不断开连接
        WebSocketService.removeMessageHandler(this.handleWebSocketMessage)
    },
    methods: {
        handleWebSocketMessage(event) {
            try {
                const data = JSON.parse(event.data)
                const userId = parseInt(localStorage.getItem('userid'))

                // 检查当前是否有选中的聊天对象
                if (!this.currentFriend) {
                    return
                }

                // 检查消息是否属于当前聊天
                let isCurrentChat = false;

                if (this.currentFriend.type === 'group') {
                    // 群聊：检查部门ID是否匹配
                    isCurrentChat = data.department_id === this.currentFriend.id
                } else {
                    // 私聊：检查是否是当前聊天的用户
                    if (data.send_id === userId) {
                        // 自己发送的消息，检查接收者是否是当前聊天对象
                        isCurrentChat = data.receiver_id === this.currentFriend.id
                    } else {
                        // 收到的消息，检查发送者是否是当前聊天对象
                        isCurrentChat = data.send_id === this.currentFriend.id && data.receiver_id === userId
                    }
                }

                // 如果不是当前聊天的消息，则不处理
                if (!isCurrentChat) {
                    return
                }

                // 创建消息内容对象
                let messageContent = {
                    content: data.msg,
                    type: data.send_id === userId ? 'sent' : 'received',
                    contentType: data.type === 1 ? 'text' : 'file',
                    send_time: data.send_time
                }

                // 将消息添加到聊天记录中
                this.chatMessages.push(messageContent)
                
                // 滚动到底部
                this.$nextTick(() => {
                    this.scrollToBottom()
                })
            } catch (error) {
                console.error('Error handling WebSocket message:', error)
            }
        },

        async sendMessage() {
            if (!this.messageInput.trim() || !this.currentFriend) return

            try {
                const token = localStorage.getItem('token')
                if (!token) {
                    window.location.href = 'http://localhost:8080'
                    return
                }

                // 根据聊天类型选择不同的接口
                const url = this.currentFriend.type === 'group' ? '/chat/group/send' : '/chat/private/send'
                const data = {
                    receiver_id: this.currentFriend.id,
                    message: this.messageInput.trim()
                }

                const response = await this.$axios.post(url, data)

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

        scrollToBottom() {
            const chatMessages = this.$refs.chatMessages
            chatMessages.scrollTop = chatMessages.scrollHeight
        },

        handleFileChange(file) {
            if (!this.currentFriend) {
                this.$message.warning('请先选择聊天对象')
                return
            }

            try {
                const formData = new FormData()
                formData.append('receiver_id', this.currentFriend.user_id.toString())
                formData.append('file', file.raw)

                // 发送文件
                this.sendFileMessage(formData)
            } catch (error) {
                console.error('处理文件失败:', error)
                this.$message.error('文件处理失败')
            }
        },

        insertEmoji(emoji) {
            this.messageInput += emoji
        },

        async fetchFriendsList() {
            try {
                const response = await this.$axios.post('/user/chat/list')
                console.log('获取聊天列表响应:', response)

                if (response.data.code === 20000) {
                    // 处理聊天列表数据，包括用户和群组
                    this.friends = response.data.data.chat_list.map(item => {
                        if (item.user_id) {
                            // 处理用户
                            return {
                                id: item.user_id,
                                username: item.user_name, // 用于显示的名字
                                name: item.user_name,     // 用于聊天窗口标题
                                avatar: item.user_name.charAt(0).toUpperCase(),
                                type: 'user',
                                avatarColor: this.getRandomColor() // 随机生成头像颜色
                            }
                        } else {
                            // 处理群组
                            return {
                                id: item.group_id,
                                username: item.group_name, // 用于显示的名字
                                name: item.group_name,     // 用于聊天窗口标题
                                avatar: item.group_name.charAt(0).toUpperCase(),
                                type: 'group',
                                avatarColor: this.getRandomColor() // 随机生成头像颜色
                            }
                        }
                    })
                    console.log('处理后的聊天列表:', this.friends)
                } else {
                    throw new Error(response.data.msg || '获取聊天列表失败')
                }
            } catch (error) {
                console.error('获取天列表失败:', error)
                this.$message.error(error.message || '获取聊天列表失败')
            }
        },

        async selectFriend(friend) {
            this.currentFriend = friend
            this.chatMessages = [] // 清空之前的聊天记录
            this.showAnnouncements = false // 重置公告显示状态
            
            // 如果是群聊，获取部门公告
            if (friend.type === 'group') {
                await this.fetchDepartmentAnnouncements(friend.id)
            } else {
                this.departmentAnnouncements = [] // 清空公告列表
            }
            
            await this.loadChatHistory() // 加载聊天记录
        },

        async loadChatHistory() {
            try {
                let response;
                if (this.currentFriend.type === 'group') {
                    // 获取群聊历史
                    response = await this.$axios.post('/chat/history', {
                        group_id: this.currentFriend.id
                    })
                } else {
                    // 获取私聊历史
                    response = await this.$axios.post('/chat/history', {
                        user_id: this.currentFriend.id
                    })
                }

                if (response.data.code === 20000) {
                    const userId = parseInt(localStorage.getItem('userid'))
                    this.chatMessages = response.data.data.chat_history_list
                        .filter(msg => msg.type !== 3) // 过滤掉类型为3的消息
                        .map(msg => ({
                            content: msg.msg,
                            type: msg.send_id === userId ? 'sent' : 'received',
                            contentType: msg.type === 1 ? 'text' : 'file',
                            send_time: msg.send_time
                        }))

                    this.$nextTick(() => {
                        this.scrollToBottom()
                    })
                } else {
                    throw new Error(response.data.msg || '获取聊天记录失败')
                }
            } catch (error) {
                console.error('获取聊天记录失败:', error)
                this.$message.error('获取聊天记录失败')
            }
        },

        formatTime(timestamp) {
            if (!timestamp) return ''
            const date = new Date(timestamp * 1000)
            const now = new Date()
            const diff = now - date

            // 如果是今天的消息，只显示时间
            if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
                return date.toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit'
                })
            }

            // 其���情况显示完整日期和时间
            return date.toLocaleString('zh-CN', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            })
        },

        // 发送文件消息
        async sendFileMessage(formData) {
            try {
                const token = localStorage.getItem('token')
                if (!token) {
                    window.location.href = 'http://localhost:8080'
                    return
                }

                const response = await this.$axios.post('/chat/private/send', formData, {
                    headers: {
                        'Authorization': token,
                        'Content-Type': 'multipart/form-data'
                    }
                })

                if (response.data.code === 40100) {
                    window.location.href = 'http://localhost:8080'
                    return
                }

                if (response.data.code !== 20000) {
                    throw new Error(response.data.msg || '发送失败')
                }

            } catch (error) {
                console.error('发送文件失败:', error)
                if (error.response && error.response.data.code === 40100) {
                    window.location.href = 'http://localhost:8080'
                } else {
                    this.$message.error('发送文件失败')
                }
            }
        },

        // 判断是否是图片文件
        isImageFile(path) {
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
            return imageExtensions.some(ext => path.toLowerCase().endsWith(ext))
        },

        // 获取文件完整URL
        getFileUrl(path) {
            return `http://localhost/${path}`
        },

        // 获取文件名
        getFileName(path) {
            return path.split('/').pop()
        },

        // 图片预览
        previewImage(path) {
            const h = this.$createElement
            this.$msgbox({
                title: '图片预览',
                message: h('img', {
                    attrs: {
                        src: this.getFileUrl(path),
                        style: 'max-width: 800px; max-height: 80vh; object-fit: contain;'
                    }
                }),
                showConfirmButton: false,
                customClass: 'image-preview-dialog',
                beforeClose: (action, instance, done) => {
                    done()
                }
            })
        },

        // 添加一个生成随机颜色的方法
        getRandomColor() {
            const colors = [
                '#1890ff', // 蓝色
                '#52c41a', // 绿色
                '#722ed1', // 紫色
                '#eb2f96', // 粉色
                '#fa8c16', // 橙色
                '#13c2c2', // 青色
                '#f5222d', // 红色
                '#2f54eb'  // 深蓝色
            ];
            return colors[Math.floor(Math.random() * colors.length)];
        },

        // 获取部门公告
        async fetchDepartmentAnnouncements(departmentId) {
            try {
                const response = await this.$axios.post('/department_affiche/list', {
                    department_id: departmentId
                })

                if (response.data.code === 20000) {
                    this.departmentAnnouncements = response.data.data.department_affiche_list.map(announcement => ({
                        ...announcement,
                        create_time: this.formatTime(announcement.department_affiche_create_time)
                    }))
                    // 按时间倒序排序
                    this.departmentAnnouncements.sort((a, b) => b.department_affiche_create_time - a.department_affiche_create_time)
                } else {
                    throw new Error(response.data.msg)
                }
            } catch (error) {
                console.error('获取部门公告失败:', error)
                this.$message.error('获取部门公告失败')
            }
        },
    }
}
</script>

<style scoped>
.chat-container {
    display: flex;
    width: 100%;
    height: 100%;
    background-color: #f5f7fa;
}

.friends-list {
    width: 250px;
    border-right: 1px solid #dcdfe6;
    display: flex;
    flex-direction: column;
    background-color: #fff;
}

.friends-header {
    padding: 15px;
    border-bottom: 1px solid #dcdfe6;
}

.friends-header h3 {
    margin: 0;
    color: #303133;
    font-size: 16px;
}

.friends-search {
    padding: 10px;
    border-bottom: 1px solid #dcdfe6;
}

.friends-content {
    flex: 1;
    overflow-y: auto;
}

.friend-item {
    display: flex;
    align-items: center;
    padding: 12px;
    cursor: pointer;
    transition: background-color 0.2s;
}

.friend-item:hover {
    background-color: #f5f7fa;
}

.friend-item.active {
    background-color: #e6f1fc;
}

.friend-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
    font-size: 16px;
    font-weight: bold;
}

.friend-info {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.friend-name {
    font-size: 14px;
    color: #303133;
    margin-bottom: 4px;
}

.friend-type {
    font-size: 12px;
    color: #909399;
}

.chat-window {
    flex: 1;
    display: flex;
    flex-direction: column;
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
    background-color: #f5f7fa;
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
    /* 微信风格的绿色 */
    color: #000;
    margin-left: 20px;
}

/* 接收的消息样式 */
.message-received .message-content {
    background-color: #ffffff;
    color: #000;
    margin-right: 20px;
}

/* 消息时间样式 */
.message-time {
    font-size: 12px;
    color: #909399;
    position: absolute;
    top: -20px;
    padding: 0 8px;
}

/* 发送消息的时间靠右 */
.message-sent .message-time {
    right: 0;
}

/* 接收消息的时间靠左 */
.message-received .message-time {
    left: 0;
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

/* 输入框样式 */
.el-input {
    margin: 10px 0;
}

.el-button {
    width: 100%;
    margin-top: 10px;
}

/* 添加未选择聊天对象时的占位样式 */
.chat-placeholder {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: #f5f7fa;
    color: #909399;
}

.chat-placeholder i {
    font-size: 48px;
    margin-bottom: 16px;
}

.chat-placeholder p {
    font-size: 16px;
    margin: 0;
}

/* 添加图片消息样式 */
.message-image {
    max-width: 300px;
    max-height: 300px;
    border-radius: 4px;
    cursor: zoom-in;
    transition: transform 0.2s;
}

.message-image:hover {
    transform: scale(1.02);
}

/* 文件消息样式 */
.file-message {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    background-color: rgba(0, 0, 0, 0.03);
    border-radius: 4px;
}

.file-message i {
    font-size: 20px;
    color: #909399;
}

.file-message a {
    color: #409EFF;
    text-decoration: none;
    font-size: 14px;
}

.file-message a:hover {
    text-decoration: underline;
}

/* 图片预览对话框样式 */
:deep(.image-preview-dialog) {
    width: auto !important;
    max-width: 90vw !important;
    margin: 15vh auto !important;
}

:deep(.image-preview-dialog .el-message-box__content) {
    padding: 20px;
    text-align: center;
    max-height: 80vh;
    overflow: auto;
}

:deep(.image-preview-dialog .el-message-box__header) {
    padding: 10px 20px;
}

:deep(.image-preview-dialog .el-message-box__close) {
    font-size: 20px;
    color: #909399;
}

/* 添加聊天类型标签样式 */
.chat-type {
    font-size: 12px;
    color: #909399;
    margin-left: 8px;
    padding: 2px 6px;
    background-color: #f5f7fa;
    border-radius: 4px;
}

.chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 8px;
}

.header-right .el-button {
    padding: 0 8px;
    font-size: 14px;
}

.header-right .el-button.active {
    color: #409EFF;
}

.header-right .el-button i {
    margin-right: 4px;
}

.announcements-panel {
    background-color: #fff;
    border-bottom: 1px solid #dcdfe6;
    max-height: 300px;
    overflow-y: auto;
}

.announcements-list {
    padding: 16px;
}

.announcement-item {
    background-color: #f5f7fa;
    border-radius: 4px;
    padding: 12px;
    margin-bottom: 12px;
}

.announcement-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.announcement-header h4 {
    margin: 0;
    color: #303133;
    font-size: 14px;
    font-weight: bold;
}

.announcement-time {
    font-size: 12px;
    color: #909399;
}

.announcement-content {
    font-size: 13px;
    color: #606266;
    line-height: 1.5;
    white-space: pre-wrap;
}

.no-announcements {
    text-align: center;
    color: #909399;
    padding: 20px;
    font-size: 14px;
}
</style>