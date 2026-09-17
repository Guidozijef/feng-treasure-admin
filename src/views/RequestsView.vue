<template>
  <div class="data-card">
    <div class="card-header">
      <div class="card-title">
        <span>📨 用户求资源需求工单中心 (resource_requests)</span>
        <span class="card-title-badge">{{ totalCount }} 需求</span>
      </div>
      <div class="card-actions">
        <div class="search-filter-bar">
          <select class="select-filter" v-model="statusFilter" @change="loadRequests">
            <option value="">全部状态 (全部求档)</option>
            <option value="pending">待处理排期 (pending)</option>
            <option value="searching">全网搜寻中 (searching)</option>
            <option value="resolved">已采纳上线 (resolved)</option>
            <option value="rejected">暂时无法满足 (rejected)</option>
          </select>
          <button class="btn btn-secondary btn-sm" @click="loadRequests">⟳ 刷新需求</button>
        </div>
      </div>
    </div>

    <div class="table-responsive">
      <table class="admin-table">
        <thead>
          <tr>
            <th>需求单号</th>
            <th style="min-width:180px;">求档资源名称</th>
            <th>所属分类</th>
            <th>要求平台</th>
            <th style="min-width:240px;">诉求详情说明</th>
            <th>加急特权</th>
            <th>工单状态</th>
            <th>提交时间</th>
            <th style="min-width:180px;">运营处理</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="9" style="text-align:center;padding:40px;color:#94a3b8;">正在加载求档需求数据...</td>
          </tr>
          <tr v-else-if="requests.length === 0">
            <td colspan="9" style="text-align:center;padding:40px;color:#94a3b8;">暂无符合条件的用户求档工单</td>
          </tr>
          <tr v-for="req in requests" :key="req.id">
            <td>
              <span style="font-family:monospace;font-weight:600;color:#94a3b8;">
                {{ req.order_no || req.id.substring(0, 8) }}
              </span>
            </td>
            <td>
              <div style="font-weight:700;color:#ffffff;font-size:15px;">{{ req.title }}</div>
            </td>
            <td><span class="badge badge-gray">{{ req.category || '通用' }}</span></td>
            <td><span class="badge badge-blue">{{ req.platforms || '全平台' }}</span></td>
            <td>
              <div class="cell-desc" :title="req.detail_desc">{{ req.detail_desc || '暂无详细描述' }}</div>
            </td>
            <td>
              <span v-if="req.is_svip_speed" class="badge badge-gold" style="box-shadow:0 0 8px rgba(245,158,11,0.4);">
                ⚡ SVIP 极速通道
              </span>
              <span v-else class="badge badge-gray">普通排队</span>
            </td>
            <td>
              <span v-if="req.status === 'resolved'" class="badge badge-green">✓ 已上线资源</span>
              <span v-else-if="req.status === 'searching'" class="badge badge-blue">🔍 全网搜寻中</span>
              <span v-else-if="req.status === 'rejected'" class="badge badge-gray">✕ 暂无资源</span>
              <span v-else class="badge badge-gold">● 待审核受理</span>
            </td>
            <td style="font-size:12px;color:#64748b;">
              {{ req.created ? req.created.substring(0, 16).replace('T', ' ') : '-' }}
            </td>
            <td>
              <div class="table-btn-group">
                <button
                  v-if="req.status !== 'resolved'"
                  class="btn btn-secondary btn-sm"
                  style="background:rgba(16,185,129,0.15);color:#10b981;border-color:rgba(16,185,129,0.3);"
                  @click="updateStatus(req, 'resolved', '已采纳并上线该资源')"
                >
                  标记已上线
                </button>
                <button
                  v-if="req.status === 'pending'"
                  class="btn btn-secondary btn-sm"
                  style="color:#60a5fa;"
                  @click="updateStatus(req, 'searching', '正在搜寻全网优质资源库')"
                >
                  标记搜寻中
                </button>
                <button
                  v-if="req.status !== 'rejected' && req.status !== 'resolved'"
                  class="btn btn-secondary btn-sm"
                  style="color:#94a3b8;"
                  @click="updateStatus(req, 'rejected', '全网暂未找到安全可用资源')"
                >
                  暂无法满足
                </button>
                <button class="btn btn-danger btn-sm" @click="deleteRequest(req)">
                  删除
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { reportService } from '../api/services.js';
import { toast } from '../utils/toast.js';

const requests = ref([]);
const totalCount = ref(0);
const loading = ref(false);
const statusFilter = ref('');

const loadRequests = async () => {
  loading.value = true;
  try {
    let filter = '';
    if (statusFilter.value) {
      filter = `status = "${statusFilter.value}"`;
    }
    const res = await reportService.getRequests({ filter });
    requests.value = res.items || [];
    totalCount.value = res.totalItems || requests.value.length;
  } catch (e) {
    toast.error('加载求档需求失败: ' + e.message);
  } finally {
    loading.value = false;
  }
};

const updateStatus = async (req, status, status_text) => {
  try {
    await reportService.updateRequestStatus(req.id, status, status_text);
    req.status = status;
    req.status_text = status_text;
    toast.success('求档工单状态已更新！');
  } catch (e) {
    alert('更新失败: ' + e.message);
  }
};

const deleteRequest = async (req) => {
  if (!confirm('确定要删除此条求资源工单吗？')) return;
  try {
    await reportService.deleteRequest(req.id);
    toast.success('求档工单已删除');
    await loadRequests();
  } catch (e) {
    alert('删除失败: ' + e.message);
  }
};

onMounted(() => {
  loadRequests();
});
</script>
