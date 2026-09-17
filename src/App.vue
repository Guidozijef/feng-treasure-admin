<template>
  <div class="admin-layout">
    <!-- 左侧侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="brand-icon">💎</div>
        <div>
          <div class="brand-title">枫的藏宝阁</div>
          <div style="font-size:11px;color:#64748b;">Geek Treasure Admin</div>
        </div>
        <span class="brand-badge">Vue 3</span>
      </div>

      <div class="sidebar-nav">
        <div class="nav-section-label">核心运营</div>
        <router-link to="/dashboard" class="nav-item" active-class="active">
          <span class="nav-icon">📊</span>
          <span>数据概览</span>
        </router-link>
        <router-link to="/resources" class="nav-item" active-class="active">
          <span class="nav-icon">📦</span>
          <span>资源管理</span>
        </router-link>

        <div class="nav-section-label">会员与用户</div>
        <router-link to="/users" class="nav-item" active-class="active">
          <span class="nav-icon">👥</span>
          <span>用户管理</span>
        </router-link>
        <router-link to="/vip" class="nav-item" active-class="active">
          <span class="nav-icon">👑</span>
          <span>VIP 套餐订单</span>
        </router-link>

        <div class="nav-section-label">工单响应与系统</div>
        <router-link to="/reports" class="nav-item" active-class="active">
          <span class="nav-icon">🚨</span>
          <span>网盘失效报错</span>
        </router-link>
        <router-link to="/requests" class="nav-item" active-class="active">
          <span class="nav-icon">📨</span>
          <span>用户求资源工单</span>
        </router-link>
        <router-link to="/categories" class="nav-item" active-class="active">
          <span class="nav-icon">🏷️</span>
          <span>分类与标签 (CRUD)</span>
        </router-link>
      </div>

      <div class="sidebar-footer">
        <div class="admin-info">
          <div class="admin-avatar">A</div>
          <div>
            <div class="admin-name">超级管理员</div>
            <div class="admin-role">Super Admin</div>
          </div>
        </div>
        <button class="logout-btn" @click="handleLogout" title="重新连接/注销">⏻</button>
      </div>
    </aside>

    <!-- 右侧主内容区域 - 满幅展开 -->
    <div class="main-wrapper">
      <header class="topbar">
        <div class="topbar-left">
          <button v-if="isSubPage" class="btn btn-secondary btn-sm" style="margin-right:12px;" @click="$router.back()">
            ← 返回列表
          </button>
          <h1 class="page-breadcrumb-title">
            {{ currentRouteMeta.icon }} {{ currentRouteMeta.title }}
          </h1>
        </div>
        <div class="topbar-right">
          <div class="server-status-pill">
            <div class="status-dot-pulse"></div>
            <span>PocketBase 云端直连 (Vue3 + REST)</span>
          </div>
          <button class="btn btn-secondary btn-sm" @click="reloadCurrentPage">⟳ 刷新当前页</button>
        </div>
      </header>

      <main class="page-container">
        <router-view :key="$route.fullPath" />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { auth } from './api/client.js';
import { toast } from './utils/toast.js';

const route = useRoute();
const router = useRouter();

const currentRouteMeta = computed(() => {
  return route.meta || { title: '管理后台', icon: '💎' };
});

const isSubPage = computed(() => {
  return route.path.startsWith('/resources/create') || route.path.startsWith('/resources/edit');
});

const handleLogout = () => {
  if (confirm('确定要注销登录凭证并重新连接吗？')) {
    auth.logout();
  }
};

const reloadCurrentPage = () => {
  toast.success('正在刷新数据...');
  router.replace({ path: route.path, query: { _t: Date.now() } });
};

onMounted(async () => {
  if (!auth.isAuthenticated()) {
    const res = await auth.login('913497146@qq.com', '913497146zjf');
    if (res.success) {
      console.log('✅ PocketBase Admin 自动认证就绪');
    } else {
      console.warn('⚠️ PocketBase Admin 登录异常:', res.error);
    }
  }
});
</script>
