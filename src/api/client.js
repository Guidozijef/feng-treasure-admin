import PocketBase from 'pocketbase';

export const PB_URL = 'http://47.109.109.134:8091';
export const pb = new PocketBase(PB_URL);

// 从本地缓存恢复认证
const savedAuth = localStorage.getItem('pb_admin_auth');
if (savedAuth) {
  try {
    const { token, model } = JSON.parse(savedAuth);
    if (token) {
      pb.authStore.save(token, model);
    }
  } catch (e) {
    localStorage.removeItem('pb_admin_auth');
  }
}

export const auth = {
  async login(email = '913497146@qq.com', password = '913497146zjf') {
    try {
      // 兼容 PocketBase v0.22 版本的管理员身份校验接口
      const res = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity: email, password })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || '登录失败，请检查账号密码');
      }

      const data = await res.json();
      pb.authStore.save(data.token, data.admin);

      localStorage.setItem('pb_admin_auth', JSON.stringify({
        token: data.token,
        model: data.admin
      }));

      return { success: true, user: data.admin };
    } catch (err) {
      console.error('Admin login error:', err);
      return { success: false, error: err.message };
    }
  },

  logout() {
    pb.authStore.clear();
    localStorage.removeItem('pb_admin_auth');
    window.location.reload();
  },

  isAuthenticated() {
    return pb.authStore.isValid;
  },

  getAdmin() {
    return pb.authStore.model || { email: 'Admin' };
  }
};
