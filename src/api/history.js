import request from './request'


// 获取识别历史记录
export const getIdentifyHistory = (params) => {
  return request.get({
    url: '/history/history-list',
    data: params
  })
}

// 获取历史记录详情
export const getHistoryDetail = (id) => {
  return request.get({
    url: `/history/identify-history/${id}`
  })
}

// 删除历史记录
export const deleteHistory = (id) => {
  return request.del({
    url: `/history/delete-history/${id}`
  })
}

export default {
    getIdentifyHistory,
    getHistoryDetail,
    deleteHistory
}