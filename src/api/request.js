/**
 * 基础网络请求配置
 */

// 基础URL
const BASE_URL = '/api';

/**
 * 基础请求方法
 * @param {string} url - 请求地址
 * @param {object} options - 请求选项
 * @returns {Promise} - 请求结果
 */
export const request = async (url, options = {}) => {
  // 构建完整的请求URL
  const fullUrl = `${BASE_URL}${url}`;
  
  // 默认请求头
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  // 获取token
  const token = localStorage.getItem('token');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  // 合并请求选项
  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };
  
  try {
    // 发送请求
    const response = await fetch(fullUrl, config);
    
    // 检查响应状态
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // 解析响应数据
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('请求失败:', error);
    throw error;
  }
};

/**
 * GET请求
 * @param {string} url - 请求地址
 * @param {object} params - 请求参数
 * @returns {Promise} - 请求结果
 */
export const get = async (url, params = {}) => {
  // 构建查询字符串
  const queryString = new URLSearchParams(params).toString();
  const fullUrl = queryString ? `${url}?${queryString}` : url;
  
  return request(fullUrl, {
    method: 'GET',
  });
};

/**
 * POST请求
 * @param {string} url - 请求地址
 * @param {object} data - 请求数据
 * @returns {Promise} - 请求结果
 */
export const post = async (url, data = {}) => {
  return request(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * PUT请求
 * @param {string} url - 请求地址
 * @param {object} data - 请求数据
 * @returns {Promise} - 请求结果
 */
export const put = async (url, data = {}) => {
  return request(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * DELETE请求
 * @param {string} url - 请求地址
 * @returns {Promise} - 请求结果
 */
export const del = async (url) => {
  return request(url, {
    method: 'DELETE',
  });
};

export default {
  get,
  post,
  put,
  delete: del,
};