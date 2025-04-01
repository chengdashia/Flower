import request from './request'

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

export const juhuaIdentify = (data) => {
  return request.post({
    url: '/chr_identify/predict',
    data
  })
}
export const flowerUpload = (data) => {
  return request.post({
    url: '/flower_identify/image',
    data,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}