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
    } else {
      console.log('No file selected or file is null')
    }
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
      const response = await axios.post(API_ENDPOINTS.CONVERT, {
        // You can add any parameters needed for conversion
        timestamp: new Date().toISOString()
      })
      
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

    setGenerating(true)
    setGenerateStatus('')
    setGeneratedScript(null)

    try {
      const response = await axios.post(API_ENDPOINTS.GENERATE, {
        // Send the flow data directly (already extracted from convert response)
        ...flowData,
        timestamp: new Date().toISOString(),
        type: 'load_test'
      })
      
      // Extract script filename from response
      const scriptFilename = response.data?.filename || response.data?.script_name || response.data?.file || 'generated_script.py'
      setGeneratedScript(scriptFilename)
      setGenerateStatus(`✅ Generate successful! Script created: ${scriptFilename}`)
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
    const fileInput = document.getElementById('file-upload')
    if (fileInput) fileInput.value = ''
  }

  const handleRunScript = async () => {
    if (generatedScript) {
      try {
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

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating || !flowData}
            className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
              generating || !flowData
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
