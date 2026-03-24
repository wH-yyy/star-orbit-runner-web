/**
 * 登录相关API
 */
import { callFunction, ensureCloudLogin } from "../cloud";

/**
 * 管理员登录
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Promise<Object>} 登录结果
 */
export async function adminLogin(username, password) {
  console.log("adminLogin called with:", username, password?.length);

  try {
    await ensureCloudLogin();
    console.log("BEFORE CALL");

    const res = await callFunction({
      name: "admin-api",
      data: {
        action: "admin/login",
        username,
        password,
      },
    });

    console.log("AFTER CALL raw =>", res);
    console.log("AFTER CALL result =>", res?.result);

    const result = res?.result;
    if (!result) {
      throw new Error("云函数无返回 result");
    }

    if (result.code !== 0) {
      throw new Error(`[${result.code}] ${result.message || "登录失败"}`);
    }

    return result.data; // { token, admin }

  } catch (err) {
    // ⭐⭐⭐ 关键：这里一定要打印
    console.error("adminLogin ERROR =>", err);

    // CloudBase 有时会把信息放在 err.message / err.response
    if (err?.message) {
      throw new Error(err.message);
    }

    throw new Error("调用云函数失败");
  }
}

/**
 * 工作人员登录
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Promise<Object>} 登录结果
 */
export async function staffLogin(username, password) {
  console.log("staffLogin called with:", username, password?.length);

  try {
    await ensureCloudLogin();
    console.log("BEFORE CALL");

    const res = await callFunction({
      name: "loginStaff",
      data: {
        username,
        password,
      },
    });

    console.log("AFTER CALL raw =>", res);
    console.log("AFTER CALL result =>", res?.result);

    const result = res?.result;
    if (!result) {
      throw new Error("云函数无返回 result");
    }

    if (result.code !== 0) {
      throw new Error(`[${result.code}] ${result.message || "登录失败"}`);
    }

    return result.data; // { token, staff }

  } catch (err) {
    console.error("staffLogin ERROR =>", err);
    throw new Error("登录失败");
  }
}

/**
 * 通用登录函数
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @param {string} role - 角色（admin 或 staff）
 * @returns {Promise<Object>} 登录结果
 */
export async function login(username, password, role) {
  if (role === 'admin') {
    return await adminLogin(username, password);
  } else if (role === 'staff') {
    return await staffLogin(username, password);
  } else {
    throw new Error("无效的角色");
  }
}