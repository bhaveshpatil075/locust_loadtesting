import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { API_ENDPOINTS } from '../config/api'

const HealthCheck = () => {
  const [status, setStatus] = useState('checking')
  const [info, setInfo] = useState(null)

  const checkHealth = async () => {
    try {
      const [healthResponse, infoResponse] = await Promise.all([
        axios.get(API_ENDPOINTS.HEALTH),
        axios.get(API_ENDPOINTS.INFO)
      ])
      
      setStatus('healthy')
      setInfo(infoResponse.data)
    } catch (error) {
      console.error('Health check failed:', error)
      setStatus('unhealthy')
    }
  }

  useEffect(() => {
    checkHealth()
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center space-x-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${
        status === 'healthy' ? 'bg-green-500' : 
        status === 'unhealthy' ? 'bg-red-500' : 'bg-yellow-500'
      }`}></div>
      <span className={`${
        status === 'healthy' ? 'text-green-700' : 
        status === 'unhealthy' ? 'text-red-700' : 'text-yellow-700'
      }`}>
        Backend {status === 'healthy' ? 'Connected' : status === 'unhealthy' ? 'Disconnected' : 'Checking...'}
      </span>
      {info && (
        <span className="text-gray-500 text-xs">
          v{info.version}
        </span>
      )}
    </div>
  )
}

export default HealthCheck
