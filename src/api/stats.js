import request from './request'

export function getOverviewStats() {
  return request.get('/admin/stats/overview')
}

export function getTimeSeriesData(days = 30) {
  return request.get('/admin/stats/trend', { params: { days } })
}

