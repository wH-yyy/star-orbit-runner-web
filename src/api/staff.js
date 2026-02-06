// api/staff.js
import { callFunction, ensureCloudLogin } from '../cloud'

/**
 * 工作人员登录
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Promise<Object>} 登录结果，包含用户信息
 */
export async function loginStaff(username, password) {
    console.log("loginStaff called with:", { username, passwordLength: password?.length })

    try {
        // 参数验证
        if (!username || !password) {
            throw new Error('请输入用户名和密码')
        }

        // 确保云开发登录状态
        await ensureCloudLogin()

        console.log('调用云函数 loginStaff...')

        const res = await callFunction({
            name: "loginStaff",
            data: {
                username,
                password,
            },
        })

        console.log("云函数返回结果:", res)

        const result = res?.result
        if (!result) {
            console.error('云函数无返回结果')
            throw new Error('服务器无响应，请稍后重试')
        }

        console.log("云函数处理结果:", result)

        if (result.code !== 200) {
            // 根据不同的错误码提供更具体的提示
            if (result.code === 401) {
                throw new Error('用户名或密码错误')
            } else if (result.code === 404) {
                throw new Error('用户不存在或账号已停用')
            } else if (result.code === 403) {
                throw new Error('账号已被禁用，请联系管理员')
            } else {
                throw new Error(result.message || '登录失败')
            }
        }

        // 登录成功，保存用户信息到本地存储
        if (result.data) {
            localStorage.setItem('staffInfo', JSON.stringify(result.data))
            localStorage.setItem('staffToken', `staff_${Date.now()}`) // 简单的 token，实际项目中应该使用 JWT
            localStorage.setItem('staffLoginTime', new Date().toISOString())

            console.log('工作人员登录成功，用户信息已保存:', result.data)
        }

        return result.data

    } catch (err) {
        console.error("loginStaff 调用失败:", err)

        // 清除可能存储的错误登录信息
        localStorage.removeItem('staffInfo')
        localStorage.removeItem('staffToken')

        // 处理特定的错误类型
        if (err.message.includes('network') || err.message.includes('Network')) {
            throw new Error('网络连接失败，请检查网络后重试')
        }

        if (err.message.includes('云函数') || err.message.includes('function')) {
            throw new Error('系统功能未就绪，请稍后重试')
        }

        // 使用原始错误消息
        throw new Error(err.message || '登录失败，请稍后重试')
    }
}

/**
 * 获取当前登录的工作人员信息
 * @returns {Object|null} 工作人员信息，如果未登录则返回 null
 */
export function getCurrentStaff() {
    try {
        const staffInfo = localStorage.getItem('staffInfo')
        if (!staffInfo) return null

        return JSON.parse(staffInfo)
    } catch (error) {
        console.error('获取工作人员信息失败:', error)
        return null
    }
}

/**
 * 检查工作人员是否已登录
 * @returns {boolean} 是否已登录
 */
export function isStaffLoggedIn() {
    const staffInfo = getCurrentStaff()
    const staffToken = localStorage.getItem('staffToken')

    // 简单检查，实际项目中应该验证 token 的有效性
    return !!(staffInfo && staffToken)
}

/**
 * 工作人员登出
 */
export function logoutStaff() {
    localStorage.removeItem('staffInfo')
    localStorage.removeItem('staffToken')
    localStorage.removeItem('staffLoginTime')
    console.log('工作人员已登出')
}

/**
 * 获取工作人员权限
 * @returns {string} 权限级别，默认返回 'staff'
 */
export function getStaffRole() {
    const staffInfo = getCurrentStaff()
    return staffInfo?.role || 'staff'
}

/**
 * 检查工作人员是否有特定权限
 * @param {string} requiredRole - 需要的权限
 * @returns {boolean} 是否有权限
 */
export function hasStaffPermission(requiredRole) {
    const currentRole = getStaffRole()

    // 简单的权限检查逻辑
    const roleHierarchy = {
        'admin': ['admin', 'staff'], // 管理员有所有权限
        'staff': ['staff'], // 普通工作人员只有自身权限
        'viewer': ['viewer'] // 只读权限（如果需要）
    }

    return roleHierarchy[currentRole]?.includes(requiredRole) || false
}