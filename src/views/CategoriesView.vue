<template>
  <div class="categories-page">
    <!-- 1. 大分类管理模块 (categories) -->
    <div class="data-card">
      <div class="card-header">
        <div class="card-title">
          <span>🏷️ 小程序大分类管理 (categories)</span>
          <span class="card-title-badge">{{ categories.length }} 个分类</span>
        </div>
        <div class="card-actions">
          <button class="btn btn-primary btn-sm" @click="openCatModal()">+ 新增大分类</button>
        </div>
      </div>
      <div class="table-responsive">
        <table class="admin-table">
          <thead>
            <tr>
              <th>分类代码 (cat_id)</th>
              <th>分类名称</th>
              <th>图标路径</th>
              <th>样式类 (bgClass)</th>
              <th>角标状态</th>
              <th>排序权重</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loadingCats">
              <td colspan="7" style="text-align:center;padding:30px;">正在加载分类数据...</td>
            </tr>
            <tr v-else-if="categories.length === 0">
              <td colspan="7" style="text-align:center;padding:30px;color:#94a3b8;">暂无分类数据</td>
            </tr>
            <tr v-for="cat in categories" :key="cat.id">
              <td><span style="font-family:monospace;font-weight:700;color:#60a5fa;">{{ cat.cat_id }}</span></td>
              <td><span style="font-weight:700;color:#ffffff;">{{ cat.name }}</span></td>
              <td><span style="font-size:12px;color:#94a3b8;">{{ cat.icon || '-' }}</span></td>
              <td><span class="badge badge-gray">{{ cat.bgClass || 'default' }}</span></td>
              <td>
                <span v-if="cat.hasHot" class="badge badge-red">HOT 热门</span>
                <span v-else-if="cat.badge" class="badge badge-gold">{{ cat.badge }}</span>
                <span v-else style="color:#64748b;">-</span>
              </td>
              <td>{{ cat.sort || 0 }}</td>
              <td>
                <div class="table-btn-group">
                  <button class="btn btn-secondary btn-sm" @click="openCatModal(cat)">编辑</button>
                  <button class="btn btn-danger btn-sm" @click="deleteCategory(cat)">删除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 2. 细分快捷场景标签管理模块 (quick_tags) -->
    <div class="data-card" style="margin-top:24px;">
      <div class="card-header">
        <div class="card-title">
          <span>🔖 细分快捷场景标签 (quick_tags)</span>
          <span class="card-title-badge">{{ tags.length }} 个标签</span>
        </div>
        <div class="card-actions">
          <button class="btn btn-primary btn-sm" @click="openTagModal()">+ 新增场景标签</button>
        </div>
      </div>
      <div class="table-responsive">
        <table class="admin-table">
          <thead>
            <tr>
              <th>标签代码 (tag_id)</th>
              <th>标签名称</th>
              <th>红点标识 (hasDot)</th>
              <th>箭头标识 (hasArrow)</th>
              <th>当前状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loadingTags">
              <td colspan="6" style="text-align:center;padding:30px;">正在加载标签数据...</td>
            </tr>
            <tr v-else-if="tags.length === 0">
              <td colspan="6" style="text-align:center;padding:30px;color:#94a3b8;">暂无标签数据</td>
            </tr>
            <tr v-for="tag in tags" :key="tag.id">
              <td><span style="font-family:monospace;font-weight:700;color:#60a5fa;">{{ tag.tag_id }}</span></td>
              <td><span class="badge badge-blue">{{ tag.name }}</span></td>
              <td>
                <span v-if="tag.hasDot" style="color:#ef4444;font-weight:700;">● 有指示点</span>
                <span v-else style="color:#64748b;">无</span>
              </td>
              <td>
                <span v-if="tag.hasArrow" style="color:#60a5fa;font-weight:700;">➔ 有箭头</span>
                <span v-else style="color:#64748b;">无</span>
              </td>
              <td>
                <button
                  class="btn btn-sm"
                  :class="tag.active ? 'btn-success' : 'btn-secondary'"
                  style="font-size:11px;"
                  @click="toggleTagActive(tag)"
                >
                  {{ tag.active ? '✓ 已激活 (点击禁用)' : '✕ 未激活 (点击激活)' }}
                </button>
              </td>
              <td>
                <div class="table-btn-group">
                  <button class="btn btn-secondary btn-sm" @click="openTagModal(tag)">编辑</button>
                  <button class="btn btn-danger btn-sm" @click="deleteTag(tag)">删除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 分类新增/编辑 Modal -->
    <div class="modal-overlay" :class="{ active: showCatModal }">
      <div class="modal-box">
        <div class="modal-header">
          <span class="modal-title">{{ editingCatId ? '编辑大分类' : '新增大分类' }}</span>
          <button class="modal-close" @click="showCatModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group" style="flex:1;">
              <label class="form-label">分类唯一英文代码 (cat_id)*</label>
              <input type="text" class="form-input" v-model="catForm.cat_id" placeholder="如：ai / tools / media" />
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">分类中文名称*</label>
              <input type="text" class="form-input" v-model="catForm.name" placeholder="如：AI 智能助手" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group" style="flex:1;">
              <label class="form-label">图标地址 (icon)</label>
              <input type="text" class="form-input" v-model="catForm.icon" placeholder="如：/images/cat_ai.svg" />
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">背景样式类 (bgClass)</label>
              <input type="text" class="form-input" v-model="catForm.bgClass" placeholder="如：cat-purple" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group" style="flex:1;">
              <label class="form-label">排序权重 (数字越大越靠后)</label>
              <input type="number" class="form-input" v-model.number="catForm.sort" placeholder="10" />
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">角标文案 (badge)</label>
              <input type="text" class="form-input" v-model="catForm.badge" placeholder="如：HOT / NEW" />
            </div>
          </div>
          <div class="form-group" style="margin-top:10px;">
            <label style="display:flex;align-items:center;gap:8px;color:#cbd5e1;cursor:pointer;">
              <input type="checkbox" v-model="catForm.hasHot" style="width:18px;height:18px;" />
              <span>标为热门分类 (显示红底 HOT 角标)</span>
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="showCatModal = false">取消</button>
          <button type="button" class="btn btn-primary" :disabled="savingCat" @click="saveCategory">
            {{ savingCat ? '保存中...' : '保存至数据库' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 标签新增/编辑 Modal -->
    <div class="modal-overlay" :class="{ active: showTagModal }">
      <div class="modal-box">
        <div class="modal-header">
          <span class="modal-title">{{ editingTagId ? '编辑快捷标签' : '新增快捷标签' }}</span>
          <button class="modal-close" @click="showTagModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group" style="flex:1;">
              <label class="form-label">标签英文代码 (tag_id)*</label>
              <input type="text" class="form-input" v-model="tagForm.tag_id" placeholder="如：top / discount" />
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">标签展示名称*</label>
              <input type="text" class="form-input" v-model="tagForm.name" placeholder="如：特惠精选" />
            </div>
          </div>
          <div class="form-group" style="margin-top:10px;display:flex;gap:24px;">
            <label style="display:flex;align-items:center;gap:8px;color:#cbd5e1;cursor:pointer;">
              <input type="checkbox" v-model="tagForm.hasDot" style="width:18px;height:18px;" />
              <span>显示醒目指示红点 (hasDot)</span>
            </label>
            <label style="display:flex;align-items:center;gap:8px;color:#cbd5e1;cursor:pointer;">
              <input type="checkbox" v-model="tagForm.hasArrow" style="width:18px;height:18px;" />
              <span>显示右侧跳转箭头 (hasArrow)</span>
            </label>
            <label style="display:flex;align-items:center;gap:8px;color:#cbd5e1;cursor:pointer;">
              <input type="checkbox" v-model="tagForm.active" style="width:18px;height:18px;" />
              <span>默认激活状态 (active)</span>
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="showTagModal = false">取消</button>
          <button type="button" class="btn btn-primary" :disabled="savingTag" @click="saveTag">
            {{ savingTag ? '保存中...' : '保存至数据库' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { categoryService } from '../api/services.js';
import { toast } from '../utils/toast.js';

const categories = ref([]);
const tags = ref([]);
const loadingCats = ref(false);
const loadingTags = ref(false);

// Category Modal State
const showCatModal = ref(false);
const editingCatId = ref(null);
const savingCat = ref(false);
const catForm = reactive({
  cat_id: '',
  name: '',
  icon: '/images/cat_tools.svg',
  bgClass: 'cat-blue',
  badge: '',
  sort: 10,
  hasHot: false
});

// Tag Modal State
const showTagModal = ref(false);
const editingTagId = ref(null);
const savingTag = ref(false);
const tagForm = reactive({
  tag_id: '',
  name: '',
  hasDot: false,
  hasArrow: false,
  active: true
});

const loadCategories = async () => {
  loadingCats.value = true;
  try {
    categories.value = await categoryService.getCategories();
  } catch (e) {
    toast.error('加载分类失败: ' + e.message);
  } finally {
    loadingCats.value = false;
  }
};

const loadTags = async () => {
  loadingTags.value = true;
  try {
    tags.value = await categoryService.getQuickTags();
  } catch (e) {
    toast.error('加载标签失败: ' + e.message);
  } finally {
    loadingTags.value = false;
  }
};

// Category CRUD
const openCatModal = (cat = null) => {
  if (cat) {
    editingCatId.value = cat.id;
    catForm.cat_id = cat.cat_id || '';
    catForm.name = cat.name || '';
    catForm.icon = cat.icon || '';
    catForm.bgClass = cat.bgClass || 'cat-blue';
    catForm.badge = cat.badge || '';
    catForm.sort = cat.sort || 0;
    catForm.hasHot = !!cat.hasHot;
  } else {
    editingCatId.value = null;
    catForm.cat_id = '';
    catForm.name = '';
    catForm.icon = '/images/cloud.svg';
    catForm.bgClass = 'cat-blue';
    catForm.badge = '';
    catForm.sort = (categories.value.length + 1) * 10;
    catForm.hasHot = false;
  }
  showCatModal.value = true;
};

const saveCategory = async () => {
  if (!catForm.cat_id.trim() || !catForm.name.trim()) {
    alert('请填写分类代码及分类名称！');
    return;
  }

  savingCat.value = true;
  try {
    const payload = {
      cat_id: catForm.cat_id.trim(),
      name: catForm.name.trim(),
      icon: catForm.icon.trim(),
      bgClass: catForm.bgClass.trim(),
      badge: catForm.badge.trim(),
      sort: Number(catForm.sort) || 0,
      hasHot: !!catForm.hasHot
    };

    if (editingCatId.value) {
      await categoryService.updateCategory(editingCatId.value, payload);
      toast.success('大分类更新成功！');
    } else {
      await categoryService.createCategory(payload);
      toast.success('新增大分类成功！');
    }

    showCatModal.value = false;
    await loadCategories();
  } catch (e) {
    alert('保存分类失败: ' + e.message);
  } finally {
    savingCat.value = false;
  }
};

const deleteCategory = async (cat) => {
  if (!confirm(`确定要永久删除分类「${cat.name} (${cat.cat_id})」吗？此操作不可撤销！`)) {
    return;
  }
  try {
    await categoryService.deleteCategory(cat.id);
    toast.success(`分类「${cat.name}」已删除`);
    await loadCategories();
  } catch (e) {
    alert('删除失败: ' + e.message);
  }
};

// Tag CRUD
const openTagModal = (tag = null) => {
  if (tag) {
    editingTagId.value = tag.id;
    tagForm.tag_id = tag.tag_id || '';
    tagForm.name = tag.name || '';
    tagForm.hasDot = !!tag.hasDot;
    tagForm.hasArrow = !!tag.hasArrow;
    tagForm.active = !!tag.active;
  } else {
    editingTagId.value = null;
    tagForm.tag_id = '';
    tagForm.name = '';
    tagForm.hasDot = false;
    tagForm.hasArrow = false;
    tagForm.active = true;
  }
  showTagModal.value = true;
};

const saveTag = async () => {
  if (!tagForm.tag_id.trim() || !tagForm.name.trim()) {
    alert('请填写标签代码及标签名称！');
    return;
  }

  savingTag.value = true;
  try {
    const payload = {
      tag_id: tagForm.tag_id.trim(),
      name: tagForm.name.trim(),
      hasDot: !!tagForm.hasDot,
      hasArrow: !!tagForm.hasArrow,
      active: !!tagForm.active
    };

    if (editingTagId.value) {
      await categoryService.updateTag(editingTagId.value, payload);
      toast.success('快捷标签更新成功！');
    } else {
      await categoryService.createTag(payload);
      toast.success('新增快捷标签成功！');
    }

    showTagModal.value = false;
    await loadTags();
  } catch (e) {
    alert('保存标签失败: ' + e.message);
  } finally {
    savingTag.value = false;
  }
};

const toggleTagActive = async (tag) => {
  try {
    await categoryService.toggleTagActive(tag.id, tag.active);
    tag.active = !tag.active;
    toast.success(`标签「${tag.name}」状态已更新为: ${tag.active ? '已激活' : '未激活'}`);
  } catch (e) {
    toast.error('切换状态失败: ' + e.message);
  }
};

const deleteTag = async (tag) => {
  if (!confirm(`确定要删除标签「${tag.name} (${tag.tag_id})」吗？`)) {
    return;
  }
  try {
    await categoryService.deleteTag(tag.id);
    toast.success(`标签「${tag.name}」已删除`);
    await loadTags();
  } catch (e) {
    alert('删除失败: ' + e.message);
  }
};

onMounted(() => {
  loadCategories();
  loadTags();
});
</script>

<style scoped>
.btn-success {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.4);
}
.btn-success:hover {
  background: rgba(16, 185, 129, 0.3);
}
</style>
