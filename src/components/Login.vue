<template>
    <div class="login-container">
        <div class="login-box">
            <h2>林地资源管理系统</h2>
            <el-form :model="loginForm" :rules="rules" ref="loginForm" class="login-form">
                <el-form-item prop="username">
                    <el-input v-model="loginForm.username" prefix-icon="el-icon-user" placeholder="请输入用户名">
                    </el-input>
                </el-form-item>
                <el-form-item prop="password">
                    <el-input v-model="loginForm.password" prefix-icon="el-icon-lock" type="password"
                        placeholder="请输入密码" @keyup.enter.native="handleLogin">
                    </el-input>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" :loading="loading" class="login-button" @click="handleLogin">
                        {{ loading ? '登录中...' : '登录' }}
                    </el-button>
                    <el-button type="text" class="guest-button" @click="handleGuestLogin">
                        游客登录
                    </el-button>
                </el-form-item>
            </el-form>
        </div>
    </div>
</template>

<script>
import axios from 'axios'
import config from '@/config'
import WebSocketService from '@/services/websocket'

export default {
    name: 'Login',
    data() {
        return {
            loginForm: {
                username: '',
                password: ''
            },
            rules: {
                username: [
                    { required: true, message: '请输入用户名', trigger: 'blur' }
                ],
                password: [
                    { required: true, message: '请输入密码', trigger: 'blur' }
                ]
            },
            loading: false
        }
    },
    methods: {
        handleLogin() {
            this.$refs.loginForm.validate(async (valid) => {
                if (!valid) return

                this.loading = true
                try {
                    const response = await axios({
                        method: 'post',
                        url: '/user/login',
                        data: this.loginForm,
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })

                    const { code, msg, data } = response.data

                    if (code !== config.successCode) {
                        throw new Error(msg || '登录失败')
                    }

                    if (data && data.token) {
                        // 存储token、用户类型、userid和用户名
                        localStorage.setItem('token', data.token)
                        localStorage.setItem('userType', 'admin')
                        localStorage.setItem('userid', data.userid.toString())
                        localStorage.setItem('username', data.user_name)

                        // 设置axios默认请求头
                        axios.defaults.headers.common['Authorization'] = data.token

                        // 连接 WebSocket
                        WebSocketService.connect()

                        // 登录成功后跳转到主页
                        this.$router.push('/main')
                        this.$message.success('登录成功')
                    } else {
                        throw new Error('登录失败：未获取到token')
                    }
                } catch (error) {
                    this.$message.error(error.message || '登录失败，请重试')
                } finally {
                    this.loading = false
                }
            })
        },

        // 游客登录方法
        handleGuestLogin() {
            // 存储游客身份
            localStorage.setItem('userType', 'guest')
            localStorage.setItem('username', '游客')
            // 游客不需要token
            localStorage.removeItem('token')
            delete axios.defaults.headers.common['Authorization']
            // 断开 WebSocket 连接
            WebSocketService.disconnect()
            // 跳转到主页
            this.$router.push('/main')
            this.$message.success('游客登录成功')
        }
    },
    created() {
        // 清除之前的登录状态
        localStorage.removeItem('token')
        localStorage.removeItem('userType')
        delete axios.defaults.headers.common['Authorization']
        // 断开之前的 WebSocket 连接
        WebSocketService.disconnect()
    }
}
</script>

<style scoped>
.login-container {
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #f0f2f5;
}

.login-box {
    width: 400px;
    padding: 40px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.login-box h2 {
    text-align: center;
    margin-bottom: 30px;
    color: #2c3e50;
}

.login-form {
    margin-top: 30px;
}

.login-button {
    width: 100%;
    margin-bottom: 10px;
}

.guest-button {
    width: 100%;
    margin-top: 10px;
}

.guest-button:hover {
    color: #409EFF;
}

.el-input {
    margin-bottom: 10px;
}
</style>