import request from '../request'

export const login = data => {
  return request.post({
    url: '/auth/login',
    data
  })
}

export const register = data => {
  return request.post({
    url: '/auth/register',
    data
  })
}