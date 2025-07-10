import request from './request'


export const ymAllAnalyzer = (file) => {
  const formData = new FormData()
  formData.append('image', file)
  
  return request.post({
    url: '/ym_all_analyzer/analyze',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

