import Service from "./config";

//封装get请求
const get = (config) => {
    return Service({
        ...config,
        method: 'get',
        params: config.data
    })
}

//封装post请求
const post = (config) => {
    return Service({
        ...config,
        method: 'post',
        data: config.data
    })
}

// 封装 delete 请求
const del = (config) => {
    return Service({
        ...config,
        method: 'delete',
        params: config.params // 通常 delete 请求使用 params
    });
}

export default {
    get,
    post,
    del
}