<template>
  <div class="categories-page">
    <!-- 顶部概览说明条 -->
    <div class="page-intro-bar">
      <div class="intro-left">
        <span class="intro-icon">🏷️</span>
        <div>
          <h3 class="intro-title">产品分类与细分标签统一管理</h3>
          <p class="intro-desc">细分标签直接关联到各大分类，在小程序首页、分类页、详情页及后台实现 100% 统一展示与精准定向。</p>
        </div>
      </div>
      <button class="btn btn-primary" @click="openCatModal()">+ 新增大分类</button>
    </div>

    <!-- 主体双栏联动布局：左侧大分类列表 (60%) + 右侧关联细分标签管理 (40%) -->
    <div class="category-workbench-grid">
      <!-- 1. 左侧：大分类列表 -->
      <div class="data-card">
        <div class="card-header">
          <div class="card-title">
            <span>📁 基础大分类列表 (categories)</span>
            <span class="card-title-badge">{{ categories.length }} 个分类</span>
          </div>
        </div>
        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th>分类标识 (cat_id)</th>
                <th>分类名称</th>
                <th>细分标签</th>
                <th>排序</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loadingCats">
                <td colspan="5" style="text-align:center;padding:30px;">正在加载分类数据...</td>
              </tr>
              <tr v-else-if="categories.length === 0">
                <td colspan="5" style="text-align:center;padding:30px;color:#94a3b8;">暂无分类数据</td>
              </tr>
              <tr
                v-for="cat in categories"
                :key="cat.id"
                class="category-row"
                :class="{ 'active-cat-row': selectedCat?.id === cat.id }"
                @click="selectCategory(cat)"
              >
                <td>
                  <span class="cat-code-badge">{{ cat.cat_id }}</span>
                </td>
                <td>
                  <div class="cat-name-cell">
                    <span class="cat-name-txt">{{ cat.name }}</span>
                    <span v-if="cat.hasHot" class="badge badge-red" style="font-size:10px;padding:1px 6px;">HOT</span>
                  </div>
                </td>
                <td>
                  <div class="tags-preview-cell">
                    <span class="tag-count-pill">{{ (cat.scenes || []).length }} 个标签</span>
                    <span
                      v-for="(s, idx) in (cat.scenes || []).slice(0, 3)"
                      :key="idx"
                      class="mini-tag-pill"
                    >
                      {{ s.name || s }}
                    </span>
                    <span v-if="(cat.scenes || []).length > 3" class="more-hint">...</span>
                  </div>
                </td>
                <td>{{ cat.sort || 0 }}</td>
                <td>
                  <div class="table-btn-group" @click.stop>
                    <button class="btn btn-secondary btn-sm" @click="openCatModal(cat)">编辑</button>
                    <button class="btn btn-danger btn-sm" @click="deleteCategory(cat)">删除</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 2. 右侧：当前选中分类的细分标签管理 -->
      <div class="data-card tags-manager-card">
        <div class="card-header">
          <div class="card-title">
            <span>🔖 【{{ selectedCat?.name || '选择分类' }}】专属细分标签</span>
            <span class="card-title-badge" v-if="selectedCat">
              {{ currentScenes.length }} 个标签
            </span>
          </div>
          <div class="card-actions" v-if="selectedCat">
            <button
              class="btn btn-success btn-sm"
              :disabled="savingScenes"
              @click="saveCurrentScenes"
            >
              {{ savingScenes ? '正在保存...' : '💾 保存标签变更' }}
            </button>
          </div>
        </div>

        <div v-if="!selectedCat" class="empty-select-tip">
          <span style="font-size:32px;">👈</span>
          <p>请点击左侧分类以查看和管理其关联细分标签</p>
        </div>

        <div v-else class="tags-manager-body">
          <!-- 快捷添加输入框 -->
          <div class="tag-add-input-bar">
            <input
              type="text"
              class="form-input"
              v-model="newTagName"
              placeholder="输入新细分标签名称（如：Win11优化 / 极速直链）"
              @keyup.enter="addTagToCurrent"
            />
            <button type="button" class="btn btn-primary btn-sm" @click="addTagToCurrent">
              + 添加标签
            </button>
          </div>

          <!-- 标签云列表 (支持单独删除) -->
          <div class="current-tags-container">
            <div class="tags-box-label">当前生效标签 (点击 × 可移除)：</div>
            <div class="tags-cloud-wrap" v-if="currentScenes.length > 0">
              <span
                v-for="(tag, index) in currentScenes"
                :key="index"
                class="subtag-chip"
              >
                <span class="subtag-text">{{ tag.name }}</span>
                <span class="subtag-del-btn" @click="removeTag(index)" title="移除此标签">×</span>
              </span>
            </div>
            <div v-else class="no-tags-tip">
              当前分类暂无细分标签，请在上方添加或点击下方快捷推荐。
            </div>
          </div>

          <!-- 推荐高频细分标签池 (一键追加) -->
          <div class="recommend-tags-section">
            <div class="recommend-title">⚡ 常用高频细分标签推荐 (点击一键追加)：</div>
            <div class="recommend-chips-wrap">
              <span
                v-for="rec in recommendTagsPool"
                :key="rec"
                class="rec-chip"
                :class="{ 'already-added': isTagInCurrent(rec) }"
                @click="appendRecommendTag(rec)"
              >
                {{ isTagInCurrent(rec) ? '✓ ' : '+ ' }}{{ rec }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分类新增/编辑 Modal -->
    <div v-if="showCatModal" class="modal-backdrop">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ catForm.id ? '编辑分类' : '新增大分类' }}</h3>
          <button class="modal-close" @click="showCatModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label required">分类代码 (cat_id)</label>
            <input
              type="text"
              class="form-input"
              v-model="catForm.cat_id"
              placeholder="如：pc, dev, study, media"
              :disabled="!!catForm.id"
            />
            <span class="form-hint">英文字母代码，创建后作为全局路由与资源归属标识</span>
          </div>
          <div class="form-group">
            <label class="form-label required">分类显示名称</label>
            <input type="text" class="form-input" v-model="catForm.name" placeholder="如：电脑应用" />
          </div>
          <div class="form-group">
            <label class="form-label">图标路径 (SVG/PNG)</label>
            <input type="text" class="form-input" v-model="catForm.icon" placeholder="/images/cat_pc.svg" />
          </div>
          <div class="form-row">
            <div class="form-group" style="flex:1;">
              <label class="form-label">排序权重</label>
              <input type="number" class="form-input" v-model.number="catForm.sort" placeholder="1" />
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">HOT 热门推荐</label>
              <select class="form-select" v-model="catForm.hasHot">
                <option :value="false">普通显示</option>
                <option :value="true">🔥 标记为 HOT</option>
              </select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showCatModal = false">取消</button>
          <button class="btn btn-primary" :disabled="savingCat" @click="saveCategory">
            {{ savingCat ? '保存中...' : '确认保存' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { categoryService } from '../api/services.js';
import { toast } from '../utils/toast.js';

const categories = ref([]);
const loadingCats = ref(false);
const selectedCat = ref(null);
const currentScenes = ref([]);
const newTagName = ref('');
const savingScenes = ref(false);

const showCatModal = ref(false);
const savingCat = ref(false);
const catForm = reactive({
  id: '',
  cat_id: '',
  name: '',
  icon: '',
  sort: 1,
  hasHot: false,
  scenes: []
});

// 全局高频标签推荐词库
const recommendTagsPool = [
  '装机必备', '纯净无广告', '单文件便携', '永久免激活', '解压即用', '开源神器',
  'Mac 专区', 'Windows常用', 'Win11完美适配', 'M芯片适配', '中文汉化', '双端通用',
  '极速网盘直链', '稀缺绝版', '无水印导出', '附安装教程', '全功能解锁', 'VIP特权版',
  '计算机408', '考研数学', '学霸手写笔记', '高清PDF彩印', '商用免费字库', 'Vue/React源码'
];

const loadCategories = async () => {
  loadingCats.value = true;
  try {
    const list = await categoryService.getCategories();
    categories.value = list;
    if (list.length > 0) {
      if (!selectedCat.value) {
        selectCategory(list[0]);
      } else {
        const found = list.find(c => c.id === selectedCat.value.id);
        if (found) selectCategory(found);
      }
    }
  } catch (err) {
    console.error('加载分类失败:', err);
    toast.error('加载分类数据失败');
  } finally {
    loadingCats.value = false;
  }
};

const selectCategory = (cat) => {
  selectedCat.value = cat;
  const scenes = Array.isArray(cat.scenes) ? cat.scenes : [];
  currentScenes.value = scenes.map((s, idx) => {
    if (typeof s === 'string') return { id: 'tag_' + idx, name: s, active: true };
    return { id: s.id || ('tag_' + idx), name: s.name || s, active: true };
  });
};

const isTagInCurrent = (tagName) => {
  return currentScenes.value.some(t => t.name === tagName);
};

const addTagToCurrent = () => {
  const name = newTagName.value.trim();
  if (!name) return;
  if (isTagInCurrent(name)) {
    toast.warning('该细分标签已存在');
    return;
  }
  currentScenes.value.push({
    id: 'tag_' + Date.now().toString(36),
    name,
    active: true
  });
  newTagName.value = '';
};

const appendRecommendTag = (tagName) => {
  if (isTagInCurrent(tagName)) {
    const idx = currentScenes.value.findIndex(t => t.name === tagName);
    currentScenes.value.splice(idx, 1);
  } else {
    currentScenes.value.push({
      id: 'tag_' + Date.now().toString(36),
      name: tagName,
      active: true
    });
  }
};

const removeTag = (index) => {
  currentScenes.value.splice(index, 1);
};

const saveCurrentScenes = async () => {
  if (!selectedCat.value) return;
  savingScenes.value = true;
  try {
    await categoryService.updateCategoryScenes(selectedCat.value.id, currentScenes.value);
    toast.success('【' + selectedCat.value.name + '】细分标签已成功同步至云端！');
    // 更新本地
    selectedCat.value.scenes = [...currentScenes.value];
    const item = categories.value.find(c => c.id === selectedCat.value.id);
    if (item) item.scenes = [...currentScenes.value];
  } catch (err) {
    console.error('保存标签失败:', err);
    toast.error('保存失败: ' + err.message);
  } finally {
    savingScenes.value = false;
  }
};

const openCatModal = (cat = null) => {
  if (cat) {
    catForm.id = cat.id;
    catForm.cat_id = cat.cat_id;
    catForm.name = cat.name;
    catForm.icon = cat.icon || '';
    catForm.sort = cat.sort || 1;
    catForm.hasHot = !!cat.hasHot;
    catForm.scenes = cat.scenes || [];
  } else {
    catForm.id = '';
    catForm.cat_id = '';
    catForm.name = '';
    catForm.icon = '/images/cat_pc.svg';
    catForm.sort = categories.value.length + 1;
    catForm.hasHot = false;
    catForm.scenes = [];
  }
  showCatModal.value = true;
};

const saveCategory = async () => {
  if (!catForm.cat_id.trim() || !catForm.name.trim()) {
    toast.warning('请填写分类代码和分类名称');
    return;
  }
  savingCat.value = true;
  try {
    const payload = {
      cat_id: catForm.cat_id.trim().toLowerCase(),
      name: catForm.name.trim(),
      icon: catForm.icon.trim(),
      sort: catForm.sort || 1,
      hasHot: catForm.hasHot
    };
    if (catForm.id) {
      await categoryService.updateCategory(catForm.id, payload);
      toast.success('大分类信息更新成功');
    } else {
      payload.scenes = [
        { id: 'tag_1', name: '装机必备', active: true },
        { id: 'tag_2', name: '便携绿色', active: true }
      ];
      await categoryService.createCategory(payload);
      toast.success('大分类新增成功');
    }
    showCatModal.value = false;
    await loadCategories();
  } catch (err) {
    console.error('保存分类失败:', err);
    toast.error('保存分类失败: ' + err.message);
  } finally {
    savingCat.value = false;
  }
};

const deleteCategory = async (cat) => {
  if (!confirm('确定要删除大分类【' + cat.name + '】吗？此操作将同步影响前台与该分类下的资产！')) return;
  try {
    await categoryService.deleteCategory(cat.id);
    toast.success('分类已删除');
    if (selectedCat.value?.id === cat.id) {
      selectedCat.value = null;
    }
    await loadCategories();
  } catch (err) {
    console.error('删除分类失败:', err);
    toast.error('删除失败: ' + err.message);
  }
};

onMounted(() => {
  loadCategories();
});
</script>

<style scoped>
.categories-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.page-intro-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9));
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 12px;
  padding: 14px 20px;
}

.intro-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.intro-icon {
  font-size: 28px;
}

.intro-title {
  margin: 0 0 4px 0;
  font-size: 15px;
  font-weight: 700;
  color: #f8fafc;
}

.intro-desc {
  margin: 0;
  font-size: 12px;
  color: #94a3b8;
}

.category-workbench-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 16px;
  align-items: flex-start;
}

@media (max-width: 1200px) {
  .category-workbench-grid {
    grid-template-columns: 1fr;
  }
}

.category-row {
  cursor: pointer;
  transition: all 0.15s;
}

.category-row:hover {
  background: rgba(59, 130, 246, 0.08);
}

.active-cat-row {
  background: rgba(59, 130, 246, 0.15) !important;
  border-left: 3px solid #3b82f6;
}

.cat-code-badge {
  font-family: monospace;
  font-weight: 700;
  color: #60a5fa;
  background: rgba(59, 130, 246, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.cat-name-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.cat-name-txt {
  font-weight: 700;
  color: #ffffff;
}

.tags-preview-cell {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.tag-count-pill {
  font-size: 11px;
  font-weight: 700;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.15);
  padding: 1px 6px;
  border-radius: 4px;
}

.mini-tag-pill {
  font-size: 11px;
  color: #cbd5e1;
  background: rgba(255, 255, 255, 0.06);
  padding: 1px 6px;
  border-radius: 4px;
}

.more-hint {
  font-size: 11px;
  color: #64748b;
}

/* 右侧标签管理卡片 */
.tags-manager-card {
  min-height: 480px;
}

.empty-select-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #64748b;
  text-align: center;
  gap: 10px;
}

.tags-manager-body {
  padding: 10px 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tag-add-input-bar {
  display: flex;
  gap: 8px;
}

.tags-box-label {
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
  margin-bottom: 8px;
}

.tags-cloud-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  padding: 12px;
  min-height: 80px;
}

.subtag-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.25), rgba(59, 130, 246, 0.35));
  border: 1px solid #3b82f6;
  color: #ffffff;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.2);
}

.subtag-del-btn {
  font-size: 14px;
  font-weight: 800;
  color: #fca5a5;
  cursor: pointer;
  line-height: 1;
}

.subtag-del-btn:hover {
  color: #ef4444;
}

.no-tags-tip {
  color: #64748b;
  font-size: 12px;
  padding: 20px;
  text-align: center;
  background: rgba(15, 23, 42, 0.3);
  border-radius: 8px;
}

.recommend-tags-section {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 14px;
}

.recommend-title {
  font-size: 12px;
  font-weight: 700;
  color: #cbd5e1;
  margin-bottom: 10px;
}

.recommend-chips-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.rec-chip {
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  color: #94a3b8;
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: all 0.2s;
}

.rec-chip:hover {
  background: rgba(59, 130, 246, 0.15);
  border-color: #3b82f6;
  color: #60a5fa;
}

.rec-chip.already-added {
  background: rgba(16, 185, 129, 0.15);
  border-color: #10b981;
  color: #34d399;
}
</style>
