import Vue from 'vue'
import Router from 'vue-router'
import Login from '@/components/Login'
import MainLayout from '@/components/layout/MainLayout'
import Department from '@/views/Department'
import Tasks from '@/views/Tasks'
import ForestView from '@/views/forest/ForestView'
import ForestReport from '@/views/forest/ForestReport'
import Application from '@/views/people/Application.vue'
import ApplicationManage from '@/views/people/ApplicationManage.vue'
import Messages from '@/views/department/Messages'
import Contacts from '@/views/department/Contacts'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Login',
      component: Login
    },
    {
      path: '/main',
      component: MainLayout,
      children: [
        {
          path: 'department',
          name: 'Department',
          component: {
            render: (h) => h('router-view')
          },
          meta: { title: '部门管理' },
          children: [
            {
              path: 'messages',
              name: 'Messages',
              component: Messages,
              meta: { title: '消息' }
            },
            {
              path: 'contacts',
              name: 'Contacts',
              component: Contacts,
              meta: { title: '通讯录' }
            }
          ]
        },
        {
          path: 'forest',
          name: 'Forest',
          component: {
            render: (h) => h('router-view')
          },
          meta: { title: '林地资源' },
          children: [
            {
              path: 'view',
              name: 'ForestView',
              component: ForestView,
              meta: { title: '资源查看' }
            },
            {
              path: 'report',
              name: 'ForestReport',
              component: ForestReport,
              meta: { title: '资源汇报' }
            }
          ]
        },
        {
          path: '/main/announcement',
          component: {
            render: (h) => h('router-view')
          },
          children: [
            {
              path: 'policy-info',
              name: 'PolicyInfo',
              component: () => import('@/views/announcement/PolicyInfo'),
              meta: { title: '政策信息' }
            },
            {
              path: 'notice-info',
              name: 'NoticeInfo',
              component: () => import('@/views/announcement/NoticeInfo'),
              meta: { title: '公告信息' }
            },
            {
              path: 'policy-manage',
              name: 'PolicyManage',
              component: () => import('@/views/announcement/PolicyManage'),
              meta: { title: '政策管理' }
            },
            {
              path: 'notice-manage',
              name: 'NoticeManage',
              component: () => import('@/views/announcement/NoticeManage'),
              meta: { title: '公告管理' }
            }
          ]
        },
        {
          path: 'tasks',
          name: 'Tasks',
          component: Tasks,
          meta: { title: '任务管理' }
        },
        {
          path: 'people/application',
          component: Application,
          meta: { title: '民众申请' }
        },
        {
          path: 'people/application-manage',
          component: ApplicationManage,
          meta: { title: '申请管理' }
        }
      ]
    }
  ]
})