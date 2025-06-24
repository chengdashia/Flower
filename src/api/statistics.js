import request from './request'

export function getWeekTotalCount() {
    return request.get({
        url: '/statistics/week/total-count'
    })
}
export function getWeekTypeCount() {
    return request.get({
        url: '/statistics/week/type-count'
    })
}
