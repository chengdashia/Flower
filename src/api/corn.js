import request from './request'


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

