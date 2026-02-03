const TOKEN_KEY = "token";
const USER_INFO_KEY = "user_info";

export function setAuth(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(user || {}));
}

export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function getUserInfo() {
    try {
        return JSON.parse(localStorage.getItem(USER_INFO_KEY) || '{}');
    } catch {
        return {};
    }
}

export function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_INFO_KEY);
}
