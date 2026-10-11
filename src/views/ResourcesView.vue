<template>
  <div class="data-card full-width-card">
    <div class="card-header">
      <div class="card-title">
        <span>📦 资源中心全部资产管理</span>
        <span class="card-title-badge">{{ totalCount }} 项资产</span>
      </div>
      <div class="card-actions">
        <div class="search-filter-bar">
          <div class="search-input-wrap">
            <span class="search-icon-pos">🔍</span>
            <input
              type="text"
              class="search-input"
              v-model="keyword"
              placeholder="搜索名称、关键词或 ID..."
              @input="handleSearch"
            />
          </div>
          <select class="select-filter" v-model="selectedCategory" @change="loadData">
            <option value="">全部分类</option>
            <option v-for="c in categories" :key="c.cat_id || c.id" :value="c.cat_id">
              {{ c.name }}
            </option>
          </select>
          <select class="select-filter" v-model="sortOrder" @change="loadData">
            <option value="-downloads">按下载量最高</option>
            <option value="-created">按最新发布</option>
            <option value="-rating">按评分最高</option>
            <option value="-favCount">按收藏量最高</option>
          </select>
        </div>
        <router-link to="/resources/create" target="_blank" class="btn btn-primary">
          <span>+ 新增资源 (新开页面)</span>
        </router-link>
      </div>
    </div>

    <div class="table-responsive">
      <table class="admin-table compact-table">
        <thead>
          <tr>
            <th style="min-width:200px;">资产信息</th>
            <th>版本号</th>
            <th>所属分类</th>
            <th>体积</th>
            <th>评分</th>
            <th>转存</th>
            <th>收藏</th>
            <th>网盘直链</th>
            <th>提取码</th>
            <th>细分标签</th>
            <th>更新时间</th>
            <th style="min-width:110px;">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="12" style="text-align:center;padding:40px;color:#94a3b8;">正在从云端拉取资源...</td>
          </tr>
          <tr v-else-if="items.length === 0">
            <td colspan="12" style="text-align:center;padding:40px;color:#94a3b8;">暂无符合条件的资源</td>
          </tr>
          <tr v-for="item in items" :key="item.id">
            <!-- 1. 资产信息 -->
            <td>
              <div class="table-title-cell">
                <div class="res-thumb-icon">
                  <img v-if="item.icon && !failedIcons[item.id]" :src="item.icon" @error="failedIcons[item.id] = true" />
                  <div v-else class="res-icon-placeholder">{{ (item.title || '宝').charAt(0) }}</div>
                </div>
                <div class="res-name-block">
                  <span class="res-name-txt" :title="item.title">{{ item.title }}</span>
                  <span class="res-sub-txt">{{ item.platform || '全平台' }} · <code style="color:#60a5fa;">{{ item.res_id || item.id }}</code></span>
                </div>
              </div>
            </td>
            <!-- 2. 版本号 -->
            <td><span class="badge badge-blue">{{ item.version || '最新版' }}</span></td>
            <!-- 3. 所属分类 -->
            <td><span class="badge badge-gray">{{ getCategoryName(item.category) }}</span></td>
            <!-- 4. 体积 -->
            <td>{{ item.size || '-' }}</td>
            <!-- 5. 评分 -->
            <td><span style="color:#f59e0b;font-weight:700;">★ {{ item.rating || '9.9' }}</span></td>
            <!-- 6. 累计转存 -->
            <td><b style="color:#38bdf8;">{{ item.downloads || 0 }}</b> 次</td>
            <!-- 7. 收藏数 -->
            <td><span style="color:#ec4899;font-weight:600;">❤ {{ item.favCount || 0 }}</span></td>
            <!-- 8. 网盘直链 (简短胶囊展示，点击直达) -->
            <td>
              <a
                v-if="item.panUrl"
                :href="item.panUrl"
                target="_blank"
                class="pan-link-pill"
                :title="item.panUrl + (item.pwd ? ' (提取码: ' + item.pwd + ')' : '')"
              >
                <span>🔗 {{ getPanShortName(item.panUrl) }} ↗</span>
              </a>
              <span v-else style="color:#64748b;">无链接</span>
            </td>
            <!-- 9. 提取码 -->
            <td>
              <span v-if="item.pwd && item.pwd !== '免码'" class="badge badge-green">{{ item.pwd }}</span>
              <span v-else class="badge badge-gray">免码</span>
            </td>
            <!-- 10. 角标标签 -->
            <td>
              <span v-if="item.badge" class="badge badge-gold">{{ item.badge }}</span>
              <span v-else style="color:#64748b;">-</span>
            </td>
            <!-- 11. 更新时间 -->
            <td style="font-size:12px;color:#64748b;">
              {{ (item.updated || item.created || '-').substring(0, 10) }}
            </td>
            <!-- 12. 操作 -->
            <td>
              <div class="table-btn-group">
                <router-link :to="'/resources/edit/' + item.id" target="_blank" class="btn btn-secondary btn-sm" title="在新页面打开编辑">
                  编辑
                </router-link>
                <button class="btn btn-danger btn-sm" @click="handleDelete(item)">
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
import { ref, reactive, onMounted } from 'vue';
import { resourceService, categoryService } from '../api/services.js';
import { toast } from '../utils/toast.js';

const items = ref([]);
const totalCount = ref(0);
const loading = ref(false);
const keyword = ref('');
const selectedCategory = ref('');
const sortOrder = ref('-downloads');
const categories = ref([]);
const failedIcons = reactive({});

const getCategoryName = (catId) => {
  const found = categories.value.find(c => c.cat_id === catId);
  return found ? found.name : (catId || '通用');
};

const getPanShortName = (url) => {
  if (!url) return '网盘直链';
  const u = url.toLowerCase();
  if (u.includes('quark')) return '夸克网盘';
  if (u.includes('baidu')) return '百度网盘';
  if (u.includes('ali')) return '阿里网盘';
  if (u.includes('123')) return '123云盘';
  if (u.includes('lanzou')) return '蓝奏云';
  if (u.includes('xunlei')) return '迅雷云盘';
  return '网盘转存';
};

const loadData = async () => {
  loading.value = true;
  try {
    let filter = '';
    const conds = [];
    if (keyword.value.trim()) {
      conds.push(`title ~ "${keyword.value.trim()}" || res_id ~ "${keyword.value.trim()}"`);
    }
    if (selectedCategory.value) {
      conds.push(`category = "${selectedCategory.value}"`);
    }
    if (conds.length > 0) {
      filter = conds.join(' && ');
    }

    const res = await resourceService.list({
      page: 1,
      perPage: 50,
      sort: sortOrder.value,
      filter
    });

    items.value = res.items || [];
    totalCount.value = res.totalItems || items.value.length;
  } catch (e) {
    toast.error('加载资源列表失败: ' + e.message);
  } finally {
    loading.value = false;
  }
};

let searchTimer = null;
const handleSearch = () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    loadData();
  }, 300);
};

const handleDelete = async (item) => {
  if (!confirm(`确定要下架并删除资源「${item.title}」吗？`)) return;
  try {
    await resourceService.delete(item.id);
    toast.success(`资源「${item.title}」已删除`);
    await loadData();
  } catch (e) {
    alert('删除失败: ' + e.message);
  }
};

onMounted(async () => {
  categoryService.getCategories().then(cats => categories.value = cats).catch(() => {});
  loadData();
});
</script>

<style scoped>
.full-width-card {
  width: 100%;
}
.compact-table {
  width: 100%;
  table-layout: auto;
}

.table-tags-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: nowrap;
}

.table-tag-pill {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.3);
  white-space: nowrap;
}

.table-tag-more {
  font-size: 10px;
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.08);
  padding: 2px 4px;
  border-radius: 3px;
}

</style>
