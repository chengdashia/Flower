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

export const chrCrop = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post({
    url: '/chr_identify_file/crop',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export const chrPredict = (data) => {
  return request.post({
    url: '/chr_identify_file/predict',
    data
  })
}

export const cornIdentify = (data) => {
  return request.post({
    url: '/corn_identify/analyze',
    data
  })
}



export const filamentIdentify = (data) => {
  return request.post({
    url: '/filament_identify/analyze',
    data
  })
}



export const leafSheathIdentify = (data) => {
  return request.post({
    url: '/leaf_sheath_identify/analyze',
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