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

// ==================== 打卡审核相关 API ====================

/**
 * 获取分配给当前工作人员的打卡记录列表
 * @param {Object} params - 查询参数
 * @param {string} params.username - 用户名（可选）
 * @param {string} params.studentId - 学号（可选）
 * @param {string} params.date - 日期（可选，格式：YYYY-MM-DD）
 * @param {string} params.status - 状态（可选：pending/approved/rejected）
 * @param {string} params.staffId - 工作人员ID，限制只查看分配给该工作人员的记录（可选）
 * @param {number} params.page - 页码（可选，默认1）
 * @param {number} params.pageSize - 每页条数（可选，默认20）
 * @returns {Promise<Object>} 打卡记录列表及分页信息
 */
export async function getAuditRecords(params = {}) {
    console.log('getAuditRecords called with:', params)
    
    try {
        await ensureCloudLogin()
        
        const res = await callFunction({
            name: 'staff-api',
            data: {
                action: 'audit/getRecords',
                ...params
            }
        })
        
        console.log('getAuditRecords 返回结果:', res)
        
        const result = res?.result
        if (!result) {
            throw new Error('服务器无响应')
        }
        
        if (result.code !== 200) {
            throw new Error(result.message || '获取打卡记录失败')
        }
        
        return result.data
        
    } catch (err) {
        console.error('getAuditRecords 调用失败:', err)
        throw new Error(err.message || '获取打卡记录失败')
    }
}

/**
 * 获取打卡记录详情
 * @param {string} recordId - 打卡记录ID
 * @returns {Promise<Object>} 打卡记录详细信息
 */
export async function getAuditRecordDetail(recordId) {
    console.log('getAuditRecordDetail called with:', recordId)
    
    try {
        if (!recordId) {
            throw new Error('记录ID不能为空')
        }
        
        await ensureCloudLogin()
        
        const res = await callFunction({
            name: 'staff-api',
            data: {
                action: 'audit/getDetail',
                recordId
            }
        })
        
        console.log('getAuditRecordDetail 返回结果:', res)
        
        const result = res?.result
        if (!result) {
            throw new Error('服务器无响应')
        }
        
        if (result.code !== 200) {
            throw new Error(result.message || '获取记录详情失败')
        }
        
        return result.data
        
    } catch (err) {
        console.error('getAuditRecordDetail 调用失败:', err)
        throw new Error(err.message || '获取记录详情失败')
    }
}

/**
 * 提交审核结果
 * @param {Object} auditData - 审核数据
 * @param {string} auditData.recordId - 打卡记录ID
 * @param {string} auditData.result - 审核结果（approved/rejected）
 * @param {Array<string>} auditData.reasons - 拒绝原因（当result为rejected时必填）
 * @param {string} auditData.remark - 备注（可选）
 * @returns {Promise<Object>} 审核结果
 */
export async function submitAudit(auditData) {
    console.log('submitAudit called with:', auditData)
    
    try {
        // 参数验证
        if (!auditData.recordId) {
            throw new Error('记录ID不能为空')
        }
        
        if (!auditData.result || !['approved', 'rejected'].includes(auditData.result)) {
            throw new Error('审核结果必须是 approved 或 rejected')
        }
        
        if (auditData.result === 'rejected' && (!auditData.reasons || auditData.reasons.length === 0)) {
            throw new Error('拒绝时必须选择至少一个原因')
        }
        
        await ensureCloudLogin()
        
        const res = await callFunction({
            name: 'staff-api',
            data: {
                action: 'audit/submit',
                ...auditData
            }
        })
        
        console.log('submitAudit 返回结果:', res)
        
        const result = res?.result
        if (!result) {
            throw new Error('服务器无响应')
        }
        
        if (result.code !== 200) {
            throw new Error(result.message || '提交审核失败')
        }
        
        return result.data
        
    } catch (err) {
        console.error('submitAudit 调用失败:', err)
        throw new Error(err.message || '提交审核失败')
    }
}

/**
 * 修改审核结果（纠错功能）
 * @param {Object} updateData - 修改数据
 * @param {string} updateData.recordId - 打卡记录ID
 * @param {string} updateData.result - 新的审核结果（approved/rejected）
 * @param {Array<string>} updateData.reasons - 拒绝原因（当result为rejected时必填）
 * @param {string} updateData.remark - 修改备注（可选）
 * @returns {Promise<Object>} 修改结果
 */
export async function updateAuditResult(updateData) {
    console.log('updateAuditResult called with:', updateData)
    
    try {
        // 参数验证
        if (!updateData.recordId) {
            throw new Error('记录ID不能为空')
        }
        
        if (!updateData.result || !['approved', 'rejected'].includes(updateData.result)) {
            throw new Error('审核结果必须是 approved 或 rejected')
        }
        
        if (updateData.result === 'rejected' && (!updateData.reasons || updateData.reasons.length === 0)) {
            throw new Error('拒绝时必须选择至少一个原因')
        }
        
        await ensureCloudLogin()
        
        const res = await callFunction({
            name: 'staff-api',
            data: {
                action: 'audit/update',
                ...updateData
            }
        })
        
        console.log('updateAuditResult 返回结果:', res)
        
        const result = res?.result
        if (!result) {
            throw new Error('服务器无响应')
        }
        
        if (result.code !== 200) {
            throw new Error(result.message || '修改审核结果失败')
        }
        
        return result.data
        
    } catch (err) {
        console.error('updateAuditResult 调用失败:', err)
        throw new Error(err.message || '修改审核结果失败')
    }
}

/**
 * 批量审核
 * @param {Array<Object>} auditList - 审核列表
 * @returns {Promise<Object>} 批量审核结果
 */
export async function batchAudit(auditList) {
    console.log('batchAudit called with:', auditList)
    
    try {
        if (!auditList || auditList.length === 0) {
            throw new Error('审核列表不能为空')
        }
        
        await ensureCloudLogin()
        
        const res = await callFunction({
            name: 'staff-api',
            data: {
                action: 'audit/batch',
                auditList
            }
        })
        
        console.log('batchAudit 返回结果:', res)
        
        const result = res?.result
        if (!result) {
            throw new Error('服务器无响应')
        }
        
        if (result.code !== 200) {
            throw new Error(result.message || '批量审核失败')
        }
        
        return result.data
        
    } catch (err) {
        console.error('batchAudit 调用失败:', err)
        throw new Error(err.message || '批量审核失败')
    }
}


/**
 * 获取申诉列表
 * @param {Object} params - 查询参数
 * @param {string} params.status - 状态筛选: 'all', '0', '1', '2'
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 * @returns {Promise<Object>} 申诉列表数据
 */
export async function getAppealsList(params = {}) {
    console.log("getAppealsList called with params:", params)
    try {
        await ensureCloudLogin()

        // 获取当前工作人员信息
        const staffInfo = getCurrentStaff()
        if (!staffInfo || !staffInfo._id) {
            throw new Error('工作人员未登录或登录信息不完整')
        }

        const staffId = staffInfo._id

        const res = await callFunction({
            name: "getAppealsList",
            data: {
                status: params.status || 'all',
                page: params.page || 1,
                pageSize: params.pageSize || 10,
                staffId: staffId  // 新增：传递工作人员ID
            }
        })

        console.log("getAppealsList 云函数返回:", res)

        const result = res?.result
        if (!result) {
            console.error('云函数无返回结果')
            throw new Error('服务器无响应，请稍后重试')
        }

        if (result.code !== 200) {
            throw new Error(result.message || '获取申诉列表失败')
        }

        return result.data
    } catch (err) {
        console.error("getAppealsList 调用失败:", err)
        throw new Error(err.message || '获取申诉列表失败，请稍后重试')
    }
}

/**
 * 获取申诉详情
 * @param {string} appealId - 申诉ID
 * @returns {Promise<Object>} 申诉详情
 */
export async function getAppealDetail(appealId) {
    console.log("getAppealDetail called with appealId:", appealId)

    try {
        await ensureCloudLogin()

        if (!appealId) {
            throw new Error('申诉ID不能为空')
        }

        // 获取当前工作人员信息
        const staffInfo = getCurrentStaff()
        const staffId = staffInfo?._id

        const res = await callFunction({
            name: "getAppealDetail",
            data: {
                appealId,
                staffId
            }
        })

        console.log("getAppealDetail 云函数返回:", res)

        const result = res?.result
        if (!result) {
            console.error('云函数无返回结果')
            throw new Error('服务器无响应，请稍后重试')
        }

        if (result.code !== 200) {
            if (result.code === 403) {
                throw new Error('您无权查看此申诉详情')
            }
            throw new Error(result.message || '获取申诉详情失败')
        }

        return result.data

    } catch (err) {
        console.error("getAppealDetail 调用失败:", err)
        throw new Error(err.message || '获取申诉详情失败，请稍后重试')
    }
}

/**
 * 处理申诉
 * @param {string} appealId - 申诉ID
 * @param {number} result - 处理结果: 1=通过, 2=不通过
 * @param {string} auditResult - 审核意见
 * @returns {Promise<Object>} 处理结果
 */
export async function processAppeal(appealId, result, auditResult) {
    console.log("processAppeal called:", { appealId, result, auditResult })

    try {
        await ensureCloudLogin()

        if (!appealId || result === undefined || !auditResult) {
            throw new Error('参数不完整')
        }

        if (![1, 2].includes(result)) {
            throw new Error('处理结果无效，1为通过，2为不通过')
        }

        // 获取当前工作人员信息
        const staffInfo = getCurrentStaff()
        if (!staffInfo) {
            throw new Error('工作人员未登录')
        }

        const res = await callFunction({
            name: "processAppeal",
            data: {
                appealId,
                result,
                auditResult,
                staffName: staffInfo.name || staffInfo.username || '工作人员',
                staffId: staffInfo._id  // 新增：传递工作人员ID用于权限验证
            }
        })

        console.log("processAppeal 云函数返回:", res)

        const resultData = res?.result
        if (!resultData) {
            console.error('云函数无返回结果')
            throw new Error('服务器无响应，请稍后重试')
        }

        if (resultData.code !== 200) {
            if (resultData.code === 403) {
                throw new Error('您无权处理此申诉，该申诉由其他工作人员负责')
            }
            throw new Error(resultData.message || '处理申诉失败')
        }

        return resultData.data

    } catch (err) {
        console.error("processAppeal 调用失败:", err)
        throw new Error(err.message || '处理申诉失败，请稍后重试')
    }
}

