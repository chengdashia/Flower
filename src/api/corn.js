import request from './request'

export const cornFilament = (file) => {
  const formData = new FormData()
  formData.append('image', file)

  return request.post({
    url: '/corn_filament/analyze',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export const cornFilamentNature = (file) => {
  const formData = new FormData()
  formData.append('image', file)

  return request.post({
    url: '/corn_filament_nature/analyze',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}


export const cornLeafSheath = (file) => {
  const formData = new FormData()
  formData.append('image', file)

  return request.post({
    url: '/corn_leaf_sheath/analyze',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export const cornAnalyzer = (data) => {
  return request.post({
    url: '/ym_analyzer/analyze',
    data
  })
}

export const cornShapeAnalyzer = (file) => {
  const formData = new FormData()
  formData.append('image', file)

  return request.post({
    url: '/corn_shape_analyzer/analyze',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export const cornAllAnalyzer = (file) => {
  const formData = new FormData()
  formData.append('image', file)
  
  return request.post({
    url: '/corn_all_analyzer/analyze',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}


export const cornGrade = (file) => {
  const formData = new FormData()
  formData.append('image', file)

  return request.post({
    url: '/corn_grade/analyze',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

