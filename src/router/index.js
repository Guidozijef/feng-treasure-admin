import { createRouter, createWebHashHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { title: '数据概览仪表盘', icon: '📊' }
  },
  {
    path: '/resources',
    name: 'Resources',
    component: () => import('../views/ResourcesView.vue'),
    meta: { title: '资源中心管理', icon: '📦' }
  },
  {
    path: '/resources/create',
    name: 'ResourceCreate',
    component: () => import('../views/ResourceEditView.vue'),
    meta: { title: '新增数字资产', icon: '✨' }
  },
  {
    path: '/resources/edit/:id',
    name: 'ResourceEdit',
    component: () => import('../views/ResourceEditView.vue'),
    meta: { title: '编辑资产详情', icon: '📝' }
  },
  {
    path: '/users',
    name: 'Users',
    component: () => import('../views/UsersView.vue'),
    meta: { title: '用户与会员中心', icon: '👥' }
  },
  {
    path: '/vip',
    name: 'Vip',
    component: () => import('../views/VipView.vue'),
    meta: { title: 'VIP 套餐与订单', icon: '👑' }
  },
  {
    path: '/categories',
    name: 'Categories',
    component: () => import('../views/CategoriesView.vue'),
    meta: { title: '分类与标签配置', icon: '🏷️' }
  },
  {
    path: '/reports',
    name: 'Reports',
    component: () => import('../views/ReportsView.vue'),
    meta: { title: '网盘失效与纠错', icon: '🚨' }
  },
  {
    path: '/requests',
    name: 'Requests',
    component: () => import('../views/RequestsView.vue'),
    meta: { title: '用户求资源工单', icon: '📨' }
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;
