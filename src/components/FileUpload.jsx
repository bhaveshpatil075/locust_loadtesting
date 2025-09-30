import React, { useState } from 'react'
import axios from 'axios'
import { API_ENDPOINTS } from '../config/api'

const FileUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [converting, setConverting] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [convertStatus, setConvertStatus] = useState('')
  const [generateStatus, setGenerateStatus] = useState('')
  const [generatedScript, setGeneratedScript] = useState(null)
  const [flowData, setFlowData] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [scriptFilename, setScriptFilename] = useState('')
  const [filenameError, setFilenameError] = useState('')
  const [targetHost, setTargetHost] = useState('')
  const [hostError, setHostError] = useState('')

  const handleFileSelect = (file) => {
    if (file) {
      console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type)
      console.log('File object:', file)
      setSelectedFile(file)
      setUploadStatus('')
      setConvertStatus('')
      setGenerateStatus('')
      setGeneratedScript(null)
      setFlowData(null)
      
      // Auto-generate filename from uploaded file
      const baseName = file.name.replace(/\.[^/.]+$/, '') // Remove extension
      const cleanName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_') // Replace spaces and special chars
      setScriptFilename(cleanName)
      setFilenameError('')
    } else {
      console.log('No file selected or file is null')
    }
  }

  const validateFilename = (filename) => {
    if (!filename.trim()) {
      return 'Filename is required'
    }
    if (filename.includes(' ')) {
      return 'Filename cannot contain spaces'
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(filename)) {
      return 'Filename can only contain letters, numbers, underscores, and hyphens'
    }
    if (filename.length > 50) {
      return 'Filename must be 50 characters or less'
    }
    return ''
  }

  const validateHost = (host) => {
    if (!host.trim()) {
      return 'Target host is required'
    }
    
    const trimmedHost = host.trim()
    
    // Check for common invalid characters
    if (/[<>"{}|\\^`\[\]]/.test(trimmedHost)) {
      return 'Host contains invalid characters'
    }
    
    // IP address validation (IPv4)
    const ipPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?::[0-9]{1,5})?$/
    if (ipPattern.test(trimmedHost)) {
      return '' // Valid IP address
    }
    
    // URL validation with proper formatting
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/
    if (urlPattern.test(trimmedHost)) {
      // Additional checks for URL format
      if (trimmedHost.includes(' ')) {
        return 'URL cannot contain spaces'
      }
      
      // Check for double slashes (except after protocol)
      if (trimmedHost.includes('//') && !trimmedHost.match(/^https?:\/\//)) {
        return 'URL contains invalid double slashes'
      }
      
      // Check for valid protocol if provided
      if (trimmedHost.includes('://')) {
        if (!trimmedHost.match(/^https?:\/\//)) {
          return 'Only http:// and https:// protocols are supported'
        }
      }
      
      return '' // Valid URL
    }
    
    // Check for localhost variations
    const localhostPattern = /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:[0-9]{1,5})?(\/.*)?$/
    if (localhostPattern.test(trimmedHost)) {
      return '' // Valid localhost
    }
    
    // Check for basic domain format (without protocol)
    const domainPattern = /^[\da-z\.-]+\.[a-z\.]{2,6}([\/\w \.-]*)*\/?$/
    if (domainPattern.test(trimmedHost)) {
      return '' // Valid domain (will be treated as https)
    }
    
    return 'Please enter a valid URL (e.g., https://api.example.com), IP address (e.g., 192.168.1.100), or localhost'
  }

  const handleFilenameChange = (e) => {
    const value = e.target.value
    setScriptFilename(value)
    setFilenameError(validateFilename(value))
  }

  const handleHostChange = (e) => {
    const value = e.target.value
    setTargetHost(value)
    setHostError(validateHost(value))
  }

  const normalizeHost = (host) => {
    const trimmedHost = host.trim()
    
    // If it already has a protocol, return as is
    if (trimmedHost.match(/^https?:\/\//)) {
      return trimmedHost
    }
    
    // If it's an IP address or localhost, add http://
    if (trimmedHost.match(/^(localhost|127\.0\.0\.1|\d+\.\d+\.\d+\.\d+)/)) {
      return `http://${trimmedHost}`
    }
    
    // For domain names, add https://
    return `https://${trimmedHost}`
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    handleFileSelect(file)
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus('Please select a file first')
      return
    }

    // Validate file
    if (selectedFile.size === 0) {
      setUploadStatus('❌ Selected file is empty')
      return
    }

    if (selectedFile.size > 50 * 1024 * 1024) { // 50MB limit
      setUploadStatus('❌ File size too large (max 50MB)')
      return
    }

    // Double-check file is still valid
    if (!selectedFile.name || selectedFile.size === undefined) {
      setUploadStatus('❌ File appears to be corrupted, please select again')
      return
    }

    setUploading(true)
    setUploadStatus('')

    const formData = new FormData()
    formData.append('file', selectedFile)

    // Debug logging
    console.log('Uploading file:', selectedFile.name, 'Size:', selectedFile.size, 'Type:', selectedFile.type)
    console.log('FormData entries:', Array.from(formData.entries()))
    console.log('File object before upload:', selectedFile)

    try {
      const response = await axios.post(API_ENDPOINTS.UPLOAD, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      setUploadStatus(`✅ Upload successful! Response: ${JSON.stringify(response.data)}`)
      // Don't clear the file immediately - let user decide
      // setSelectedFile(null)
      // Reset file input
      // const fileInput = document.getElementById('file-upload')
      // if (fileInput) fileInput.value = ''
    } catch (error) {
      console.error('Upload error:', error)
      console.error('Error response:', error.response?.data)
      setUploadStatus(`❌ Upload failed: ${error.response?.data?.detail?.[0]?.msg || error.response?.data?.message || error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleConvert = async () => {
    if (!selectedFile) {
      setConvertStatus('❌ Please upload a file first')
      return
    }

    setConverting(true)
    setConvertStatus('')

    try {
      const convertPayload = {
        // You can add any parameters needed for conversion
        filename: scriptFilename || 'temp_script', // Pass filename if available
        timestamp: new Date().toISOString()
      }
      
      console.log('Sending convert request with payload:', convertPayload)
      
      const response = await axios.post(API_ENDPOINTS.CONVERT, convertPayload)
      
      // Extract the flow_data from the convert response
      const flowData = response.data.flow_data
      
      if (!flowData) {
        setConvertStatus('❌ Convert failed: No flow_data found in response')
        return
      }
      
      // Store the extracted flow data for use in generate
      setFlowData(flowData)
      setConvertStatus(`✅ Convert successful! Flow data ready for generation`)
    } catch (error) {
      console.error('Convert error:', error)
      setConvertStatus(`❌ Convert failed: ${error.response?.data?.detail?.[0]?.msg || error.response?.data?.message || error.message}`)
    } finally {
      setConverting(false)
    }
  }

  const handleGenerate = async () => {
    if (!flowData) {
      setGenerateStatus('❌ Please convert the file first to get flow data')
      return
    }

    // Validate filename
    const filenameValidation = validateFilename(scriptFilename)
    if (filenameValidation) {
      setFilenameError(filenameValidation)
      setGenerateStatus('❌ Please fix filename errors before generating')
      return
    }

    // Validate host
    const hostValidation = validateHost(targetHost)
    if (hostValidation) {
      setHostError(hostValidation)
      setGenerateStatus('❌ Please fix host errors before generating')
      return
    }

    setGenerating(true)
    setGenerateStatus('')
    setGeneratedScript(null)
    setFilenameError('')
    setHostError('')

    try {
      const normalizedHost = normalizeHost(targetHost)
      
      const generatePayload = {
        // Send the flow data directly (already extracted from convert response)
        ...flowData,
        filename: scriptFilename, // Include custom filename
        host: normalizedHost, // Include normalized target host
        replace_existing: true, // Allow replacing existing files
        timestamp: new Date().toISOString(),
        type: 'load_test'
      }
      
      console.log('Sending generate request with payload:', generatePayload)
      console.log('Filename being sent:', scriptFilename)
      console.log('Original host:', targetHost)
      console.log('Normalized host:', normalizedHost)
      
      const response = await axios.post(API_ENDPOINTS.GENERATE, generatePayload)
      
      // Extract script filename from response
      const responseFilename = response.data?.filename || response.data?.script_name || response.data?.file || scriptFilename
      setGeneratedScript(responseFilename)
      setGenerateStatus(`✅ Generate successful! Script created: ${responseFilename}`)
    } catch (error) {
      console.error('Generate error:', error)
      setGenerateStatus(`❌ Generate failed: ${error.response?.data?.detail?.[0]?.msg || error.response?.data?.message || error.message}`)
    } finally {
      setGenerating(false)
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    setUploadStatus('')
    setConvertStatus('')
    setGenerateStatus('')
    setGeneratedScript(null)
    setFlowData(null)
    setScriptFilename('')
    setFilenameError('')
    setTargetHost('')
    setHostError('')
    const fileInput = document.getElementById('file-upload')
    if (fileInput) fileInput.value = ''
  }

  const handleRunScript = async () => {
    if (generatedScript) {
      try {
        console.log('Running script with filename:', generatedScript)
        
        // Call the /run endpoint with the script filename
        const response = await axios.get(`${API_ENDPOINTS.RUN}?script=${encodeURIComponent(generatedScript)}`)
        
        // Open Locust UI in a new tab
        const locustUrl = response.data?.ui_url || response.data?.url || 'http://localhost:8089'
        window.open(locustUrl, '_blank')
        
        // Update status to show script is running
        setGenerateStatus(`🚀 Script running! Locust UI opened: ${generatedScript}`)
      } catch (error) {
        console.error('Run script error:', error)
        setGenerateStatus(`❌ Failed to run script: ${error.response?.data?.message || error.message}`)
      }
    }
  }

  const testFileUpload = () => {
    console.log('Current selectedFile state:', selectedFile)
    console.log('File input element:', document.getElementById('file-upload'))
    console.log('File input files:', document.getElementById('file-upload')?.files)
  }

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <div className="space-y-4">
        {/* File Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? 'border-blue-400 bg-blue-50'
              : selectedFile
              ? 'border-green-400 bg-green-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            id="file-upload"
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileChange}
            accept="*/*"
          />
          
          <div className="space-y-2">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            
            <div className="text-sm text-gray-600">
              <span className="font-medium text-blue-600 hover:text-blue-500">
                Click to upload
              </span>
              {' '}or drag and drop
            </div>
            <p className="text-xs text-gray-500">Any file type supported</p>
          </div>
        </div>

        {/* Selected File Display */}
        {selectedFile && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button
                onClick={removeFile}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Debug Button - Remove in production */}
        <div className="flex space-x-2">
          <button
            onClick={testFileUpload}
            className="flex-1 py-2 px-4 rounded-md font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200 text-sm"
          >
            Debug File State
          </button>
          <button
            onClick={() => {
              setSelectedFile(null)
              setFlowData(null)
              setGeneratedScript(null)
              setScriptFilename('')
              setFilenameError('')
              setTargetHost('')
              setHostError('')
              const fileInput = document.getElementById('file-upload')
              if (fileInput) fileInput.value = ''
              setUploadStatus('')
              setConvertStatus('')
              setGenerateStatus('')
            }}
            className="flex-1 py-2 px-4 rounded-md font-medium bg-red-100 text-red-800 hover:bg-red-200 text-sm"
          >
            Clear File
          </button>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
              !selectedFile || uploading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
          >
            {uploading ? (
              <div className="flex items-center justify-center space-x-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Uploading...</span>
              </div>
            ) : (
              'Upload File'
            )}
          </button>

          {/* Convert Button */}
          <button
            onClick={handleConvert}
            disabled={converting || !selectedFile}
            className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
              converting || !selectedFile
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
            }`}
          >
            {converting ? (
              <div className="flex items-center justify-center space-x-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Converting...</span>
              </div>
            ) : (
              'Convert'
            )}
          </button>

          {/* Filename Input */}
          {flowData && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Script Filename
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={scriptFilename}
                  onChange={handleFilenameChange}
                  placeholder="Enter filename (no spaces)"
                  className={`flex-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    filenameError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                  }`}
                />
                <div className="text-sm text-gray-500 flex items-center">
                  .py
                </div>
              </div>
              {filenameError && (
                <p className="text-sm text-red-600">{filenameError}</p>
              )}
              <p className="text-xs text-gray-500">
                Filename will be used to create the Locust script. Existing files with the same name will be replaced.
              </p>
            </div>
          )}

          {/* Host Input */}
          {flowData && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Target Host
              </label>
              <input
                type="text"
                value={targetHost}
                onChange={handleHostChange}
                placeholder="Enter target server (e.g., api.example.com, https://api.example.com, 192.168.1.100, localhost:3000)"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  hostError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                }`}
              />
              {hostError && (
                <p className="text-sm text-red-600">{hostError}</p>
              )}
              <p className="text-xs text-gray-500">
                The target server where the load test will be performed. Protocol will be added automatically if not provided (https for domains, http for IPs/localhost).
              </p>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating || !flowData || !scriptFilename.trim() || !!filenameError || !targetHost.trim() || !!hostError}
            className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
              generating || !flowData || !scriptFilename.trim() || !!filenameError || !targetHost.trim() || !!hostError
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'
            }`}
          >
            {generating ? (
              <div className="flex items-center justify-center space-x-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Generating...</span>
              </div>
            ) : (
              'Generate'
            )}
          </button>
        </div>

        {/* Status Messages */}
        {uploadStatus && (
          <div className={`p-3 rounded-md text-sm ${
            uploadStatus.startsWith('✅') 
              ? 'bg-green-50 text-green-800 border border-green-200'
              : uploadStatus.startsWith('❌')
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
          }`}>
            {uploadStatus}
          </div>
        )}

        {convertStatus && (
          <div className={`p-3 rounded-md text-sm ${
            convertStatus.startsWith('✅') 
              ? 'bg-green-50 text-green-800 border border-green-200'
              : convertStatus.startsWith('❌')
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
          }`}>
            {convertStatus}
          </div>
        )}

        {generateStatus && (
          <div className={`p-3 rounded-md text-sm ${
            generateStatus.startsWith('✅') 
              ? 'bg-green-50 text-green-800 border border-green-200'
              : generateStatus.startsWith('❌')
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
          }`}>
            {generateStatus}
          </div>
        )}

        {/* Generated Script Display */}
        {generatedScript && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <svg className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-purple-900">Generated Script</p>
                  <p className="text-xs text-purple-600">Ready to run</p>
                </div>
              </div>
              <button
                onClick={handleRunScript}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
              >
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2z" />
                </svg>
                Run Script
              </button>
            </div>
            <div className="mt-3">
              <p className="text-sm text-purple-800 font-mono bg-purple-100 px-2 py-1 rounded border">
                {generatedScript}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FileUpload
