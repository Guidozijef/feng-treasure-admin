<template>
  <div>
    <!-- VIP 套餐管理 -->
    <div class="data-card">
      <div class="card-header">
        <div class="card-title">
          <span>👑 VIP 会员套餐配置 (vip_plans)</span>
          <span class="card-title-badge">{{ plans.length }} 个套餐</span>
        </div>
        <div class="card-actions">
          <button class="btn btn-primary btn-sm" @click="openPlanModal()">+ 新增套餐</button>
        </div>
      </div>
      <div class="table-responsive">
        <table class="admin-table">
          <thead>
            <tr>
              <th>套餐标识 (plan_id)</th>
              <th>套餐名称</th>
              <th>现价 (元)</th>
              <th>原价 (元)</th>
              <th>周期描述</th>
              <th>角标文案</th>
              <th>日均折算</th>
              <th>排序权重</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loadingPlans">
              <td colspan="9" style="text-align:center;padding:30px;">正在载入套餐...</td>
            </tr>
            <tr v-for="p in plans" :key="p.id">
              <td><span style="font-family:monospace;font-weight:700;color:#60a5fa;">{{ p.plan_id }}</span></td>
              <td><span style="font-weight:700;color:#ffffff;">{{ p.name }}</span></td>
              <td><span style="color:#f59e0b;font-weight:700;font-size:15px;">￥{{ p.price }}</span></td>
              <td style="color:#64748b;text-decoration:line-through;">￥{{ p.originalPrice || p.price }}</td>
              <td>{{ p.unit || '期' }}</td>
              <td><span class="badge badge-gold">{{ p.badge || '热卖' }}</span></td>
              <td>{{ p.perDay || '-' }}</td>
              <td>{{ p.sort || 0 }}</td>
              <td>
                <div class="table-btn-group">
                  <button class="btn btn-secondary btn-sm" @click="openPlanModal(p)">编辑</button>
                  <button class="btn btn-danger btn-sm" @click="deletePlan(p)">删除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- VIP 订单流水 -->
    <div class="data-card" style="margin-top:24px;">
      <div class="card-header">
        <div class="card-title">
          <span>💳 VIP 会员购买与充值真实订单流水 (vip_orders)</span>
          <span class="card-title-badge">{{ orders.length }} 笔订单</span>
        </div>
      </div>
      <div class="table-responsive">
        <table class="admin-table">
          <thead>
            <tr>
              <th>订单号 (order_no)</th>
              <th>买家 UID</th>
              <th>购买套餐</th>
              <th>实付金额</th>
              <th>支付状态</th>
              <th>下单时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loadingOrders">
              <td colspan="6" style="text-align:center;padding:30px;">正在拉取订单流水...</td>
            </tr>
            <tr v-else-if="orders.length === 0">
              <td colspan="6" style="text-align:center;padding:30px;color:#94a3b8;">暂无真实购买订单</td>
            </tr>
            <tr v-for="o in orders" :key="o.id">
              <td><span style="font-family:monospace;color:#94a3b8;">{{ o.order_no || o.id }}</span></td>
              <td><span style="font-family:monospace;font-weight:700;color:#60a5fa;">{{ o.uid }}</span></td>
              <td><span style="font-weight:700;color:#ffffff;">{{ o.plan_name || o.plan_id }}</span></td>
              <td><span style="color:#10b981;font-weight:700;">￥{{ o.price }}</span></td>
              <td>
                <span v-if="o.pay_status === 'paid' || o.pay_status === 'success'" class="badge badge-green">已支付</span>
                <span v-else class="badge badge-gray">待支付</span>
              </td>
              <td style="font-size:12px;color:#64748b;">{{ o.created ? o.created.substring(0, 19).replace('T', ' ') : '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 套餐编辑 Modal -->
    <div class="modal-overlay" :class="{ active: showModal }">
      <div class="modal-box">
        <div class="modal-header">
          <span class="modal-title">{{ editingPlanId ? '编辑 VIP 套餐' : '新增 VIP 套餐' }}</span>
          <button class="modal-close" @click="showModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group" style="flex:1;">
              <label class="form-label">套餐唯一标识 (plan_id)*</label>
              <input type="text" class="form-input" v-model="formPlan.plan_id" placeholder="如：month / year / lifetime" />
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">套餐名称*</label>
              <input type="text" class="form-input" v-model="formPlan.name" placeholder="如：年度黑卡 (365天)" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group" style="flex:1;">
              <label class="form-label">现价 (元)*</label>
              <input type="number" step="0.1" class="form-input" v-model.number="formPlan.price" placeholder="68" />
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">原价 (元)</label>
              <input type="number" step="0.1" class="form-input" v-model.number="formPlan.originalPrice" placeholder="128" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group" style="flex:1;">
              <label class="form-label">周期描述 (unit)</label>
              <input type="text" class="form-input" v-model="formPlan.unit" placeholder="如：年 / 月 / 永久" />
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">角标文案 (badge)</label>
              <input type="text" class="form-input" v-model="formPlan.badge" placeholder="如：超值热荐 / 限时特惠" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group" style="flex:1;">
              <label class="form-label">日均单价 (perDay)</label>
              <input type="text" class="form-input" v-model="formPlan.perDay" placeholder="如：合 0.18元/天" />
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">排序权重</label>
              <input type="number" class="form-input" v-model.number="formPlan.sort" placeholder="10" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="showModal = false">取消</button>
          <button type="button" class="btn btn-primary" :disabled="saving" @click="savePlan">
            {{ saving ? '保存中...' : '保存至数据库' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { vipService } from '../api/services.js';
import { toast } from '../utils/toast.js';

const plans = ref([]);
const orders = ref([]);
const loadingPlans = ref(false);
const loadingOrders = ref(false);

const showModal = ref(false);
const editingPlanId = ref(null);
const saving = ref(false);
const formPlan = reactive({
  plan_id: '',
  name: '',
  price: 68,
  originalPrice: 128,
  unit: '年',
  badge: '热卖',
  perDay: '合 0.18元/天',
  sort: 10
});

const loadPlans = async () => {
  loadingPlans.value = true;
  try {
    plans.value = await vipService.getPlans();
  } catch (e) {
    toast.error('加载套餐失败: ' + e.message);
  } finally {
    loadingPlans.value = false;
  }
};

const loadOrders = async () => {
  loadingOrders.value = true;
  try {
    const res = await vipService.getOrders();
    orders.value = res.items || [];
  } catch (e) {
    toast.error('加载订单失败: ' + e.message);
  } finally {
    loadingOrders.value = false;
  }
};

const openPlanModal = (p = null) => {
  if (p) {
    editingPlanId.value = p.id;
    formPlan.plan_id = p.plan_id;
    formPlan.name = p.name;
    formPlan.price = p.price;
    formPlan.originalPrice = p.originalPrice || p.price;
    formPlan.unit = p.unit || '年';
    formPlan.badge = p.badge || '';
    formPlan.perDay = p.perDay || '';
    formPlan.sort = p.sort || 0;
  } else {
    editingPlanId.value = null;
    formPlan.plan_id = '';
    formPlan.name = '';
    formPlan.price = 9.9;
    formPlan.originalPrice = 19.9;
    formPlan.unit = '月';
    formPlan.badge = '热门';
    formPlan.perDay = '合 0.33元/天';
    formPlan.sort = (plans.value.length + 1) * 10;
  }
  showModal.value = true;
};

const savePlan = async () => {
  if (!formPlan.plan_id.trim() || !formPlan.name.trim()) {
    alert('请填写套餐标识与名称！');
    return;
  }
  saving.value = true;
  try {
    const payload = {
      plan_id: formPlan.plan_id.trim(),
      name: formPlan.name.trim(),
      price: Number(formPlan.price) || 0,
      originalPrice: Number(formPlan.originalPrice) || 0,
      unit: formPlan.unit.trim(),
      badge: formPlan.badge.trim(),
      perDay: formPlan.perDay.trim(),
      sort: Number(formPlan.sort) || 0
    };
    if (editingPlanId.value) {
      await vipService.updatePlan(editingPlanId.value, payload);
      toast.success('VIP 套餐更新成功！');
    } else {
      await vipService.createPlan(payload);
      toast.success('新增 VIP 套餐成功！');
    }
    showModal.value = false;
    await loadPlans();
  } catch (e) {
    alert('保存失败: ' + e.message);
  } finally {
    saving.value = false;
  }
};

const deletePlan = async (p) => {
  if (!confirm(`确定要删除套餐「${p.name}」吗？`)) return;
  try {
    await vipService.deletePlan(p.id);
    toast.success('套餐已删除');
    await loadPlans();
  } catch (e) {
    alert('删除失败: ' + e.message);
  }
};

onMounted(() => {
  loadPlans();
  loadOrders();
});
</script>
