import React from 'react'
import FileUpload from './components/FileUpload'
import ScriptsList from './components/ScriptsList'
import HealthCheck from './components/HealthCheck'
import TestMonitor from './components/TestMonitor'

function App() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <div></div>
            <h1 className="text-3xl font-bold text-gray-900">
              Locust Load Testing
            </h1>
            <HealthCheck />
          </div>
          <p className="text-gray-600">
            Upload HAR files, generate Locust scripts, and run load tests
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload & Generate</h2>
            <FileUpload />
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Scripts</h2>
            <ScriptsList />
          </div>
        </div>

        <div className="mb-8">
          <TestMonitor />
        </div>
      </div>
    </div>
  )
}

export default App
