import request from './request'

export function getWeekTotalCount() {
    return request.get({
        url: '/statistics/week/total-count'
    })
}

export function getWeekActiveUsers() {
    return request.get({
        url: '/statistics/week/active-users'
    })
}

export function getWeekTypeCount() {
    return request.get({
        url: '/statistics/week/type-count'
    })
}

export function getWeekUserRank() {
    return request.get({
        url: '/statistics/week/user-rank'
    })
}