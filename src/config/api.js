// API Configuration
const API_BASE_URL = 'http://localhost:8000'

export const API_ENDPOINTS = {
  UPLOAD: `${API_BASE_URL}/upload`,
  CONVERT: `${API_BASE_URL}/convert`,
  GENERATE: `${API_BASE_URL}/generate`,
  SCRIPTS: `${API_BASE_URL}/scripts`,
  RUN: `${API_BASE_URL}/run`,
  STOP: (processId) => `${API_BASE_URL}/stop/${processId}`,
  STOP_ALL: `${API_BASE_URL}/stop-all`,
  STATUS: `${API_BASE_URL}/status`,
  HEALTH: `${API_BASE_URL}/health`,
  INFO: `${API_BASE_URL}/`
}

export default API_BASE_URL
