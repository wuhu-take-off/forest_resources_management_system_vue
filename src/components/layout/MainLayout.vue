<template>
    <div class="main-layout">
        <div class="header">
            <div class="header-left">
                <h1>林地资源管理系统</h1>
            </div>
            <div class="header-right">
                <el-dropdown>
                    <span class="user-info">
                        {{ userName }}<i class="el-icon-arrow-down"></i>
                    </span>
                    <el-dropdown-menu slot="dropdown">
                        <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
                    </el-dropdown-menu>
                </el-dropdown>
            </div>
        </div>
        <div class="container">
            <div class="sidebar">
                <el-menu :default-active="activeMenu" :default-openeds="defaultOpeneds" class="menu" router
                    background-color="#001529" text-color="#fff" active-text-color="#1890ff" :unique-opened="false">
                    <template v-for="module in moduleList">
                        <el-submenu :index="module.module_name" :key="module.module_id" popper-class="submenu-popper">
                            <template slot="title">
                                <i :class="getModuleIcon(module.module_name)"></i>
                                <span class="menu-title">{{ module.module_desc }}</span>
                            </template>
                            <el-menu-item v-for="subModule in module.module_child" :key="subModule.module_id"
                                :index="getSubModulePath(module.module_name, subModule.module_name)">
                                <i :class="getSubModuleIcon(module.module_name, subModule.module_name)"></i>
                                <span class="submenu-title">{{ subModule.module_desc }}</span>
                            </el-menu-item>
                        </el-submenu>
                    </template>
                </el-menu>
            </div>
            <div class="content">
                <div class="breadcrumb">
                    <el-breadcrumb separator="/">
                        <el-breadcrumb-item :to="{ path: '/main' }">首页</el-breadcrumb-item>
                        <el-breadcrumb-item v-for="(item, index) in breadcrumbList" :key="index">
                            {{ item }}
                        </el-breadcrumb-item>
                    </el-breadcrumb>
                </div>
                <div class="page-content">
                    <router-view></router-view>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios'
import config from '@/config'
import WebSocketService from '@/services/websocket'
import { MessageBox, Message } from 'element-ui'

// 添加模块映射配置
const MODULE_MAPPING = {
    // 部门管理
    'department': {
        path: '/main/department',
        icon: 'el-icon-office-building',
        children: {
            'messages': {
                path: '/main/department/messages',
                icon: 'el-icon-chat-line-round'
            },
            'contacts': {
                path: '/main/department/contacts',
                icon: 'el-icon-notebook-2'
            }
        }
    },
    // 林地资源
    'forest': {
        path: '/main/forest',
        icon: 'el-icon-tree',
        children: {
            'forest_view': {
                path: '/main/forest/view',
                icon: 'el-icon-view'
            },
            'forest_report': {
                path: '/main/forest/report',
                icon: 'el-icon-document'
            }
        }
    },
    // 公告管理
    'announcement': {
        path: '/main/announcement',
        icon: 'el-icon-bell',
        children: {
            'policy_info': {
                path: '/main/announcement/policy-info',
                icon: 'el-icon-document'
            },
            'notice_info': {
                path: '/main/announcement/notice-info',
                icon: 'el-icon-message'
            },
            'policy_manage': {
                path: '/main/announcement/policy-manage',
                icon: 'el-icon-edit-outline'
            },
            'notice_manage': {
                path: '/main/announcement/notice-manage',
                icon: 'el-icon-setting'
            }
        }
    },
    // 民众
    'people': {
        path: '/main/people',
        icon: 'el-icon-user',
        children: {
            'application': {
                path: '/main/people/application',
                icon: 'el-icon-edit'
            },
            'application_manage': {
                path: '/main/people/application-manage',
                icon: 'el-icon-s-tools'
            }
        }
    }
}

export default {
    name: 'MainLayout',
    data() {
        return {
            userName: '',
            activeMenu: '',
            breadcrumbList: [],
            defaultOpeneds: [],
            moduleList: [], // 存储用户可访问的模块列表
        }
    },
    methods: {
        handleLogout() {
            MessageBox.confirm('确认退出登录吗?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                try {
                    // 清除登录信息
                    localStorage.removeItem('token')
                    localStorage.removeItem('userType')
                    localStorage.removeItem('userid')

                    // 清除所有 axios 实例的请求头
                    delete axios.defaults.headers.common['Authorization']
                    if (this.$axios) {
                        delete this.$axios.defaults.headers.common['Authorization']
                    }

                    // 断开 WebSocket 连接
                    WebSocketService.disconnect()

                    // 显示成功消息
                    Message.success('已退出登录')

                    // 延迟一下再跳转，让用户看到成功提示
                    setTimeout(() => {
                        window.location.href = 'http://localhost:8080'
                    }, 500)

                } catch (error) {
                    console.error('退出登录错误:', error)
                    Message.error('退出登录失败')
                    // 如果出错也强制跳转到登录页
                    setTimeout(() => {
                        window.location.href = 'http://localhost:8080'
                    }, 500)
                }
            }).catch(() => {
                // 用户取消退出操作
                Message.info('已取消退出')
            })
        },
        updateBreadcrumb() {
            const matched = this.$route.matched.slice(1)
            this.breadcrumbList = matched.map(item => item.meta.title).filter(Boolean)
        },
        updateDefaultOpeneds() {
            const path = this.$route.path
            this.defaultOpeneds = this.moduleList
                .filter(module => path.includes(`/main/${module.module_name}/`))
                .map(module => module.module_name)
        },
        // 获取用户可访问的模块列表
        async fetchModuleList() {
            try {
                const response = await this.$axios.post('/module/list')
                if (response.data.code === 20000) {
                    this.moduleList = response.data.data.module_list
                    this.updateDefaultOpeneds()
                } else {
                    throw new Error(response.data.msg)
                }
            } catch (error) {
                console.error('获取模块列表失败:', error)
                this.$message.error('获取模块列表失败')
            }
        },

        // 获取模块的图标
        getModuleIcon(moduleName) {
            return MODULE_MAPPING[moduleName] && MODULE_MAPPING[moduleName].icon || 'el-icon-folder'
        },

        // 获取子模块的图标
        getSubModuleIcon(parentModule, moduleName) {
            return MODULE_MAPPING[parentModule] && 
                   MODULE_MAPPING[parentModule].children && 
                   MODULE_MAPPING[parentModule].children[moduleName] && 
                   MODULE_MAPPING[parentModule].children[moduleName].icon || 'el-icon-document'
        },

        // 获取子模块的路由路径
        getSubModulePath(parentModule, moduleName) {
            return MODULE_MAPPING[parentModule] && 
                   MODULE_MAPPING[parentModule].children && 
                   MODULE_MAPPING[parentModule].children[moduleName] && 
                   MODULE_MAPPING[parentModule].children[moduleName].path || ''
        }
    },
    created() {
        this.activeMenu = this.$route.path
        // 从本地存储获取用户名
        const username = localStorage.getItem('username')
        this.userName = username || '未知用户'
        // 获取用户可访问的模块列表
        this.fetchModuleList()
    },
    watch: {
        $route: {
            handler(to) {
                this.activeMenu = to.path
                this.updateBreadcrumb()
                this.updateDefaultOpeneds()
            },
            immediate: true
        }
    }
}
</script>

<style scoped>
/* 修改基础布局样式 */
.main-layout {
    height: 100vh;
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
}

.header {
    background-color: #001529;
    color: white;
    padding: 0 20px;
    height: 60px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    z-index: 1;
}

/* 菜单样式 */
.menu-item {
    font-size: 14px !important;
    height: 50px !important;
    line-height: 50px !important;
    padding-left: 16px !important;
}

.menu-icon {
    font-size: 16px !important;
    margin-right: 8px;
    width: 20px;
    text-align: center;
}

.menu-title {
    font-size: 14px !important;
}

/* 子菜单样式 */
.submenu-item {
    font-size: 13px !important;
    height: 40px !important;
    line-height: 40px !important;
    padding-left: 54px !important;
    background-color: #000c17 !important;
}

.submenu-icon {
    font-size: 14px !important;
    margin-right: 8px !important;
}

.submenu-title {
    font-size: 13px !important;
}

/* 菜单交互样式 */
.el-menu-item:hover,
.el-submenu__title:hover {
    background-color: #1890ff !important;
}

.el-menu-item.is-active {
    background-color: #1890ff !important;
    color: #fff !important;
}

/* 布局样式 */
.container {
    flex: 1;
    display: flex;
    overflow: hidden;
    position: relative;
}

.sidebar {
    width: 200px;
    background-color: #001529;
}

.menu {
    border-right: none;
    height: 100%;
}

.content {
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: #f0f2f5;
    overflow: hidden;
    position: relative;
}

.breadcrumb {
    padding: 16px 24px;
    background-color: #fff;
    box-shadow: 0 1px 4px rgba(0, 21, 41, .08);
    position: relative;
    z-index: 1;
}

.page-content {
    flex: 1;
    padding: 24px;
    overflow-y: auto;
    height: calc(100vh - 60px - 56px);
}

/* 其他样式 */
.header-left h1 {
    margin: 0;
    font-size: 1.5rem;
}

.user-info {
    cursor: pointer;
    color: white;
    display: flex;
    align-items: center;
    gap: 5px;
}

/* 子菜单展开样式 */
.el-submenu.is-opened>.el-submenu__title {
    background-color: #001529 !important;
}

.el-submenu.is-opened .el-menu {
    background-color: #000c17 !important;
}

/* 修改菜单样式 */
.el-submenu {
    border: none !important;
}

.el-submenu__title {
    padding-left: 16px !important;
    height: 50px !important;
    line-height: 50px !important;
}

.el-submenu__title i {
    color: #fff;
}

.el-submenu__title:hover {
    background-color: #1890ff !important;
}

/* 子菜单项样式 */
.el-submenu .el-menu-item {
    height: 40px !important;
    line-height: 40px !important;
    padding-left: 48px !important;
    font-size: 13px !important;
    background-color: #000c17 !important;
    min-width: 0;
}

.el-submenu .el-menu-item:hover {
    background-color: #1890ff !important;
}

.el-submenu .el-menu-item.is-active {
    background-color: #1890ff !important;
    color: #fff !important;
}

.el-submenu .el-menu-item.is-active .submenu-icon,
.el-submenu .el-menu-item.is-active .submenu-title,
.el-submenu .el-menu-item:hover .submenu-icon,
.el-submenu .el-menu-item:hover .submenu-title {
    color: #fff !important;
}

/* 子菜单图标样式 */
.submenu-icon {
    font-size: 14px !important;
    margin-right: 8px;
    width: 16px;
    text-align: center;
    color: #909399;
}

/* 子菜单标题样式 */
.submenu-title {
    font-size: 13px !important;
    color: #a6a9ad;
}

/* 确保子菜单展开时的样式正确 */
.el-menu--inline {
    background-color: #000c17 !important;
}

/* 添加全局样式 */
</style>

<style>
/* 弹出的子菜单样式 */
.el-menu--popup {
    min-width: 200px !important;
    background-color: #000c17 !important;
}

.el-menu--popup .el-menu-item {
    height: 40px !important;
    line-height: 40px !important;
    color: #fff !important;
}

.el-menu--popup .el-menu-item:hover {
    background-color: #1890ff !important;
}

.el-menu--popup .el-menu-item.is-active {
    background-color: #1890ff !important;
    color: #fff !important;
}
</style>