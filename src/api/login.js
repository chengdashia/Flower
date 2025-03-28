import login from './request'

const loginApi = data => {
    return login.post({
        url: '/auth/login',
        data
    })
}

const registerApi = data => {
    return login.post({
        url: '/auth/register',
        data
    })
}

export default {
    loginApi,
    registerApi
}