import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { API_ENDPOINTS } from '../config/api'

const TestMonitor = () => {
  const [testStatus, setTestStatus] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedScript, setSelectedScript] = useState('')
  const [availableScripts, setAvailableScripts] = useState([])
  const [autoRefresh, setAutoRefresh] = useState(false)

  // Fetch available scripts
  const fetchScripts = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.SCRIPTS)
      const scriptsData = response.data?.scripts || response.data || []
      
      const processedScripts = Array.isArray(scriptsData) 
        ? scriptsData.map(script => 
            typeof script === 'string' 
              ? { filename: script, file_path: script }
              : script
          )
        : []
      
      setAvailableScripts(processedScripts)
      
      // Auto-select first script if none selected
      if (!selectedScript && processedScripts.length > 0) {
        setSelectedScript(processedScripts[0].filename || processedScripts[0])
      }
    } catch (err) {
      console.error('Error fetching scripts:', err)
      setError(`Failed to fetch scripts: ${err.response?.data?.message || err.message}`)
    }
  }

  // Check test status
  const checkTestStatus = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.STATUS)
      const status = response.data
      setTestStatus(status)
      setIsRunning(status?.status === 'running' || status?.running === true)
    } catch (err) {
      console.error('Error checking test status:', err)
      if (err.response?.status !== 404) {
        setError(`Failed to check test status: ${err.response?.data?.message || err.message}`)
      } else {
        // No test running
        setTestStatus(null)
        setIsRunning(false)
      }
    }
  }

  // Start a test
  const startTest = async () => {
    if (!selectedScript) {
      setError('Please select a script to run')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const response = await axios.post(API_ENDPOINTS.RUN, {
        script: selectedScript
      })
      
      setTestStatus(response.data)
      setIsRunning(true)
      setAutoRefresh(true)
      
      // Open Locust UI if URL is provided
      if (response.data?.ui_url || response.data?.url) {
        const locustUrl = response.data.ui_url || response.data.url
        window.open(locustUrl, '_blank')
      }
    } catch (err) {
      console.error('Error starting test:', err)
      setError(`Failed to start test: ${err.response?.data?.message || err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Stop a test
  const stopTest = async () => {
    if (!testStatus?.process_id) {
      setError('No active test to stop')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      await axios.post(API_ENDPOINTS.STOP(testStatus.process_id))
      setTestStatus(null)
      setIsRunning(false)
      setAutoRefresh(false)
    } catch (err) {
      console.error('Error stopping test:', err)
      setError(`Failed to stop test: ${err.response?.data?.message || err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Stop all tests
  const stopAllTests = async () => {
    if (!window.confirm('Are you sure you want to stop all running tests? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    setError('')
    
    try {
      await axios.post(API_ENDPOINTS.STOP_ALL)
      setTestStatus(null)
      setIsRunning(false)
      setAutoRefresh(false)
    } catch (err) {
      console.error('Error stopping all tests:', err)
      setError(`Failed to stop all tests: ${err.response?.data?.message || err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Auto-refresh when test is running
  useEffect(() => {
    let interval
    if (autoRefresh && isRunning) {
      interval = setInterval(checkTestStatus, 2000) // Check every 2 seconds
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, isRunning])

  // Initial load
  useEffect(() => {
    fetchScripts()
    checkTestStatus()
  }, [])

  const formatDuration = (seconds) => {
    if (!seconds) return '0s'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`
    if (minutes > 0) return `${minutes}m ${secs}s`
    return `${secs}s`
  }

  const formatNumber = (num) => {
    if (num === null || num === undefined) return 'N/A'
    return num.toLocaleString()
  }

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">Test Monitor</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={checkTestStatus}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button
            onClick={stopAllTests}
            disabled={loading || !isRunning}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Stop All
          </button>
          {autoRefresh && (
            <div className="flex items-center text-sm text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
              Auto-refreshing
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Script Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Script
        </label>
        <div className="flex space-x-2">
          <select
            value={selectedScript}
            onChange={(e) => setSelectedScript(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isRunning}
          >
            <option value="">Select a script...</option>
            {availableScripts.map((script, index) => (
              <option key={index} value={script.filename || script}>
                {script.filename || script}
              </option>
            ))}
          </select>
          <button
            onClick={startTest}
            disabled={loading || isRunning || !selectedScript}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2z" />
              </svg>
            )}
            Start Test
          </button>
        </div>
      </div>

      {/* Test Status */}
      {testStatus ? (
        <div className="space-y-4">
          {/* Status Header */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`}></div>
              <div>
                <h4 className="text-lg font-medium text-gray-900">
                  {isRunning ? 'Test Running' : 'Test Stopped'}
                </h4>
                <p className="text-sm text-gray-600">
                  Script: {testStatus.script || selectedScript}
                </p>
              </div>
            </div>
            {isRunning && (
              <button
                onClick={stopTest}
                disabled={loading}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
                Stop Test
              </button>
            )}
          </div>

          {/* Test Statistics */}
          {testStatus.stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {formatNumber(testStatus.stats.current_rps || testStatus.stats.rps)}
                </div>
                <div className="text-sm text-blue-800">Requests/sec</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {formatNumber(testStatus.stats.total_requests || testStatus.stats.requests)}
                </div>
                <div className="text-sm text-green-800">Total Requests</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {formatNumber(testStatus.stats.avg_response_time || testStatus.stats.avg_response)}
                </div>
                <div className="text-sm text-yellow-800">Avg Response (ms)</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {formatNumber(testStatus.stats.failures || testStatus.stats.failed_requests)}
                </div>
                <div className="text-sm text-purple-800">Failures</div>
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-medium text-gray-900 mb-2">Test Info</h5>
              <div className="space-y-1 text-sm text-gray-600">
                <div>Duration: {formatDuration(testStatus.duration || testStatus.runtime)}</div>
                <div>Users: {formatNumber(testStatus.users || testStatus.user_count)}</div>
                <div>Process ID: {testStatus.process_id || 'N/A'}</div>
                {testStatus.ui_url && (
                  <div>
                    <a 
                      href={testStatus.ui_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Open Locust UI →
                    </a>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-medium text-gray-900 mb-2">Response Times</h5>
              <div className="space-y-1 text-sm text-gray-600">
                <div>Min: {formatNumber(testStatus.stats?.min_response_time)}ms</div>
                <div>Max: {formatNumber(testStatus.stats?.max_response_time)}ms</div>
                <div>Median: {formatNumber(testStatus.stats?.median_response_time)}ms</div>
                <div>95th percentile: {formatNumber(testStatus.stats?.p95_response_time)}ms</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="mt-2">No test running</p>
          <p className="text-sm">Select a script and start a test to monitor its progress</p>
        </div>
      )}
    </div>
  )
}

export default TestMonitor
