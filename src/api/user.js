import request from './request'

const loginApi = data => {
    return request.post({
        url: '/user/login',
        data
    })
}

const registerApi = data => {
    return request.post({
        url: '/user/register',
        data
    })
}


// 获取用户信息
export const getUserInfo = () => {
  return request.get({
    url: '/user/info'
  })
}

// 更新用户信息
export const updateUserInfo = (data) => {
  return request.post({
    url: '/user/update',
    data
  })
}

// 修改密码
export const changePassword = (data) => {
  return request.post({
    url: '/user/change-password',
    data
  })
}

// 获取识别历史记录
export const getIdentifyHistory = (params) => {
  return request.get({
    url: '/user/identify-history',
    data: params
  })
}

// 获取历史记录详情
export const getHistoryDetail = (id) => {
  return request.get({
    url: `/user/identify-history/${id}`
  })
}

// 删除历史记录
export const deleteHistory = (id) => {
  return request.post({
    url: '/user/delete-history',
    data: { id }
  })
}

export default {
  loginApi,
  registerApi
}