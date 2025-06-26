import axios from 'axios'
import { ElMessage } from 'element-plus'

//创建axios实例
const Service = axios.create({
    // 设置baseURL地址
    // baseURL: 'http://134.175.18.239:5000',
    // baseURL: 'http://127.0.0.1:5000',
    baseURL: process.env.VUE_APP_API_URL,
    //定义统一的请求头
    headers: {
        'Content-Type': "application/json;charset=UTF-8"
    },
    //配置请求超时时间
    timeout: 100000
})

//请求拦截器
Service.interceptors.request.use((config) => {
    //配置请求头
    config.headers['Authorization'] = window.sessionStorage.getItem('token') === null ? null : window.sessionStorage.getItem('token')
    // 添加用户ID到请求头
    const userID = window.sessionStorage.getItem('token')
    if (userID) {
        config.headers['token'] = userID
    }
    return config
})

//响应拦截器
Service.interceptors.response.use((response) => {
    //获取接口返回结果
    const res = response.data
    if (res.code === 200) {
        return res
    }
    else {
        ElMessage.error(res.message || '网络异常')
        return res
    }
})

export default Service
