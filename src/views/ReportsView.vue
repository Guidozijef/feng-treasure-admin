<template>
  <div class="data-card">
    <div class="card-header">
      <div class="card-title">
        <span>🚨 网盘失效与报错纠错工单 (resource_reports)</span>
        <span class="card-title-badge">{{ totalCount }} 单</span>
      </div>
      <div class="card-actions">
        <div class="search-filter-bar">
          <select class="select-filter" v-model="statusFilter" @change="loadReports">
            <option value="">全部状态 (全部工单)</option>
            <option value="pending">待处理排查 (pending)</option>
            <option value="resolved">已补档恢复 (resolved)</option>
            <option value="rejected">已驳回正常 (rejected)</option>
          </select>
          <button class="btn btn-secondary btn-sm" @click="loadReports">⟳ 刷新工单</button>
        </div>
      </div>
    </div>

    <div class="table-responsive">
      <table class="admin-table">
        <thead>
          <tr>
            <th style="min-width:180px;">报错关联资源</th>
            <th>问题类型</th>
            <th style="min-width:240px;">详细报错描述</th>
            <th>报错截图</th>
            <th>当前状态</th>
            <th>提交时间</th>
            <th style="min-width:180px;">处理操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="7" style="text-align:center;padding:40px;color:#94a3b8;">正在加载网盘失效工单...</td>
          </tr>
          <tr v-else-if="reports.length === 0">
            <td colspan="7" style="text-align:center;padding:40px;color:#94a3b8;">暂无符合条件的失效工单</td>
          </tr>
          <tr v-for="r in reports" :key="r.id">
            <td>
              <div style="font-weight:700;color:#ffffff;">{{ r.resource_title || '未指定资源名称' }}</div>
              <div style="font-size:11px;color:#64748b;margin-top:2px;">ID: <code>{{ r.resource_id }}</code></div>
            </td>
            <td>
              <span v-if="r.issue_type === '链接失效'" class="badge badge-red">链接失效</span>
              <span v-else-if="r.issue_type === '提取码错误'" class="badge badge-gold">提取码错误</span>
              <span v-else class="badge badge-blue">{{ r.issue_type || '其他问题' }}</span>
            </td>
            <td>
              <div class="cell-desc" :title="r.detail_text">{{ r.detail_text || '无详细描述' }}</div>
              <div v-if="r.channels" style="font-size:11px;color:#64748b;margin-top:2px;">反馈网盘: {{ r.channels }}</div>
            </td>
            <td>
              <div v-if="r.screenshots && r.screenshots.length" style="display:flex;gap:6px;align-items:center;">
                <a
                  v-for="(img, idx) in r.screenshots"
                  :key="idx"
                  :href="img"
                  target="_blank"
                  class="badge badge-blue"
                  style="text-decoration:none;"
                >
                  图{{ idx + 1 }} ↗
                </a>
              </div>
              <span v-else style="color:#64748b;">无截图</span>
            </td>
            <td>
              <span v-if="r.status === 'resolved'" class="badge badge-green">✓ 已补档恢复</span>
              <span v-else-if="r.status === 'rejected'" class="badge badge-gray">✕ 已驳回正常</span>
              <span v-else class="badge badge-red">● 待排查修复</span>
            </td>
            <td style="font-size:12px;color:#64748b;">
              {{ r.created ? r.created.substring(0, 16).replace('T', ' ') : '-' }}
            </td>
            <td>
              <div class="table-btn-group">
                <button
                  v-if="r.status !== 'resolved'"
                  class="btn btn-secondary btn-sm"
                  style="background:rgba(16,185,129,0.15);color:#10b981;border-color:rgba(16,185,129,0.3);"
                  @click="updateStatus(r, 'resolved', '网盘链接已补档')"
                >
                  标记已补档
                </button>
                <button
                  v-if="r.status !== 'rejected'"
                  class="btn btn-secondary btn-sm"
                  style="color:#94a3b8;"
                  @click="updateStatus(r, 'rejected', '核实链接无误，原样保留')"
                >
                  驳回
                </button>
                <button class="btn btn-danger btn-sm" @click="deleteReport(r)">
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

const reports = ref([]);
const totalCount = ref(0);
const loading = ref(false);
const statusFilter = ref('');

const loadReports = async () => {
  loading.value = true;
  try {
    let filter = '';
    if (statusFilter.value) {
      filter = `status = "${statusFilter.value}"`;
    }
    const res = await reportService.getReports({ filter });
    reports.value = res.items || [];
    totalCount.value = res.totalItems || reports.value.length;
  } catch (e) {
    toast.error('加载报错工单失败: ' + e.message);
  } finally {
    loading.value = false;
  }
};

const updateStatus = async (r, status, status_text) => {
  try {
    await reportService.updateReportStatus(r.id, status, status_text);
    r.status = status;
    r.status_text = status_text;
    toast.success('工单状态已更新！');
  } catch (e) {
    alert('更新失败: ' + e.message);
  }
};

const deleteReport = async (r) => {
  if (!confirm('确定要删除此条纠错工单记录吗？')) return;
  try {
    await reportService.deleteReport(r.id);
    toast.success('工单记录已删除');
    await loadReports();
  } catch (e) {
    alert('删除失败: ' + e.message);
  }
};

onMounted(() => {
  loadReports();
});
</script>
