<template>
  <div class="edit-workspace-root">
    <!-- 顶部固定操作条 -->
    <div class="workspace-topbar">
      <div class="topbar-meta">
        <button class="back-pill-btn" @click="handleBackOrClose">
          ← {{ isNewTab ? '关闭此页' : '返回列表' }}
        </button>
        <span class="meta-divider">/</span>
        <div class="meta-title-wrap">
          <span class="meta-status-tag" :class="isEdit ? 'tag-edit' : 'tag-new'">
            {{ isEdit ? '编辑模式' : '新增模式' }}
          </span>
          <h2 class="workspace-main-title">
            {{ isEdit ? (form.title || '编辑数字资产') : '发布新数字资产' }}
          </h2>
        </div>
      </div>
      <div class="topbar-actions">
        <button class="btn btn-secondary" @click="handleBackOrClose">取消</button>
        <button class="btn btn-primary btn-publish" :disabled="isSubmitting" @click="handleSubmit">
          <span class="btn-icon">💾</span>
          <span>{{ isSubmitting ? '正在同步至云端...' : (isEdit ? '保存所有更改' : '立即发布至小程序') }}</span>
        </button>
      </div>
    </div>

    <!-- 顶层：一键套用网络资源预设模板 (极速填充) -->
    <div class="preset-templates-bar">
      <div class="templates-bar-header">
        <div class="templates-title">
          <span class="pulse-dot"></span>
          <span class="bar-bold">🚀 一键套用网络资源预设模板 (极速填充)</span>
          <span class="bar-sub">根据主流资源站模型精选的模板，点击即可自动填入合理的分类、规格、标签与特性：</span>
        </div>
        <button type="button" class="template-reset-btn" @click="resetToDefaults" title="重置为空白默认状态">
          ↺ 清空重置
        </button>
      </div>
      <div class="templates-pills-row">
        <button
          v-for="tpl in quickTemplates"
          :key="tpl.name"
          type="button"
          class="template-pill-card"
          @click="applyTemplate(tpl)"
        >
          <span class="tpl-icon">{{ tpl.icon }}</span>
          <div class="tpl-info">
            <div class="tpl-name">{{ tpl.name }}</div>
            <div class="tpl-desc">{{ tpl.desc }}</div>
          </div>
          <span class="tpl-apply-badge">一键套用</span>
        </button>
      </div>
    </div>

    <!-- 工作区主体双栏布局 (主编辑画布 68% + 侧边配置面板 32%) -->
    <div class="workspace-body">
      <!-- 左侧主画布：标题、富文本长篇说明、功能特性、多图相册 -->
      <div class="canvas-main">
        <!-- 1. 核心标题与简要卡片 -->
        <div class="panel-card">
          <div class="panel-section-title">
            <span class="title-icon">✨</span>
            <span>标题与简介</span>
          </div>
          <div class="form-group" style="margin-bottom:16px;">
            <label class="form-label required">资源主标题</label>
            <input
              type="text"
              class="hero-title-input"
              v-model="form.title"
              placeholder="输入引人注目的资源标题，如：PicGo 全功能图床神器"
            />
          </div>
          <div class="form-row">
            <div class="form-group" style="flex:1;">
              <label class="form-label">副标题 / 官方全称</label>
              <input
                type="text"
                class="form-input"
                v-model="form.fullTitle"
                placeholder="如：PicGo - 一键上传并生成 Markdown 链接的图床客户端"
              />
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">一句话简要摘要 (展示在小程序卡片)</label>
              <input
                type="text"
                class="form-input"
                v-model="form.desc"
                placeholder="简要概括核心亮点，50字以内"
              />
            </div>
          </div>
        </div>

        <!-- 2. 超宽可视化富文本说明编辑器 (所见即所得) -->
        <div class="panel-card">
          <div class="panel-header-flex">
            <div class="panel-section-title">
              <span class="title-icon">📄</span>
              <span>详情页图文富文本说明 (detailHtml)</span>
              <span class="sub-hint">支持段落、H3小标题、彩色高亮、列表与引用</span>
            </div>
            <div class="editor-mode-switch">
              <button
                type="button"
                class="mode-btn"
                :class="{ active: !isRawMode }"
                @click="setRawMode(false)"
              >
                👁️ 所见即所得排版
              </button>
              <button
                type="button"
                class="mode-btn"
                :class="{ active: isRawMode }"
                @click="setRawMode(true)"
              >
                📝 HTML 源码
              </button>
            </div>
          </div>

          <!-- 专业排版工具栏 -->
          <div v-show="!isRawMode" class="wysiwyg-toolbar">
            <div class="tool-group">
              <button type="button" class="bar-btn" title="H3标题" @click="execFormat('h3')">H3</button>
              <button type="button" class="bar-btn bold-btn" title="加粗" @click="execFormat('bold')">B</button>
              <button type="button" class="bar-btn italic-btn" title="斜体" @click="execFormat('italic')">I</button>
              <button type="button" class="bar-btn strike-btn" title="删除线" @click="execFormat('strikeThrough')">S</button>
            </div>
            <div class="tool-sep"></div>
            <div class="tool-group">
              <button type="button" class="bar-btn" title="无序列表" @click="execFormat('insertUnorderedList')">• 列表</button>
              <button type="button" class="bar-btn" title="有序列表" @click="execFormat('insertOrderedList')">1. 序号</button>
            </div>
            <div class="tool-sep"></div>
            <div class="tool-group">
              <button type="button" class="bar-btn" title="引用提示框" @click="insertBlockquote">❝ 提示框</button>
              <button type="button" class="bar-btn" title="特性徽章" @click="insertTagBadge">🏷️ 特性标签</button>
              <button type="button" class="bar-btn" title="代码块" @click="insertCodeBlock">💻 代码块</button>
            </div>
            <div class="tool-sep"></div>
            <div class="tool-group">
              <button type="button" class="bar-btn clear-btn" title="清除格式" @click="execFormat('removeFormat')">🧹 清除格式</button>
            </div>
          </div>

          <!-- 可视化编辑区 -->
          <div
            v-show="!isRawMode"
            ref="editorRef"
            class="wysiwyg-surface"
            contenteditable="true"
            @input="onEditorInput"
          ></div>

          <!-- 源码编辑区 -->
          <textarea
            v-show="isRawMode"
            class="raw-code-surface"
            v-model="form.detailHtml"
            placeholder="可以直接输入或粘贴 HTML 标签代码..."
            @input="onRawInput"
          ></textarea>
        </div>

        <!-- 3. 功能特性清单 (features) -->
        <div class="panel-card">
          <div class="panel-header-flex">
            <div class="panel-section-title">
              <span class="title-icon">🏷️</span>
              <span>功能特性清单 (features)</span>
              <span class="sub-hint">每行一条，将在小程序详情页以独立徽标条目呈现</span>
            </div>
            <span class="card-title-badge">{{ form.features.length }} 条特性</span>
          </div>
          <div class="form-group" style="margin-top:8px;">
            <textarea
              class="form-textarea features-area"
              rows="4"
              v-model="featuresText"
              placeholder="支持主流 OSS/COS/又拍云图床配置&#10;拖拽图片极速上传并自动复制 Markdown 链接&#10;Windows 与 macOS 双端原生免安装绿色支持"
            ></textarea>
          </div>

          <!-- 快速插入常用特性预设 -->
          <div class="feature-presets-box">
            <div class="feature-presets-header">
              <div class="f-header-left">
                <span class="f-header-title">⚡ 快速插入常用特性推荐 (点击即在下方列表增删)：</span>
                <div class="f-cat-tabs">
                  <button
                    v-for="fc in featureCategoryGroups"
                    :key="fc"
                    type="button"
                    class="f-tab-btn"
                    :class="{ active: activeFeatureCat === fc }"
                    @click="activeFeatureCat = fc"
                  >
                    {{ fc }}
                  </button>
                </div>
              </div>
            </div>
            <div class="feature-presets-grid">
              <button
                v-for="(f, i) in currentFeatureList"
                :key="i"
                type="button"
                class="feature-preset-btn"
                :class="{ added: form.features.includes(f.text) }"
                @click="togglePresetFeature(f.text)"
              >
                <span class="f-category-tag">{{ f.category }}</span>
                <span class="f-text">{{ f.text }}</span>
                <span class="f-action-icon">{{ form.features.includes(f.text) ? '✓' : '+' }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 4. 详情截图相册 (images) -->
        <div class="panel-card">
          <div class="panel-header-flex">
            <div class="panel-section-title">
              <span class="title-icon">📸</span>
              <span>详情多截图相册 (images)</span>
              <span class="sub-hint">支持动态增删直链，直连前台详情页横滑轮播</span>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" @click="addImageRow">
              + 添加一张截图
            </button>
          </div>

          <div class="screenshots-grid">
            <div v-if="form.images.length === 0" class="empty-gallery-tip">
              暂未添加截图。若不配置，小程序端将智能隐藏截图区域。
            </div>
            <div
              v-for="(imgUrl, idx) in form.images"
              :key="idx"
              class="screenshot-card"
            >
              <div class="screenshot-thumb-box">
                <img
                  v-if="imgUrl && !failedImages[idx]"
                  :src="imgUrl"
                  class="thumb-img"
                  @error="failedImages[idx] = true"
                />
                <div v-else class="thumb-empty-fallback">
                  <span>截图 {{ idx + 1 }}</span>
                </div>
                <button type="button" class="del-thumb-btn" @click="removeImageRow(idx)" title="删除此图">×</button>
              </div>
              <div class="screenshot-input-wrap">
                <input
                  type="text"
                  class="form-input form-input-sm"
                  v-model="form.images[idx]"
                  placeholder="图片直链 https://..."
                  @input="failedImages[idx] = false"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧侧边栏：前台实时卡片仿真 + 网盘直链 + 资产参数元数据 (32%) -->
      <div class="canvas-side">
        <!-- A. 小程序端实时仿真预览卡片 (所见即所得) -->
        <div class="panel-card preview-card-wrapper">
          <div class="panel-section-title" style="margin-bottom:12px;">
            <span class="title-icon">📱</span>
            <span>小程序前台实时仿真</span>
          </div>
          <div class="mp-preview-phone">
            <div class="mp-mock-header">
              <div class="mp-mock-icon">
                <img v-if="form.icon && !iconFailed" :src="form.icon" @error="iconFailed = true" />
                <div v-else class="res-icon-placeholder">{{ (form.title || '宝').charAt(0) }}</div>
              </div>
              <div class="mp-mock-title-area">
                <div class="mp-mock-title">{{ form.title || '资源标题' }}</div>
                <div class="mp-mock-tags">
                  <span class="mp-badge-tag tag-ver">{{ form.version || '最新版' }}</span>
                  <span class="mp-badge-tag tag-plat">{{ form.platform || '全平台' }}</span>
                  <span v-if="form.badge" class="mp-badge-tag tag-hot">{{ form.badge }}</span>
                </div>
              </div>
            </div>
            <div class="mp-mock-desc">{{ form.desc || '资源简介内容将在此处紧凑展示...' }}</div>
            <div class="mp-mock-footer">
              <div class="mp-mock-score">★ {{ form.rating || '9.9' }}</div>
              <div class="mp-mock-down">{{ form.downloads || 0 }} 次转存</div>
              <div class="mp-mock-btn">立即转存</div>
            </div>
          </div>
        </div>

        <!-- B. 网盘下载与直链配置 -->
        <div class="panel-card">
          <div class="panel-section-title" style="margin-bottom:14px;">
            <span class="title-icon">🔗</span>
            <span>网盘直链与提取码</span>
          </div>
          <div class="form-group" style="margin-bottom:12px;">
            <div class="section-label-flex">
              <label class="form-label required" style="margin-bottom:0;">网盘直链 URL</label>
              <div class="pan-provider-chips">
                <span
                  v-for="p in panProviders"
                  :key="p.name"
                  class="pan-chip"
                  @click="applyPanPrefix(p.prefix)"
                  :title="'快速填入 ' + p.name + ' 链接前缀'"
                >
                  {{ p.name }}
                </span>
              </div>
            </div>
            <input
              type="text"
              class="form-input"
              v-model="form.panUrl"
              placeholder="https://pan.quark.cn/s/... 或选择上方快捷网盘"
              style="margin-top:6px;"
            />
          </div>
          <div class="form-row">
            <div class="form-group" style="flex:1.2;">
              <div class="section-label-flex">
                <label class="form-label" style="margin-bottom:0;">提取码</label>
                <div class="pwd-chips">
                  <span
                    v-for="pwd in pwdPresets"
                    :key="pwd"
                    class="pwd-chip"
                    :class="{ active: form.pwd === pwd }"
                    @click="form.pwd = pwd"
                  >
                    {{ pwd }}
                  </span>
                </div>
              </div>
              <input type="text" class="form-input" v-model="form.pwd" placeholder="留空或点击快捷预设" style="margin-top:6px;" />
            </div>
            <div class="form-group" style="flex:1;">
              <div class="section-label-flex">
                <label class="form-label" style="margin-bottom:0;">初始转存量</label>
                <div class="pwd-chips">
                  <span
                    v-for="d in [88, 188, 520, 999]"
                    :key="d"
                    class="pwd-chip"
                    :class="{ active: form.downloads === d }"
                    @click="form.downloads = d"
                  >
                    {{ d }}
                  </span>
                </div>
              </div>
              <input type="number" class="form-input" v-model.number="form.downloads" placeholder="0" style="margin-top:6px;" />
            </div>
          </div>
        </div>

        <!-- C. 资产分类与元数据 -->
        <div class="panel-card">
          <div class="panel-section-title" style="margin-bottom:14px;">
            <span class="title-icon">⚙️</span>
            <span>分类与基础规格</span>
          </div>

          <div class="form-group" style="margin-bottom:12px;">
            <label class="form-label required">所属大分类</label>
            <select class="form-select" v-model="form.category">
              <option v-for="cat in categories" :key="cat.cat_id || cat.id" :value="cat.cat_id || cat.id">
                {{ cat.name }} ({{ cat.cat_id }})
              </option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom:12px;">
            <label class="form-label">运行平台</label>
            <input type="text" class="form-input" v-model="form.platform" placeholder="全平台 / Windows" style="margin-bottom:6px;" />
            <div class="preset-chips-wrap">
              <span
                v-for="p in platformPresets"
                :key="p"
                class="preset-chip mini-chip"
                :class="{ active: form.platform === p }"
                @click="form.platform = p"
              >
                {{ p }}
              </span>
            </div>
          </div>

          <div class="form-group" style="margin-bottom:12px;">
            <label class="form-label">版本号</label>
            <input type="text" class="form-input" v-model="form.version" placeholder="v1.0" style="margin-bottom:6px;" />
            <div class="preset-chips-wrap">
              <span
                v-for="v in versionPresets"
                :key="v"
                class="preset-chip mini-chip"
                :class="{ active: form.version === v }"
                @click="form.version = v"
              >
                {{ v }}
              </span>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group" style="flex:1.2;">
              <label class="form-label">文件体积</label>
              <input type="text" class="form-input" v-model="form.size" placeholder="如：68 MB" style="margin-bottom:6px;" />
              <div class="preset-chips-wrap">
                <span
                  v-for="s in sizePresets"
                  :key="s"
                  class="preset-chip mini-chip"
                  :class="{ active: form.size === s }"
                  @click="form.size = s"
                >
                  {{ s }}
                </span>
              </div>
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">好评评分</label>
              <input type="number" step="0.1" class="form-input" v-model.number="form.rating" placeholder="9.9" />
            </div>
          </div>

          <div class="form-group" style="margin-bottom:14px;">
            <div class="section-label-flex">
              <label class="form-label" style="margin-bottom:0;">视觉角标文案 (badge)</label>
              <span v-if="form.badge" class="quick-clear-btn" @click="form.badge = ''">清空选择 ({{ form.badge }})</span>
            </div>
            <!-- 角标分类标签切换 -->
            <div class="category-pill-tabs">
              <button
                v-for="grp in badgeCategoryGroups"
                :key="grp.name"
                type="button"
                class="cat-tab-pill"
                :class="{ active: activeBadgeGroup === grp.name }"
                @click="activeBadgeGroup = grp.name"
              >
                {{ grp.name }}
              </button>
            </div>
            <input
              type="text"
              class="form-input"
              v-model="form.badge"
              placeholder="可直接点击下方预设胶囊，或自由手动输入"
              style="margin-bottom:8px;"
            />
            <!-- 角标快捷预设池 -->
            <div class="preset-chips-wrap">
              <span
                v-for="b in currentBadgeList"
                :key="b"
                class="preset-chip"
                :class="{ active: form.badge === b }"
                @click="form.badge = (form.badge === b ? '' : b)"
              >
                {{ b }}
              </span>
            </div>
          </div>

          <div class="form-group" style="margin-bottom:14px;">
            <div class="section-label-flex">
              <label class="form-label" style="margin-bottom:0;">关联前台场景标签 (tags)</label>
              <div class="tags-action-links">
                <span v-if="form.tags && form.tags.length" class="quick-clear-btn" @click="form.tags = []">
                  清空全部 ({{ form.tags.length }})
                </span>
              </div>
            </div>

            <!-- 标签分类切换 -->
            <div class="category-pill-tabs">
              <button
                v-for="tg in tagCategoryGroups"
                :key="tg.name"
                type="button"
                class="cat-tab-pill"
                :class="{ active: activeTagCategory === tg.name }"
                @click="activeTagCategory = tg.name"
              >
                {{ tg.name }}
              </button>
            </div>

            <!-- 已选标签状态栏 -->
            <div v-if="form.tags && form.tags.length" class="selected-tags-container">
              <span class="selected-prompt">已选 {{ form.tags.length }} 个标签:</span>
              <div class="selected-pills-wrap">
                <span
                  v-for="st in form.tags"
                  :key="getTagText(st)"
                  class="selected-active-pill"
                  @click="toggleTag(getTagText(st))"
                  title="点击移除"
                >
                  {{ getTagText(st) }} <span class="pill-remove-icon">×</span>
                </span>
              </div>
            </div>

            <!-- 可选标签云池 -->
            <div class="preset-chips-wrap tag-pool-scroll">
              <span
                v-for="t in currentTagList"
                :key="t.tag_id || t.id || t.name"
                class="preset-chip tag-preset-chip"
                :class="{ active: isTagSelected(t.name) }"
                @click="toggleTag(t.name)"
              >
                {{ isTagSelected(t.name) ? '✓ ' : '+ ' }}{{ t.name }}
              </span>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group" style="flex:1;">
              <div class="section-label-flex">
                <label class="form-label" style="margin-bottom:0;">初始收藏量 (favCount)</label>
                <div class="pwd-chips">
                  <span
                    v-for="fc in [66, 88, 168, 320, 666]"
                    :key="fc"
                    class="pwd-chip"
                    :class="{ active: form.favCount === fc }"
                    @click="form.favCount = fc"
                  >
                    {{ fc }}
                  </span>
                </div>
              </div>
              <input type="number" class="form-input" v-model.number="form.favCount" placeholder="0" style="margin-top:6px;" />
            </div>
          </div>

          <div class="form-group" style="margin-top:4px;">
            <label class="form-label" style="display:flex;justify-content:space-between;align-items:center;">
              <span>唯一标识代码 (系统自动生成)</span>
              <a href="javascript:;" class="quick-link-text" @click="form.res_id = generateAutoId()">重新生成</a>
            </label>
            <div class="auto-id-display">
              <span class="id-prefix-badge">AUTO ID</span>
              <input
                type="text"
                class="form-input form-input-readonly"
                v-model="form.res_id"
                readonly
                title="系统已自动生成唯一标识，无需手动输入"
              />
            </div>
          </div>

          <div class="form-group" style="margin-top:12px;">
            <label class="form-label">展示图标路径</label>
            <div class="icon-input-combo">
              <div class="combo-thumb">
                <img v-if="form.icon && !iconFailed" :src="form.icon" @error="iconFailed = true" />
                <div v-else class="res-icon-placeholder">{{ (form.title || '宝').charAt(0) }}</div>
              </div>
              <input
                type="text"
                class="form-input"
                v-model="form.icon"
                placeholder="/images/cloud.svg"
                @input="iconFailed = false"
                style="flex:1;"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { resourceService, categoryService } from '../api/services.js';
import { toast } from '../utils/toast.js';

const route = useRoute();
const router = useRouter();

const isEdit = computed(() => !!route.params.id);
const isNewTab = computed(() => window.history.length <= 1);
const isSubmitting = ref(false);
const isRawMode = ref(false);
const editorRef = ref(null);

const iconFailed = ref(false);
const failedImages = reactive({});
const categories = ref([]);
const allQuickTags = ref([]);

// 1. 网络资源一键套用预设模板库
const quickTemplates = [
  {
    name: '💻 电脑绿色常用软件',
    desc: 'Windows 桌面端 · 便携免安装 · 纯净无广告 · 永久免激活',
    icon: '💻',
    category: 'pc',
    platform: 'Windows',
    version: '最新便携增强版',
    size: '68 MB',
    badge: '绿色便携',
    rating: 9.9,
    downloads: 168,
    favCount: 88,
    pwd: '免码',
    panUrl: 'https://pan.quark.cn/s/',
    tags: ['装机必备', '纯净无广告', '单文件便携', '永久免激活', '解压即用'],
    features: [
      '解压即用，绿色便携，不写系统注册表',
      '纯净无后台推广，去除所有弹窗与内置广告',
      '永久离线免登录激活，断网亦可长久稳定运行'
    ]
  },
  {
    name: '🍎 macOS 极客工具',
    desc: 'Apple Silicon M系列原生 · Mac专用精简 · 高度适配',
    icon: '🍎',
    category: 'pc',
    platform: 'macOS',
    version: 'v3.2 原生增强版',
    size: '128 MB',
    badge: 'M芯片支持',
    rating: 9.9,
    downloads: 256,
    favCount: 168,
    pwd: '免码',
    panUrl: 'https://pan.quark.cn/s/',
    tags: ['M芯片适配', '效率黑科技', '免解压绿色版'],
    features: [
      '原生完美适配 Apple Silicon (M1/M2/M3/M4) 及 Intel 架构',
      '解锁全功能会员特权，无导出水印与次数限制',
      '纯净无后台推广，去除所有弹窗与内置广告'
    ]
  },
  {
    name: '🎨 精选设计视觉素材',
    desc: '免抠图层 · 商用字库 · 矢量图 · 源工程文件',
    icon: '🎨',
    category: 'design',
    platform: '全平台',
    version: '2026 精选整合包',
    size: '1.5 GB',
    badge: '💎 独家',
    rating: 9.8,
    downloads: 388,
    favCount: 320,
    pwd: '免码',
    panUrl: 'https://pan.baidu.com/s/',
    tags: ['免扣设计素材', '独家精选', '商用免费字库', '高分必收'],
    features: [
      '包含源工程文件、无损免抠图层与字体样式包',
      '支持商用个人双重用途，已整理规范文件夹命名',
      '附赠详细设计使用指南与高清效果预览图'
    ]
  },
  {
    name: '⚡ 编程开发与源码',
    desc: '脚手架模板 · 开源项目 · Docker编排 · 自动化脚本',
    icon: '⚡',
    category: 'dev',
    platform: '全平台',
    version: 'LTS 长期稳定版',
    size: '380 MB',
    badge: '开源神器',
    rating: 9.9,
    downloads: 198,
    favCount: 220,
    pwd: '免码',
    panUrl: 'https://www.123pan.com/s/',
    tags: ['源码脚手架', 'Vue/React源码', '开源神器', '自动化脚本'],
    features: [
      '开箱即用，内置完整依赖与自动化构建脚本',
      '附带保姆级环境搭建文档与本地运行教程',
      '经过多平台集成测试，模块化架构规范清晰'
    ]
  },
  {
    name: '🎬 影音与多媒体',
    desc: '4K超清播放器 · 音视频压制 · 剪辑特效包 · 无损解码',
    icon: '🎬',
    category: 'media',
    platform: 'Win/Mac双端',
    version: '官方原生集成版',
    size: '85 MB',
    badge: '⭐ 高分必收',
    rating: 9.8,
    downloads: 410,
    favCount: 260,
    pwd: '免码',
    panUrl: 'https://pan.quark.cn/s/',
    tags: ['影音无损超清', '全部直链', '极速网盘直链'],
    features: [
      '支持全格式硬解加速与超高码率4K流畅渲染',
      '去除了启动页广告与多余联网检测组件',
      '内置高品质无损音效均衡器及多语言字幕引擎'
    ]
  },
  {
    name: '🎮 游戏补丁与MOD',
    desc: '精选MOD模组 · Steam汉化补丁 · 修改器 · 完美存档',
    icon: '🎮',
    category: 'game',
    platform: 'Windows',
    version: 'v1.0 完美整合版',
    size: '2.8 GB',
    badge: '💥 今日爆款',
    rating: 9.7,
    downloads: 620,
    favCount: 450,
    pwd: '免码',
    panUrl: 'https://pan.quark.cn/s/',
    tags: ['今日最新', 'Steam汉化补丁', '精选MOD模组', '单文件免安装'],
    features: [
      '已整合最新官方升级补丁与精修汉化文本',
      '解压即可畅玩，自带存档管理器与修改辅助工具',
      '通过主流安全卫士无毒验证，绿色安全运行'
    ]
  },
  {
    name: '📱 移动端/安卓神器',
    desc: '免登录破解VIP · 去广告轻量化 · 终身可用',
    icon: '📱',
    category: 'pc',
    platform: 'Android',
    version: 'v8.8.0 纯净版',
    size: '45 MB',
    badge: '免激活',
    rating: 9.9,
    downloads: 820,
    favCount: 520,
    pwd: '免码',
    panUrl: 'https://www.123pan.com/s/',
    tags: ['免登录破解', '纯净无广告', 'VIP特权版', '终身授权'],
    features: [
      '免登录解锁永久VIP会员特权，去除全部内嵌广告',
      '无视版本强制升级提示，本地离线长久有效',
      '极简轻量安装包，运行流畅功耗极低'
    ]
  },
  {
    name: '📚 学习备考核心库',
    desc: '高清彩印PDF · 考点手写笔记 · 历年真题精解',
    icon: '📚',
    category: 'study',
    platform: '全平台',
    version: '2026 最新超清版',
    size: '520 MB',
    badge: '👑 极客推荐',
    rating: 9.9,
    downloads: 960,
    favCount: 880,
    pwd: '免码',
    panUrl: 'https://pan.baidu.com/s/',
    tags: ['高分必收', '独家精选', '离线整合包', '全部直链'],
    features: [
      '矢量无损超清排版，适配大屏平板与Kindle阅读',
      '包含考点知识导图、历年真题精析与重点高亮标注',
      '附赠专属配套音频微课与电子错题本工程文件'
    ]
  }
];

// 2. 常用网盘服务商前缀
const panProviders = [
  { name: '夸克网盘', prefix: 'https://pan.quark.cn/s/' },
  { name: '百度网盘', prefix: 'https://pan.baidu.com/s/' },
  { name: '阿里云盘', prefix: 'https://www.alipan.com/s/' },
  { name: '123云盘', prefix: 'https://www.123pan.com/s/' },
  { name: '蓝奏云', prefix: 'https://lanzoui.com/' },
  { name: '迅雷云盘', prefix: 'https://pan.xunlei.com/s/' }
];

// 提取码预设
const pwdPresets = ['免码', '1234', '8888', '6666', 'feng'];

// 3. 视觉角标分类群组 (38个常见网络资源角标)
const activeBadgeGroup = ref('全部角标');
const badgeCategoryGroups = [
  {
    name: '全部角标',
    items: [
      '🔥 热门', '💥 今日爆款', '⚡ 首发', '👑 极客推荐', '⭐ 高分必收', '💎 独家', '🏆 年度最佳', '🚀 极速下载', '💯 满分好评', '🎁 稀缺绝版',
      '免激活', '永久免费', 'SVIP专属', '官方原版', '无限制版', 'VIP特权版', '终身授权', '全功能解锁', '商业授权', '破解特权', '免登录',
      '绿色便携', '纯净无广告', '单文件版', '解压即用', '无毒安全', '免安装版', '离线整合', '轻量极速',
      'Win11适配', 'M芯片支持', '中文汉化', '双端通用', '全平台', '开源神器', '64位高性能', '多端同步'
    ]
  },
  {
    name: '🔥 热门推荐',
    items: ['🔥 热门', '💥 今日爆款', '⚡ 首发', '👑 极客推荐', '⭐ 高分必收', '💎 独家', '🏆 年度最佳', '🚀 极速下载', '💯 满分好评', '🎁 稀缺绝版']
  },
  {
    name: '🔑 特权授权',
    items: ['免激活', '永久免费', 'SVIP专属', '官方原版', '无限制版', 'VIP特权版', '终身授权', '全功能解锁', '商业授权', '破解特权', '免登录']
  },
  {
    name: '🍃 便携纯净',
    items: ['绿色便携', '纯净无广告', '单文件版', '解压即用', '无毒安全', '免安装版', '离线整合', '轻量极速']
  },
  {
    name: '💻 平台技术',
    items: ['Win11适配', 'M芯片支持', '中文汉化', '双端通用', '全平台', '开源神器', '64位高性能', '多端同步']
  }
];

const currentBadgeList = computed(() => {
  const g = badgeCategoryGroups.find(grp => grp.name === activeBadgeGroup.value);
  return g ? g.items : badgeCategoryGroups[0].items;
});

// 4. 前台场景标签多维度分类群组
const activeTagCategory = ref('全部标签');
const tagCategoryGroups = [
  { name: '全部标签', filter: () => true },
  { name: '🌟 高频精选', filter: (t) => ['装机必备', '纯净无广告', '单文件便携', '永久免激活', '效率黑科技', 'AI提效神器', '独家精选', '今日最新', '高分必收', '全部直链'].includes(t) },
  { name: '🖥️ 系统工具', filter: (t) => ['解压即用', '单文件免安装', '免解压绿色版', 'Win11完美适配', 'M芯片适配', '双端通用', '单文件便携', '纯净无广告', '装机必备', '自动化脚本', 'PDF全能工具', 'Office增强神器'].includes(t) },
  { name: '🔑 特权属性', filter: (t) => ['免登录破解', 'VIP特权版', '官方原版', '终身授权', '全功能解锁', '永久免激活', '全部直链', '极速网盘直链', '稀缺绝版', '独家精选'].includes(t) },
  { name: '🎨 设计素材', filter: (t) => ['免扣设计素材', '商用免费字库', 'UI组件素材', '4K超清壁纸', '无水印导出', '附安装教程'].includes(t) },
  { name: '💻 编程技术', filter: (t) => ['开源神器', '源码脚手架', 'Vue/React源码', '自动化脚本', 'AI提效神器', '效率黑科技'].includes(t) },
  { name: '🎮 影音游戏', filter: (t) => ['影音无损超清', 'Steam汉化补丁', '精选MOD模组', '离线整合包', '今日最新', '高分必收'].includes(t) }
];

const currentTagList = computed(() => {
  const grp = tagCategoryGroups.find(g => g.name === activeTagCategory.value);
  if (!grp || activeTagCategory.value === '全部标签') {
    return allQuickTags.value;
  }
  return allQuickTags.value.filter(t => grp.filter(t.name));
});

const getTagText = (t) => {
  if (typeof t === 'string') return t;
  return t ? t.text || '' : '';
};

const isTagSelected = (tagName) => {
  if (!form.tags) return false;
  return form.tags.some(t => (typeof t === 'string' ? t === tagName : t.text === tagName));
};

const toggleTag = (tagName) => {
  if (!form.tags) form.tags = [];
  const idx = form.tags.findIndex(t => (typeof t === 'string' ? t === tagName : t.text === tagName));
  if (idx !== -1) {
    form.tags.splice(idx, 1);
  } else {
    form.tags.push({ text: tagName, type: 'blue' });
  }
};

// 5. 常用特性分类推荐库 (15条精选高质特性)
const activeFeatureCat = ref('全部特性');
const featureCategoryGroups = ['全部特性', '便携免装', '纯净安全', '会员特权', '系统架构', '网盘教程'];

const featureLibrary = [
  { text: '解压即用，绿色便携，不写系统注册表', category: '便携免装' },
  { text: '单文件独立运行，无需安装，随身U盘即插即用', category: '便携免装' },
  { text: '纯净无后台推广，去除所有弹窗、流氓捆绑与内置广告', category: '纯净安全' },
  { text: '官方原版数字签名，通过全网杀毒安全检测与木马扫描', category: '纯净安全' },
  { text: '禁止自动检查更新与后台回传，全面保护个人隐私', category: '纯净安全' },
  { text: '解锁全功能会员高级特权，无导出水印、大小与次数限制', category: '会员特权' },
  { text: '永久离线免登录激活，无需账号断网亦可长久稳定运行', category: '会员特权' },
  { text: '解除速率限制与文件并发数限制，尽享满速极速体验', category: '会员特权' },
  { text: '原生完美适配 Apple Silicon (M1/M2/M3/M4) 及 Intel 架构', category: '系统架构' },
  { text: '深度兼容 Windows 11 / Windows 10 64位主流操作系统', category: '系统架构' },
  { text: '内置完整简体中文汉化语言包及超清视网膜高分辨率UI', category: '系统架构' },
  { text: '独家多网盘不限速直链，支持断点续传高速下载与一键转存', category: '网盘教程' },
  { text: '附赠保姆级图文安装激活指引及常见排坑 FAQ 文档', category: '网盘教程' },
  { text: '包含源工程文件、无损免抠图层与可商用字体样式包', category: '便携免装' },
  { text: '内附实战工程源码示例与配套高清视频演示讲解', category: '网盘教程' }
];

const currentFeatureList = computed(() => {
  if (activeFeatureCat.value === '全部特性') {
    return featureLibrary;
  }
  return featureLibrary.filter(f => f.category === activeFeatureCat.value);
});

const togglePresetFeature = (text) => {
  if (!form.features) form.features = [];
  const idx = form.features.indexOf(text);
  if (idx !== -1) {
    form.features.splice(idx, 1);
  } else {
    form.features.push(text);
  }
};

// 6. 基础规格预设
const platformPresets = ['全平台', 'Windows', 'macOS', 'Win/Mac双端', 'Android', 'iOS', 'Linux', 'Web在线版'];
const versionPresets = ['最新增强版', '官方原版', 'v2.4.0 稳定版', '2026 最新旗舰版', 'LTS 长期支持版', 'v1.0 完美整合版', 'v8.8 纯净版'];
const sizePresets = ['< 10 MB', '35 MB', '68 MB', '128 MB', '380 MB', '850 MB', '1.2 GB', '2.8 GB', '4.5 GB'];

// 7. 一键套用模板与重置功能
const applyTemplate = (tpl) => {
  form.category = tpl.category || form.category;
  form.platform = tpl.platform || form.platform;
  form.version = tpl.version || form.version;
  form.size = tpl.size || form.size;
  form.badge = tpl.badge || form.badge;
  form.rating = tpl.rating || 9.9;
  form.downloads = tpl.downloads || 0;
  form.favCount = tpl.favCount || 0;
  form.pwd = tpl.pwd || form.pwd;
  if (tpl.panUrl && (!form.panUrl || form.panUrl.length < 10)) {
    form.panUrl = tpl.panUrl;
  }
  if (Array.isArray(tpl.features)) {
    form.features = [...tpl.features];
  }
  if (Array.isArray(tpl.tags)) {
    form.tags = tpl.tags.map(t => ({ text: t, type: 'blue' }));
  }
  toast.success('已快速应用【' + tpl.name + '】预设参数！');
};

const resetToDefaults = () => {
  if (!confirm('确定要清空并重置为默认空白状态吗？')) return;
  form.title = '';
  form.fullTitle = '';
  form.desc = '';
  form.badge = '';
  form.platform = '全平台';
  form.version = 'v1.0.0';
  form.size = '';
  form.rating = 9.9;
  form.downloads = 0;
  form.favCount = 0;
  form.pwd = '免码';
  form.features = [];
  form.tags = [];
  toast.info('已重置为默认配置');
};

const applyPanPrefix = (prefix) => {
  if (!form.panUrl || panProviders.some(p => form.panUrl.startsWith(p.prefix))) {
    form.panUrl = prefix;
  } else {
    form.panUrl = prefix;
  }
};

const form = reactive({
  id: '',
  res_id: 'res_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
  title: '',
  fullTitle: '',
  version: 'v1.0.0',
  category: 'pc',
  platform: '全平台',
  size: '',
  rating: 9.9,
  panUrl: '',
  pwd: '',
  icon: '/images/cloud.svg',
  badge: '',
  desc: '',
  detailHtml: '<h3>核心功能说明</h3><p>在此输入软件或资源的详细图文说明、版本特色与操作指引...</p>',
  features: [],
  tags: [],
  images: [],
  downloads: 0,
  favCount: 0
});

const featuresText = computed({
  get() {
    return form.features.join('\n');
  },
  set(val) {
    form.features = val.split('\n').map(s => s.trim()).filter(Boolean);
  }
});

const generateAutoId = () => {
  return 'res_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
};

const handleBackOrClose = () => {
  if (isNewTab.value) {
    window.close();
  } else {
    router.push('/resources');
  }
};

const setRawMode = (raw) => {
  isRawMode.value = raw;
  if (!raw) {
    nextTick(() => {
      if (editorRef.value) {
        editorRef.value.innerHTML = form.detailHtml;
      }
    });
  }
};

const onEditorInput = () => {
  if (editorRef.value) {
    form.detailHtml = editorRef.value.innerHTML;
  }
};

const onRawInput = (e) => {
  form.detailHtml = e.target.value;
};

const execFormat = (cmd, val = null) => {
  if (editorRef.value) {
    editorRef.value.focus();
    if (cmd === 'h3') {
      document.execCommand('formatBlock', false, '<h3>');
    } else {
      document.execCommand(cmd, false, val);
    }
    onEditorInput();
  }
};

const insertBlockquote = () => {
  if (editorRef.value) {
    editorRef.value.focus();
    document.execCommand('insertHTML', false, '<blockquote style="border-left:4px solid #3b82f6;padding:10px 16px;background:rgba(59,130,246,0.08);margin:12px 0;color:#93c5fd;border-radius:6px;">💡 <b>提示：</b>在此输入使用注意事项与核心操作技巧...</blockquote><p></p>');
    onEditorInput();
  }
};

const insertTagBadge = () => {
  if (editorRef.value) {
    editorRef.value.focus();
    document.execCommand('insertHTML', false, '<span style="display:inline-block;padding:2px 8px;font-size:12px;font-weight:700;background:rgba(16,185,129,0.15);color:#10b981;border:1px solid rgba(16,185,129,0.3);border-radius:4px;margin-right:6px;">极速生效</span> ');
    onEditorInput();
  }
};

const insertCodeBlock = () => {
  if (editorRef.value) {
    editorRef.value.focus();
    document.execCommand('insertHTML', false, '<pre style="background:#0f172a;border:1px solid #334155;border-radius:8px;padding:12px 16px;color:#38bdf8;font-family:monospace;margin:12px 0;"><code># 在此粘贴命令行或配置参数</code></pre><p></p>');
    onEditorInput();
  }
};

const addImageRow = () => {
  form.images.push('');
};

const removeImageRow = (idx) => {
  form.images.splice(idx, 1);
};

const handleSubmit = async () => {
  if (!form.res_id || !form.res_id.trim()) {
    form.res_id = generateAutoId();
  }
  if (!form.title.trim()) {
    alert('请填写资源主标题');
    return;
  }
  if (!form.panUrl.trim()) {
    alert('请填写网盘直链 URL');
    return;
  }

  isSubmitting.value = true;
  try {
    const validImages = form.images.map(s => s.trim()).filter(Boolean);

    const payload = {
      res_id: form.res_id.trim(),
      title: form.title.trim(),
      fullTitle: form.fullTitle.trim() || form.title.trim(),
      version: form.version.trim(),
      category: form.category,
      platform: form.platform.trim(),
      size: form.size.trim(),
      rating: parseFloat(form.rating) || 9.9,
      panUrl: form.panUrl.trim(),
      pwd: form.pwd.trim(),
      icon: form.icon.trim() || '/images/cloud.svg',
      badge: form.badge.trim(),
      desc: form.desc.trim(),
      detailHtml: form.detailHtml,
      features: form.features,
      tags: form.tags && form.tags.length > 0 ? form.tags : null,
      images: validImages.length > 0 ? validImages : null,
      downloads: parseInt(form.downloads, 10) || 0,
      favCount: parseInt(form.favCount, 10) || 0
    };

    if (isEdit.value) {
      await resourceService.update(form.id, payload);
      toast.success('资产配置已成功更新至云端！');
    } else {
      await resourceService.create(payload);
      toast.success('新数字资产发布成功！');
    }

    setTimeout(() => {
      handleBackOrClose();
    }, 600);
  } catch (err) {
    console.error(err);
    alert('保存失败: ' + err.message);
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(async () => {
  try {
    const [cats, tags] = await Promise.all([
      categoryService.getCategories(),
      categoryService.getQuickTags()
    ]);
    categories.value = cats;
    allQuickTags.value = tags;
  } catch (e) {
    console.error('加载分类与标签异常:', e);
  }

  if (isEdit.value) {
    try {
      const record = await resourceService.getById(route.params.id);
      form.id = record.id;
      form.res_id = record.res_id || record.id;
      form.title = record.title || '';
      form.fullTitle = record.fullTitle || '';
      form.version = record.version || '';
      form.category = record.category || 'pc';
      form.platform = record.platform || '全平台';
      form.size = record.size || '';
      form.rating = record.rating || 9.9;
      form.panUrl = record.panUrl || '';
      form.pwd = record.pwd || '';
      form.icon = record.icon || '/images/cloud.svg';
      form.badge = record.badge || '';
      form.desc = record.desc || '';
      form.detailHtml = record.detailHtml || ('<h3>功能说明</h3><p>' + (record.desc || '') + '</p>');
      form.downloads = record.downloads || 0;
      form.favCount = record.favCount || 0;

      if (Array.isArray(record.features)) {
        form.features = [...record.features];
      }
      if (Array.isArray(record.tags)) {
        form.tags = [...record.tags];
      }
      if (Array.isArray(record.images)) {
        form.images = [...record.images];
      }

      nextTick(() => {
        if (editorRef.value) {
          editorRef.value.innerHTML = form.detailHtml;
        }
      });
    } catch (e) {
      alert('加载资源详情失败: ' + e.message);
      handleBackOrClose();
    }
  } else {
    nextTick(() => {
      if (editorRef.value) {
        editorRef.value.innerHTML = form.detailHtml;
      }
    });
  }
});
</script>

<style scoped>
.edit-workspace-root {
  width: 100%;
  padding-bottom: 80px;
}

/* 顶部操作条 */
.workspace-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(22, 30, 46, 0.85);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 14px 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  position: sticky;
  top: 16px;
  z-index: 80;
}

.topbar-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-pill-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #cbd5e1;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.back-pill-btn:hover {
  background: rgba(59, 130, 246, 0.2);
  border-color: #3b82f6;
  color: #ffffff;
}

.meta-divider {
  color: #475569;
}

.meta-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.meta-status-tag {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
}

.tag-new {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.tag-edit {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.workspace-main-title {
  font-size: 16px;
  font-weight: 800;
  color: #f8fafc;
  margin: 0;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-publish {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
  font-weight: 700;
}

.btn-publish:hover {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

/* 主画布双栏 */
.workspace-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 390px;
  gap: 24px;
}

@media (max-width: 1280px) {
  .workspace-body {
    grid-template-columns: 1fr;
  }
}

.canvas-main,
.canvas-side {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 面板卡片统一样式 */
.panel-card {
  background: rgba(22, 30, 46, 0.7);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 22px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.panel-section-title {
  font-size: 15px;
  font-weight: 800;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.title-icon {
  font-size: 16px;
}

.sub-hint {
  font-size: 12px;
  font-weight: normal;
  color: #64748b;
  margin-left: 6px;
}

.panel-header-flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.panel-header-flex .panel-section-title {
  margin-bottom: 0;
}

/* 巨幅主标题输入 */
.hero-title-input {
  width: 100%;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  color: #ffffff;
  font-size: 18px;
  font-weight: 800;
  padding: 14px 18px;
  outline: none;
  transition: all 0.2s;
}

.hero-title-input:focus {
  border-color: #3b82f6;
  background: rgba(15, 23, 42, 0.9);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

/* 模式切换器 */
.editor-mode-switch {
  display: flex;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 3px;
  gap: 4px;
}

.mode-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-btn.active {
  background: #3b82f6;
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
}

/* 富文本工具栏 */
.wysiwyg-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: none;
  border-radius: 10px 10px 0 0;
  padding: 10px 14px;
}

.tool-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tool-sep {
  width: 1px;
  height: 20px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 6px;
}

.bar-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #cbd5e1;
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.bar-btn:hover {
  background: #3b82f6;
  color: #ffffff;
  border-color: #60a5fa;
}

.bold-btn { font-weight: 900; }
.italic-btn { font-style: italic; }
.strike-btn { text-decoration: line-through; }
.clear-btn { color: #f87171; }
.clear-btn:hover { background: #ef4444; color: #ffffff; }

/* 编辑画布表面 */
.wysiwyg-surface {
  min-height: 420px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0 0 10px 10px;
  padding: 22px;
  color: #f1f5f9;
  font-size: 15px;
  line-height: 1.85;
  outline: none;
}

.wysiwyg-surface:focus {
  border-color: #3b82f6;
}

.raw-code-surface {
  width: 100%;
  min-height: 420px;
  background: #0b1120;
  border: 1px solid #1e293b;
  border-radius: 10px;
  padding: 20px;
  color: #38bdf8;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  resize: vertical;
}

/* 截图网格 */
.screenshots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
  margin-top: 10px;
}

.empty-gallery-tip {
  grid-column: 1 / -1;
  padding: 30px;
  text-align: center;
  color: #64748b;
  font-size: 13px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 10px;
  border: 1px dashed rgba(255, 255, 255, 0.1);
}

.screenshot-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  overflow: hidden;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: all 0.2s;
}

.screenshot-card:hover {
  border-color: rgba(59, 130, 246, 0.4);
}

.screenshot-thumb-box {
  position: relative;
  width: 100%;
  height: 110px;
  background: #0f172a;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-empty-fallback {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.del-thumb-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 24px;
  height: 24px;
  background: rgba(239, 68, 68, 0.85);
  color: #ffffff;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.del-thumb-btn:hover {
  background: #ef4444;
  transform: scale(1.1);
}

.form-input-sm {
  font-size: 12px;
  padding: 6px 10px;
}

/* 仿真前台预览卡片 */
.mp-preview-phone {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95));
  border: 1px solid rgba(59, 130, 246, 0.35);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
}

.mp-mock-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.mp-mock-icon {
  width: 46px;
  height: 46px;
  border-radius: 10px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mp-mock-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.mp-mock-title {
  font-size: 15px;
  font-weight: 800;
  color: #ffffff;
  margin-bottom: 4px;
  line-height: 1.3;
}

.mp-mock-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.mp-badge-tag {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}

.tag-ver { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
.tag-plat { background: rgba(255, 255, 255, 0.1); color: #cbd5e1; }
.tag-hot { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }

.mp-mock-desc {
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.6;
  margin-bottom: 14px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.mp-mock-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 12px;
}

.mp-mock-score {
  color: #f59e0b;
  font-weight: 800;
  font-size: 14px;
}

.mp-mock-down {
  font-size: 11px;
  color: #64748b;
}

.mp-mock-btn {
  font-size: 12px;
  font-weight: 700;
  padding: 5px 14px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #ffffff;
  border-radius: 6px;
}

/* 图标组合输入 */
.icon-input-combo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.combo-thumb {
  width: 42px;
  height: 42px;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.combo-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.quick-link-text {
  font-size: 11px;
  color: #3b82f6;
  margin-left: 8px;
  text-decoration: none;
}

.quick-link-text:hover {
  text-decoration: underline;
}

.required::after {
  content: ' *';
  color: #ef4444;
}

.auto-id-display {
  display: flex;
  align-items: center;
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  overflow: hidden;
}

.id-prefix-badge {
  font-size: 10px;
  font-weight: 800;
  padding: 6px 10px;
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  user-select: none;
}

.form-input-readonly {
  border: none !important;
  background: transparent !important;
  color: #94a3b8 !important;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  padding: 8px 12px;
  cursor: default;
}


/* 预设标签/角标胶囊池 */
.preset-chips-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.preset-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  color: #94a3b8;
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  user-select: none;
  transition: all 0.2s;
}

.preset-chip:hover {
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.3);
  color: #60a5fa;
  transform: translateY(-1px);
}

.preset-chip.active {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.25), rgba(59, 130, 246, 0.35));
  border-color: #3b82f6;
  color: #ffffff;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
}

.mini-chip {
  padding: 2px 8px;
  font-size: 10px;
}

.tag-preset-chip {
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.2);
  color: #a7f3d0;
}

.tag-preset-chip:hover {
  background: rgba(16, 185, 129, 0.2);
  border-color: #10b981;
  color: #34d399;
}

.tag-preset-chip.active {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.4));
  border-color: #10b981;
  color: #ffffff;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
}

.quick-clear-btn {
  font-size: 11px;
  color: #ef4444;
  cursor: pointer;
}

.quick-clear-btn:hover {
  text-decoration: underline;
}

/* 特性预设网格 */
.feature-presets-box {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.feature-presets-header {
  font-size: 12px;
  font-weight: 700;
  color: #cbd5e1;
  margin-bottom: 10px;
}

.feature-presets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 8px;
}

.feature-preset-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 8px 12px;
  color: #cbd5e1;
  font-size: 12px;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
}

.feature-preset-btn:hover {
  background: rgba(30, 41, 59, 0.9);
  border-color: rgba(59, 130, 246, 0.3);
  color: #ffffff;
}

.feature-preset-btn.added {
  background: rgba(16, 185, 129, 0.12);
  border-color: rgba(16, 185, 129, 0.35);
  color: #34d399;
}

.f-category-tag {
  font-size: 10px;
  font-weight: 800;
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  padding: 1px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}

.feature-preset-btn.added .f-category-tag {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.f-text {
  flex: 1;
  line-height: 1.4;
}

.f-action-icon {
  font-weight: 800;
  font-size: 14px;
  color: #64748b;
  flex-shrink: 0;
}

.feature-preset-btn.added .f-action-icon {
  color: #10b981;
}


/* 顶层一键预设模板工具栏 */
.preset-templates-bar {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.85));
  border: 1px solid rgba(59, 130, 246, 0.25);
  border-radius: 12px;
  padding: 14px 18px;
  margin-bottom: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
}

.templates-bar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.templates-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #3b82f6;
  box-shadow: 0 0 8px #3b82f6;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(59, 130, 246, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
}

.bar-bold {
  font-weight: 700;
  font-size: 13px;
  color: #f8fafc;
}

.bar-sub {
  font-size: 12px;
  color: #94a3b8;
}

.template-reset-btn {
  font-size: 11px;
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 3px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.template-reset-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

.templates-pills-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 10px;
}

.template-pill-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
}

.template-pill-card:hover {
  background: rgba(30, 41, 59, 0.9);
  border-color: #3b82f6;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.tpl-icon {
  font-size: 18px;
}

.tpl-info {
  flex: 1;
  min-width: 0;
}

.tpl-name {
  font-size: 12px;
  font-weight: 700;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tpl-desc {
  font-size: 10px;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tpl-apply-badge {
  font-size: 10px;
  font-weight: 700;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.12);
  padding: 2px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}

/* 标签与角标分类切换药丸按钮 */
.section-label-flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  flex-wrap: wrap;
  gap: 6px;
}

.category-pill-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
  background: rgba(15, 23, 42, 0.5);
  padding: 3px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.cat-tab-pill {
  border: none;
  background: transparent;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.2s;
}

.cat-tab-pill:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.08);
}

.cat-tab-pill.active {
  background: #3b82f6;
  color: #ffffff;
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
}

/* 已选标签栏 */
.selected-tags-container {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: rgba(16, 185, 129, 0.08);
  border: 1px dashed rgba(16, 185, 129, 0.3);
  border-radius: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.selected-prompt {
  font-size: 11px;
  font-weight: 700;
  color: #34d399;
  flex-shrink: 0;
}

.selected-pills-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.selected-active-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #ffffff;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.4), rgba(5, 150, 105, 0.5));
  border: 1px solid #10b981;
  padding: 2px 8px;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.2s;
}

.selected-active-pill:hover {
  background: rgba(239, 68, 68, 0.3);
  border-color: #ef4444;
}

.pill-remove-icon {
  font-size: 12px;
  font-weight: 800;
}

.tag-pool-scroll {
  max-height: 180px;
  overflow-y: auto;
  padding-right: 4px;
}

.tag-pool-scroll::-webkit-scrollbar {
  width: 4px;
}
.tag-pool-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
}

/* 网盘提供商与提取码胶囊 */
.pan-provider-chips, .pwd-chips {
  display: flex;
  gap: 4px;
}

.pan-chip, .pwd-chip {
  font-size: 10px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #94a3b8;
  padding: 2px 6px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.pan-chip:hover {
  background: rgba(59, 130, 246, 0.2);
  border-color: #3b82f6;
  color: #60a5fa;
}

.pwd-chip:hover, .pwd-chip.active {
  background: rgba(16, 185, 129, 0.2);
  border-color: #10b981;
  color: #34d399;
}

/* 特性分类导航标签 */
.f-header-left {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  flex-wrap: wrap;
  gap: 8px;
}

.f-cat-tabs {
  display: flex;
  gap: 4px;
}

.f-tab-btn {
  border: none;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #94a3b8;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.f-tab-btn:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.1);
}

.f-tab-btn.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #ffffff;
}

</style>
