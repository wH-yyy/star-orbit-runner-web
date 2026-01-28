/**
 * 管理员相关API
 */
import { post } from './request';

/**
 * 登录API
 * @param {object} credentials - 登录凭证
 * @param {string} credentials.username - 用户名
 * @param {string} credentials.password - 密码
 * @returns {Promise} - 登录结果
 */
export const login = async (credentials) => {
  try {
    // 这里可以添加模拟登录逻辑，因为实际API可能不可用
    // 模拟登录成功
    return {
      success: true,
      token: 'demo-token-' + Date.now(),
      user: {
        id: 1,
        username: credentials.username,
        name: credentials.username,
        role: 'admin',
        avatar: '👤'
      }
    };
    
    // 实际API调用
    // return await post('/login', credentials);
  } catch (error) {
    console.error('登录失败:', error);
    return {
      success: false,
      error: error.message || '登录失败'
    };
  }
};

/**
 * 获取用户列表
 * @returns {Promise} - 用户列表
 */
export const getUserList = async () => {
  try {
    // 模拟数据
    return {
      success: true,
      data: [
        {
          id: 1,
          username: 'user1',
          name: '用户1',
          email: 'user1@example.com',
          status: 'active'
        },
        {
          id: 2,
          username: 'user2',
          name: '用户2',
          email: 'user2@example.com',
          status: 'active'
        }
      ]
    };
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return {
      success: false,
      error: error.message || '获取用户列表失败'
    };
  }
};

/**
 * 获取工作人员列表
 * @returns {Promise} - 工作人员列表
 */
export const getStaffList = async () => {
  try {
    // 模拟数据
    return {
      success: true,
      data: [
        {
          id: 1,
          username: 'staff1',
          name: '工作人员1',
          email: 'staff1@example.com',
          status: 'active'
        },
        {
          id: 2,
          username: 'staff2',
          name: '工作人员2',
          email: 'staff2@example.com',
          status: 'active'
        }
      ]
    };
  } catch (error) {
    console.error('获取工作人员列表失败:', error);
    return {
      success: false,
      error: error.message || '获取工作人员列表失败'
    };
  }
};

export default {
  login,
  getUserList,
  getStaffList
};