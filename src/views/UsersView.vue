<template>
  <div class="data-card">
    <div class="card-header">
      <div class="card-title">
        <span>👥 小程序注册用户与会员管理 (user_profiles)</span>
        <span class="card-title-badge">{{ totalUsers }} 人</span>
      </div>
      <div class="card-actions">
        <div class="search-filter-bar">
          <div class="search-input-wrap">
            <span class="search-icon-pos">🔍</span>
            <input
              type="text"
              class="search-input"
              v-model="keyword"
              placeholder="按 UID 或微信昵称检索用户..."
              @input="handleSearch"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="table-responsive">
      <table class="admin-table">
        <thead>
          <tr>
            <th>用户画像</th>
            <th>UID</th>
            <th>会员身份</th>
            <th>VIP 到期时间</th>
            <th>云豆积分</th>
            <th>累计转存</th>
            <th>收藏数</th>
            <th>工单数</th>
            <th>注册时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="10" style="text-align:center;padding:30px;">正在加载用户列表...</td>
          </tr>
          <tr v-else-if="users.length === 0">
            <td colspan="10" style="text-align:center;padding:30px;color:#94a3b8;">暂无注册用户</td>
          </tr>
          <tr v-for="u in users" :key="u.id">
            <td>
              <div style="display:flex;align-items:center;gap:10px;">
                <img
                  v-if="u.avatar && !failedAvatars[u.id]"
                  :src="u.avatar"
                  style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:1px solid rgba(255,255,255,0.15);"
                  @error="failedAvatars[u.id] = true"
                />
                <div v-else class="user-avatar-placeholder">{{ (u.nickName || '用').charAt(0) }}</div>
                <div>
                  <div style="font-weight:700;color:#ffffff;">{{ u.nickName || '微信用户' }}</div>
                  <div style="font-size:11px;color:#64748b;">{{ u.openid ? '微信绑定' : '游客' }}</div>
                </div>
              </div>
            </td>
            <td><span style="font-family:monospace;font-weight:600;color:#94a3b8;">{{ u.uid || u.id }}</span></td>
            <td>
              <span v-if="u.isSvip" class="badge badge-gold">👑 SVIP 极客黑卡</span>
              <span v-else class="badge badge-gray">普通用户</span>
            </td>
            <td>{{ u.vipExpireDate || '未开通' }}</td>
            <td><span style="color:#f59e0b;font-weight:700;">🪙 {{ u.points || 0 }}</span></td>
            <td>{{ u.downloadCount || 0 }} 次</td>
            <td>{{ u.favCount || 0 }} 个</td>
            <td>{{ u.ticketCount || 0 }} 单</td>
            <td style="font-size:12px;color:#64748b;">{{ u.created ? u.created.substring(0, 10) : '-' }}</td>
            <td>
              <button class="btn btn-secondary btn-sm" @click="openEditModal(u)">特权调配</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 用户权限修改 Modal -->
    <div class="modal-overlay" :class="{ active: showModal }">
      <div class="modal-box">
        <div class="modal-header">
          <span class="modal-title">管理用户会员特权与积分</span>
          <button class="modal-close" @click="showModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">用户昵称与 UID</label>
            <input type="text" class="form-input" :value="(formUser.nickName || '微信用户') + ' (UID: ' + formUser.uid + ')'" disabled />
          </div>
          <div class="form-row">
            <div class="form-group" style="flex:1;">
              <label class="form-label">会员状态*</label>
              <select class="form-select" v-model="formUser.isSvip" @change="onVipStatusChange">
                <option :value="false">普通用户 (无SVIP标识)</option>
                <option :value="true">极客黑卡 SVIP 尊享会员</option>
              </select>
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">VIP 类型文案</label>
              <input type="text" class="form-input" v-model="formUser.vipPlanName" placeholder="如：极客黑卡 SVIP" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group" style="flex:1;">
              <label class="form-label">VIP 到期时间</label>
              <input type="text" class="form-input" v-model="formUser.vipExpireDate" placeholder="如：2027-12-31" />
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">调整云豆积分</label>
              <input type="number" class="form-input" v-model.number="formUser.points" placeholder="当前积分" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">特权状态文案</label>
            <input type="text" class="form-input" v-model="formUser.privilegeStatus" placeholder="如：极客黑卡尊享中 · 独家节点生效中" />
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="showModal = false">取消</button>
          <button type="button" class="btn btn-primary" :disabled="saving" @click="saveUser">
            {{ saving ? '保存中...' : '保存更改至数据库' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { userService } from '../api/services.js';
import { toast } from '../utils/toast.js';

const users = ref([]);
const totalUsers = ref(0);
const loading = ref(false);
const keyword = ref('');

const showModal = ref(false);
const saving = ref(false);
const formUser = reactive({
  id: '',
  uid: '',
  nickName: '',
  isSvip: false,
  vipPlanName: '',
  vipExpireDate: '',
  points: 0,
  privilegeStatus: ''
});

const failedAvatars = reactive({});

const loadUsers = async () => {
  loading.value = true;
  try {
    const res = await userService.getUsers({ keyword: keyword.value.trim() });
    users.value = res.items || [];
    totalUsers.value = res.totalItems || users.value.length;
  } catch (e) {
    toast.error('加载用户列表失败: ' + e.message);
  } finally {
    loading.value = false;
  }
};

let timer = null;
const handleSearch = () => {
  clearTimeout(timer);
  timer = setTimeout(() => loadUsers(), 300);
};

const openEditModal = (u) => {
  formUser.id = u.id;
  formUser.uid = u.uid || u.id;
  formUser.nickName = u.nickName;
  formUser.isSvip = !!u.isSvip;
  formUser.vipPlanName = u.vipPlanName || (u.isSvip ? '极客黑卡 SVIP' : '');
  formUser.vipExpireDate = u.vipExpireDate || '';
  formUser.points = u.points || 0;
  formUser.privilegeStatus = u.privilegeStatus || (u.isSvip ? '极客黑卡尊享中 · 独家节点生效中' : '普通用户 · 开通会员享全站满速下载');
  showModal.value = true;
};

const onVipStatusChange = () => {
  if (formUser.isSvip) {
    formUser.vipPlanName = '极客黑卡 SVIP';
    formUser.vipExpireDate = '2027-12-31';
    formUser.privilegeStatus = '极客黑卡尊享中 · 独家节点生效中';
  } else {
    formUser.vipPlanName = '';
    formUser.vipExpireDate = '';
    formUser.privilegeStatus = '普通用户 · 开通会员享全站满速下载';
  }
};

const saveUser = async () => {
  saving.value = true;
  try {
    await userService.update(formUser.id, {
      isSvip: formUser.isSvip,
      vipBadge: formUser.isSvip ? 'SVIP 尊享' : '普通用户',
      vipPlanName: formUser.vipPlanName,
      vipExpireDate: formUser.vipExpireDate,
      points: Number(formUser.points) || 0,
      privilegeStatus: formUser.privilegeStatus
    });
    toast.success('用户会员权益更新成功！');
    showModal.value = false;
    await loadUsers();
  } catch (e) {
    alert('保存失败: ' + e.message);
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  loadUsers();
});
</script>
