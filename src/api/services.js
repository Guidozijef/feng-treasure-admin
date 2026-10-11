import { pb } from './client.js';

export const statsService = {
  async getDashboardStats() {
    try {
      const [resCount, usersCount, vipCount, ordersCount, reportsCount] = await Promise.all([
        pb.collection('resources').getList(1, 1).then(r => r.totalItems).catch(() => 0),
        pb.collection('user_profiles').getList(1, 1).then(r => r.totalItems).catch(() => 0),
        pb.collection('user_profiles').getList(1, 1, { filter: 'isSvip = true' }).then(r => r.totalItems).catch(() => 0),
        pb.collection('vip_orders').getList(1, 1).then(r => r.totalItems).catch(() => 0),
        pb.collection('resource_reports').getList(1, 1, { filter: 'status = "pending"' }).then(r => r.totalItems).catch(() => 0),
      ]);
      return {
        totalResources: resCount,
        totalUsers: usersCount,
        vipUsers: vipCount,
        totalOrders: ordersCount,
        pendingReports: reportsCount
      };
    } catch (e) {
      console.error('getDashboardStats error:', e);
      return { totalResources: 0, totalUsers: 0, vipUsers: 0, totalOrders: 0, pendingReports: 0 };
    }
  }
};

export const resourceService = {
  async list({ page = 1, perPage = 20, sort = '-downloads', filter = '' } = {}) {
    return await pb.collection('resources').getList(page, perPage, { sort, filter });
  },
  async getById(id) {
    return await pb.collection('resources').getOne(id);
  },
  async create(data) {
    return await pb.collection('resources').create(data);
  },
  async update(id, data) {
    return await pb.collection('resources').update(id, data);
  },
  async delete(id) {
    return await pb.collection('resources').delete(id);
  }
};

export const userService = {
  async getUsers({ page = 1, perPage = 20, keyword = '' } = {}) {
    let filter = '';
    if (keyword) {
      filter = `uid ~ "${keyword}" || nickName ~ "${keyword}"`;
    }
    return await pb.collection('user_profiles').getList(page, perPage, {
      sort: '-created',
      filter
    });
  },
  async update(id, data) {
    return await pb.collection('user_profiles').update(id, data);
  }
};

export const vipService = {
  async getPlans() {
    return await pb.collection('vip_plans').getFullList({ sort: 'sort' });
  },
  async createPlan(data) {
    return await pb.collection('vip_plans').create(data);
  },
  async updatePlan(id, data) {
    return await pb.collection('vip_plans').update(id, data);
  },
  async deletePlan(id) {
    return await pb.collection('vip_plans').delete(id);
  },
  async getOrders({ page = 1, perPage = 20 } = {}) {
    return await pb.collection('vip_orders').getList(page, perPage, {
      sort: '-created'
    });
  }
};

export const categoryService = {
  // 大分类 CRUD
  async getCategories() {
    return await pb.collection('categories').getFullList({ sort: 'sort' });
  },
  async createCategory(data) {
    return await pb.collection('categories').create(data);
  },
  async updateCategory(id, data) {
    return await pb.collection('categories').update(id, data);
  },
  async deleteCategory(id) {
    return await pb.collection('categories').delete(id);
  },
  async updateCategoryScenes(id, scenes) {
    return await pb.collection('categories').update(id, { scenes });
  },

  // 快捷场景标签 CRUD
  async getQuickTags() {
    return await pb.collection('quick_tags').getFullList();
  },
  async createTag(data) {
    return await pb.collection('quick_tags').create(data);
  },
  async updateTag(id, data) {
    return await pb.collection('quick_tags').update(id, data);
  },
  async deleteTag(id) {
    return await pb.collection('quick_tags').delete(id);
  },
  async toggleTagActive(id, currentActive) {
    return await pb.collection('quick_tags').update(id, { active: !currentActive });
  }
};

export const reportService = {
  async getReports({ page = 1, perPage = 50, filter = '' } = {}) {
    return await pb.collection('resource_reports').getList(page, perPage, {
      sort: '-created',
      filter
    });
  },
  async updateReportStatus(id, status, status_text) {
    return await pb.collection('resource_reports').update(id, { status, status_text });
  },
  async deleteReport(id) {
    return await pb.collection('resource_reports').delete(id);
  },

  async getRequests({ page = 1, perPage = 50, filter = '' } = {}) {
    return await pb.collection('resource_requests').getList(page, perPage, {
      sort: '-created',
      filter
    });
  },
  async updateRequestStatus(id, status, status_text) {
    return await pb.collection('resource_requests').update(id, { status, status_text });
  },
  async deleteRequest(id) {
    return await pb.collection('resource_requests').delete(id);
  }
};
