import api from '@/api'

export default {
  namespaced: true,
  state: {
    token: window.sessionStorage.getItem('token') || '',
    username: '',
    isLoggedIn: !!window.sessionStorage.getItem('token')
  },
  mutations: {
    SET_TOKEN(state, token) {
      state.token = token
      window.sessionStorage.setItem('token', token)
      state.isLoggedIn = true
    },
    SET_USERNAME(state, username) {
      state.username = username
    },
    LOGOUT(state) {
      state.token = ''
      state.username = ''
      state.isLoggedIn = false
      window.sessionStorage.removeItem('token')
    }
  },
  actions: {
    async login({ commit }, credentials) {
      try {
        const res = await api.auth.login(credentials)
        if (res.code === 200) {
          commit('SET_TOKEN', res.token)
          commit('SET_USERNAME', credentials.username)
          return Promise.resolve(res)
        }
        return Promise.reject(res)
      } catch (error) {
        return Promise.reject(error)
      }
    },
    async register({ commit }, userData) {
      try {
        const res = await api.auth.register(userData)
        return Promise.resolve(res)
      } catch (error) {
        return Promise.reject(error)
      }
    },
    logout({ commit }) {
      commit('LOGOUT')
    }
  },
  getters: {
    isLoggedIn: state => state.isLoggedIn,
    username: state => state.username
  }
}