import request from '../request'

export const identifyFlower = data => {
  return request.post({
    url: '/flower_identify/image',
    data
  })
}

export const getFlowerStats = () => {
  return request.get({
    url: '/flower/stats'
  })
}