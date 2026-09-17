<template>
  <div>
    <!-- 指标卡片网格 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-content">
          <span class="stat-num">{{ stats.totalResources }}</span>
          <span class="stat-label">总资源数 (resources)</span>
        </div>
        <div class="stat-icon-wrap icon-blue">📦</div>
      </div>
      <div class="stat-card">
        <div class="stat-content">
          <span class="stat-num">{{ stats.totalUsers }}</span>
          <span class="stat-label">注册用户总数 (user_profiles)</span>
        </div>
        <div class="stat-icon-wrap icon-green">👥</div>
      </div>
      <div class="stat-card">
        <div class="stat-content">
          <span class="stat-num">{{ stats.vipUsers }}</span>
          <span class="stat-label">极客黑卡 SVIP 会员</span>
        </div>
        <div class="stat-icon-wrap icon-gold">👑</div>
      </div>
      <div class="stat-card">
        <div class="stat-content">
          <span class="stat-num">{{ stats.totalOrders }}</span>
          <span class="stat-label">VIP 订单总数 (vip_orders)</span>
        </div>
        <div class="stat-icon-wrap icon-purple">💳</div>
      </div>
      <div class="stat-card">
        <div class="stat-content">
          <span class="stat-num">{{ stats.pendingReports }}</span>
          <span class="stat-label">待处理报错工单 (reports)</span>
        </div>
        <div class="stat-icon-wrap icon-red">🚨</div>
      </div>
    </div>

    <!-- 快捷运营与热门资源 -->
    <div class="data-card">
      <div class="card-header">
        <div class="card-title">
          <span>🚀 快捷运营与近期热点转存排行榜</span>
        </div>
        <div class="card-actions">
          <router-link to="/resources/create" target="_blank" class="btn btn-primary btn-sm">
            + 新增资源 (新开页面)
          </router-link>
          <router-link to="/resources" class="btn btn-secondary btn-sm">
            管理全部资源 ➔
          </router-link>
        </div>
      </div>
      <div class="table-responsive">
        <table class="admin-table">
          <thead>
            <tr>
              <th>资源名称</th>
              <th>版本号</th>
              <th>分类</th>
              <th>体积</th>
              <th>好评评分</th>
              <th>累计转存</th>
              <th>网盘直链</th>
              <th>提取码</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loadingRecent">
              <td colspan="9" style="text-align:center;padding:30px;">正在载入榜单...</td>
            </tr>
            <tr v-else-if="recentItems.length === 0">
              <td colspan="9" style="text-align:center;padding:30px;color:#94a3b8;">暂无数据</td>
            </tr>
            <tr v-for="item in recentItems" :key="item.id">
              <td>
                <div class="table-title-cell">
                  <div class="res-thumb-icon">
                    <img v-if="item.icon && !failedIcons[item.id]" :src="item.icon" @error="failedIcons[item.id] = true" />
                    <div v-else class="res-icon-placeholder">{{ (item.title || '宝').charAt(0) }}</div>
                  </div>
                  <div class="res-name-block">
                    <span class="res-name-txt">{{ item.title }}</span>
                    <span class="res-sub-txt">{{ item.platform || '全平台' }}</span>
                  </div>
                </div>
              </td>
              <td><span class="badge badge-blue">{{ item.version || '最新版' }}</span></td>
              <td><span class="badge badge-gray">{{ item.category || '通用' }}</span></td>
              <td>{{ item.size || '-' }}</td>
              <td><span style="color:#f59e0b;font-weight:700;">★ {{ item.rating || '9.9' }}</span></td>
              <td>{{ item.downloads || 0 }} 次</td>
              <td>
                <a :href="item.panUrl" target="_blank" class="cell-ellipsis-link" :title="item.panUrl" style="color:#3b82f6;text-decoration:none;">{{ item.panUrl || '无链接' }}</a>
              </td>
              <td><span class="badge badge-green">{{ item.pwd || '免码' }}</span></td>
              <td>
                <router-link :to="'/resources/edit/' + item.id" target="_blank" class="btn btn-secondary btn-sm">
                  编辑详情
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { statsService, resourceService } from '../api/services.js';

const stats = reactive({
  totalResources: '--',
  totalUsers: '--',
  vipUsers: '--',
  totalOrders: '--',
  pendingReports: '--'
});

const recentItems = ref([]);
const loadingRecent = ref(false);

const failedIcons = reactive({});

onMounted(async () => {
  statsService.getDashboardStats().then(data => {
    stats.totalResources = data.totalResources;
    stats.totalUsers = data.totalUsers;
    stats.vipUsers = data.vipUsers;
    stats.totalOrders = data.totalOrders;
    stats.pendingReports = data.pendingReports;
  });

  loadingRecent.value = true;
  resourceService.list({ perPage: 8, sort: '-downloads' }).then(res => {
    recentItems.value = res.items || [];
  }).finally(() => {
    loadingRecent.value = false;
  });
});
</script>
