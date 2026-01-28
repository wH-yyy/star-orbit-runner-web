import { createStore } from 'vuex'
import { login as loginApi } from '../api/admin.js'

// 安全的 JSON 解析
const safeParseJSON = (str, defaultValue = {}) => {
    try {
        return str ? JSON.parse(str) : defaultValue
    } catch {
        return defaultValue
    }
}

// 安全的 localStorage 读取
const getLocalStorageItem = (key, defaultValue = null) => {
    try {
        return localStorage.getItem(key) || defaultValue
    } catch {
        return defaultValue
    }
}

const store = createStore({
    state() {
        return {
            user: {
                token: getLocalStorageItem('token'),
                info: safeParseJSON(getLocalStorageItem('userInfo')),
                role: getLocalStorageItem('role')
            },
            loading: false,
            message: null,
            messageType: 'error' // 添加消息类型：'error', 'success', 'warning'
        }
    },

    mutations: {
        SET_USER(state, userData) {
            state.user.token = userData.token || null
            state.user.info = userData.user || {}
            state.user.role = userData.user?.role || null

            try {
                if (userData.token) {
                    localStorage.setItem('token', userData.token)
                }
                if (userData.user) {
                    localStorage.setItem('userInfo', JSON.stringify(userData.user))
                }
                if (userData.user?.role) {
                    localStorage.setItem('role', userData.user.role)
                }
            } catch (error) {
                console.error('保存到 localStorage 失败:', error)
            }
        },

        CLEAR_USER(state) {
            state.user.token = null
            state.user.info = {}
            state.user.role = null

            try {
                localStorage.removeItem('token')
                localStorage.removeItem('userInfo')
                localStorage.removeItem('role')
            } catch (error) {
                console.error('清除 localStorage 失败:', error)
            }
        },

        UPDATE_USER_INFO(state, userInfo) {
            state.user.info = { ...state.user.info, ...userInfo }
            try {
                const currentInfo = safeParseJSON(localStorage.getItem('userInfo'), {})
                localStorage.setItem('userInfo', JSON.stringify({ ...currentInfo, ...userInfo }))
            } catch (error) {
                console.error('更新用户信息失败:', error)
            }
        },

        SET_LOADING(state, isLoading) {
            state.loading = isLoading
        },

        SET_MESSAGE(state, payload) {
            if (typeof payload === 'string') {
                state.message = payload
                state.messageType = 'error'
            } else {
                state.message = payload.message
                state.messageType = payload.type || 'error'
            }
        },

        CLEAR_MESSAGE(state) {
            state.message = null
            state.messageType = 'error'
        }
    },

    actions: {
        async login({ commit }, credentials) {
            try {
                commit('SET_LOADING', true)
                commit('CLEAR_MESSAGE')

                // 调用登录API
                const data = await loginApi(credentials)

                if (data.success) {
                    commit('SET_USER', data)
                    commit('SET_MESSAGE', {
                        message: '登录成功',
                        type: 'success'
                    })
                    return {
                        success: true,
                        role: data.user?.role,
                        data: data
                    }
                } else {
                    throw new Error(data.error || data.message || '登录失败')
                }
            } catch (error) {
                let errorMessage = '登录失败'

                if (error.response) {
                    // HTTP 错误
                    switch (error.response.status) {
                        case 401:
                            errorMessage = '用户名或密码错误'
                            break
                        case 403:
                            errorMessage = '账户已被禁用'
                            break
                        case 404:
                            errorMessage = '服务未找到'
                            break
                        case 500:
                            errorMessage = '服务器内部错误'
                            break
                        default:
                            errorMessage = `请求失败: ${error.response.status}`
                    }
                } else if (error.request) {
                    // 网络错误
                    errorMessage = '网络连接失败，请检查网络设置'
                } else {
                    // 其他错误
                    errorMessage = error.message || '登录失败'
                }

                commit('SET_MESSAGE', errorMessage)
                return {
                    success: false,
                    error: errorMessage,
                    originalError: error
                }
            } finally {
                commit('SET_LOADING', false)
            }
        },

        logout({ commit }) {
            commit('CLEAR_USER')
            commit('CLEAR_MESSAGE')
        },

        // 添加更新用户信息的 action
        updateUserInfo({ commit }, userInfo) {
            commit('UPDATE_USER_INFO', userInfo)
        },

        // 清除消息
        clearMessage({ commit }) {
            commit('CLEAR_MESSAGE')
        }
    },

    getters: {
        isAuthenticated: state => !!state.user.token,
        userRole: state => state.user.role,
        userName: state => state.user.info?.name || '用户',
        userId: state => state.user.info?.id,
        userInfo: state => state.user.info,
        isLoading: state => state.loading,
        hasMessage: state => !!state.message,
        messageType: state => state.messageType
    }
})

// 监听 localStorage 变化，同步多标签页状态
if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
        if (event.key === 'token' && !event.newValue) {
            // 其他标签页清除了 token，同步退出登录
            store.commit('CLEAR_USER')
        }
    })
}

export default store