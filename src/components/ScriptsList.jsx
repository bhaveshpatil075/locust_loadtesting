import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { API_ENDPOINTS } from '../config/api'

const ScriptsList = () => {
  const [scripts, setScripts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchScripts = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await axios.get(API_ENDPOINTS.SCRIPTS)
      const scriptsData = response.data?.scripts || response.data || []
      
      // Handle both string array and object array responses
      const processedScripts = Array.isArray(scriptsData) 
        ? scriptsData.map(script => 
            typeof script === 'string' 
              ? { filename: script, file_path: script, file_size: null, created_at: null, modified_at: null }
              : script
          )
        : []
      
      setScripts(processedScripts)
    } catch (err) {
      console.error('Error fetching scripts:', err)
      setError(`Failed to fetch scripts: ${err.response?.data?.message || err.message}`)
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    fetchScripts()
  }, [])

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Available Scripts</h3>
        <button
          onClick={fetchScripts}
          disabled={loading}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? (
            <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
          {error}
        </div>
      )}

      {scripts.length === 0 && !loading ? (
        <div className="text-center py-8 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="mt-2">No scripts available</p>
        </div>
      ) : (
        <div className="space-y-2">
          {scripts.map((script, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3 flex-1">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900 font-mono truncate">
                      {script.filename || script}
                    </span>
                    {script.file_size && (
                      <span className="text-xs text-gray-500">
                        ({(script.file_size / 1024).toFixed(1)} KB)
                      </span>
                    )}
                  </div>
                  {script.created_at && (
                    <p className="text-xs text-gray-500">
                      Created: {new Date(script.created_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-500 ml-2">
                Available for testing
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ScriptsList
