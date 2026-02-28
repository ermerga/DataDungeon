const KEY = 'thallo_auth'

export const login = () => localStorage.setItem(KEY, '1')
export const logout = () => localStorage.removeItem(KEY)
export const isLoggedIn = () => localStorage.getItem(KEY) === '1'
