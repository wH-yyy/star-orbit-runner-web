/**
 * 认证相关API
 */
import {callFunction, ensureCloudLogin} from "../cloud";

/**
 * 管理员登录
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Promise<Object>} 登录结果，包含管理员信息
 */
export async function loginAdmin(username, password) {
    console.log("loginAdmin called with:", {username, passwordLength: password?.length})

    try {
        // 参数验证
        if (!username || !password) {
            throw new Error('请输入用户名和密码')
        }

        // 确保云开发登录状态
        await ensureCloudLogin()

        console.log('调用云函数 loginAdmin...')

        const res = await callFunction({
            name: "loginAdmin",
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

        if (!result.success) {
            // 根据不同的错误码提供更具体的提示
            if (result.code === 401) {
                throw new Error('用户名或密码错误')
            } else if (result.code === 404) {
                throw new Error('用户不存在或账号已停用')
            } else if (result.code === 403) {
                throw new Error('账号已被禁用，请联系超管')
            } else {
                throw new Error(result.message || '登录失败')
            }
        }

        // 登录成功，保存管理员信息到本地存储
        if (result.data) {
            localStorage.setItem('adminInfo', JSON.stringify(result.data))
            localStorage.setItem('adminToken', `admin_${Date.now()}`) // 简单的 token，实际项目中应该使用 JWT
            localStorage.setItem('adminLoginTime', new Date().toISOString())

            console.log('管理员登录成功，用户信息已保存:', result.data)
        }

        return result.data

    } catch (err) {
        console.error("loginAdmin 调用失败:", err)

        // 清除可能存储的错误登录信息
        localStorage.removeItem('adminInfo')
        localStorage.removeItem('adminToken')

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
 * 获取当前登录的管理员信息
 * @returns {Object|null} 管理员信息，如果未登录则返回 null
 */
export function getCurrentAdmin() {
    try {
        const adminInfo = localStorage.getItem('adminInfo')
        if (!adminInfo) return null

        return JSON.parse(adminInfo)
    } catch (error) {
        console.error('获取管理员信息失败:', error)
        return null
    }
}

/**
 * 检查管理员是否已登录
 * @returns {boolean} 是否已登录
 */
export function isAdminLoggedIn() {
    const adminInfo = getCurrentAdmin()
    const adminToken = localStorage.getItem('adminToken')

    return !!(adminInfo && adminToken)
}

/**
 * 管理员登出
 */
export function logoutAdmin() {
    localStorage.removeItem('adminInfo')
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminLoginTime')
    console.log('管理员已登出')
}

/**
 * 获取用户列表（分页）
 * @param {Object} params - 分页和筛选参数
 * @returns {Promise<Object>} 用户列表数据
 */
export async function getUserList(params = {}) {
    console.log("getUserList called with:", params)

    try {
        // 确保云开发登录状态
        await ensureCloudLogin()

        const res = await callFunction({
            name: "getUserList",
            data: {
                page: params.page || 1,
                pageSize: params.pageSize || 10,
                searchKeyword: params.searchKeyword || '',
                searchFields: params.searchFields || ['name', 'stu_id', 'class_name'],
                campus: params.campus || [],
                college: params.college || [],
                gender: params.gender || []
            }
        })

        console.log("云函数返回结果:", res)

        const result = res?.result
        if (!result) {
            console.error('云函数无返回结果')
            throw new Error('服务器无响应，请稍后重试')
        }

        console.log("云函数处理结果:", result)

        if (!result.success) {
            throw new Error(result.message || '获取用户列表失败')
        }

        return result.data

    } catch (err) {
        console.error("getUserList 调用失败:", err)

        // 如果是网络错误，提供更友好的提示
        if (err.message.includes('network') || err.message.includes('Network')) {
            throw new Error('网络连接失败，请检查网络后重试')
        }

        // 如果是云函数调用失败，可能是未部署
        if (err.message.includes('云函数') || err.message.includes('function')) {
            throw new Error('系统功能未就绪，请稍后重试')
        }

        // 使用原始错误消息
        throw new Error(err.message || '获取用户列表失败，请稍后重试')
    }
}

/**
 * 更新用户状态
 * @param {string} userId - 用户ID
 * @param {string} status - 新状态（active, suspended, banned）
 * @returns {Promise<Object>} 更新结果
 */
export async function updateUserStatus(userId, status) {
    console.log("updateUserStatus called with:", { userId, status })

    try {
        // 确保云开发登录状态
        await ensureCloudLogin()

        const res = await callFunction({
            name: "updateUserStatus",
            data: {
                userId,
                status
            }
        })

        console.log("云函数返回结果:", res)

        const result = res?.result
        if (!result) {
            console.error('云函数无返回结果')
            throw new Error('服务器无响应，请稍后重试')
        }

        console.log("云函数处理结果:", result)

        if (!result.success) {
            throw new Error(result.message || '更新用户状态失败')
        }

        return result.data

    } catch (err) {
        console.error("updateUserStatus 调用失败:", err)

        // 如果是网络错误，提供更友好的提示
        if (err.message.includes('network') || err.message.includes('Network')) {
            throw new Error('网络连接失败，请检查网络后重试')
        }

        // 如果是云函数调用失败，可能是未部署
        if (err.message.includes('云函数') || err.message.includes('function')) {
            throw new Error('系统功能未就绪，请稍后重试')
        }

        // 使用原始错误消息
        throw new Error(err.message || '更新用户状态失败，请稍后重试')
    }
}

/**
 * 添加工作人员
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @param {string} campus - 校区
 * @returns {Promise<Object>} 添加结果
 */
export async function addStaff(username, password, campus) {
    console.log("addStaff called with:", {username, passwordLength: password?.length, campus})

    try {
        // 确保云开发登录状态
        await ensureCloudLogin()

        const res = await callFunction({
            name: "addStaff",
            data: {
                username,
                password,
                campus,
            },
        })

        console.log("云函数返回结果:", res)

        const result = res?.result
        if (!result) {
            console.error('云函数无返回结果')
            throw new Error('服务器无响应，请稍后重试')
        }

        console.log("云函数处理结果:", result)

        if (!result.success) {
            // 如果云函数返回了错误消息，直接使用
            throw new Error(result.message || '添加失败')
        }

        return result.data

    } catch (err) {
        console.error("addStaff 调用失败:", err)

        // 如果是网络错误，提供更友好的提示
        if (err.message.includes('network') || err.message.includes('Network')) {
            throw new Error('网络连接失败，请检查网络后重试')
        }

        // 如果是云函数调用失败，可能是未部署
        if (err.message.includes('云函数') || err.message.includes('function')) {
            throw new Error('系统功能未就绪，请稍后重试')
        }

        // 使用原始错误消息
        throw new Error(err.message || '添加失败，请稍后重试')
    }
}

/**
 * 获取工作人员列表
 * @returns {Promise<Array>} 工作人员列表
 */
export async function getStaffList() {
    try {
        await ensureCloudLogin()

        const res = await callFunction({
            name: "getStaffList",
            data: {}
        })

        const result = res?.result
        if (!result || !result.success) {
            throw new Error(result?.message || '获取失败')
        }

        return result.data
    } catch (err) {
        console.error('获取工作人员列表失败:', err)
        throw new Error('获取列表失败')
    }
}

/**
 * 更新工作人员状态
 * @param {string} staffId - 工作人员ID
 * @param {string} status - 新状态（active/inactive）
 * @returns {Promise<Object>} 更新结果
 */
export async function updateStaffStatus(staffId, status) {
    try {
        await ensureCloudLogin()

        const res = await callFunction({
            name: "updateStaffStatus",
            data: {staffId, status}
        })

        const result = res?.result
        if (!result || !result.success) {
            throw new Error(result?.message || '更新失败')
        }

        return result.data
    } catch (err) {
        console.error('更新工作人员状态失败:', err)
        throw new Error('更新状态失败')
    }
}

export async function exportDataApi() {
    try {
        await ensureCloudLogin()

        const res = await callFunction({
            name: 'exportData',
            data: {}
        })

        if (res && res.result && res.result.code === 0) {
            const fileUrl = res.result.data.fileUrl
            window.open(fileUrl, '_blank')
        } else {
            alert(`导出失败: ${res.result?.message || '请检查云函数日志'}`)
        }
    } catch (error) {
        alert(`导出失败: ${error.message}`)
    }
}