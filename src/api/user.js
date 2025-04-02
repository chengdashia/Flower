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
  return request.post({
    url: '/user/info'
  })
}

// 更新用户信息
export const updateUserInfo = (data) => {
  return request.post({
    url: '/user/update-info',
    data
  })
}

// 修改密码
export const updatePassword = (data) => {
  return request.post({
    url: '/user/update-password',
    data
  })
}

export default {
  loginApi,
  registerApi,
  getUserInfo,
  updateUserInfo,
  updatePassword
}