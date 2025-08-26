import React from 'react'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-blue-600 text-white p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">PropertyPulse</h1>
          <div className="space-x-4">
            <a href="/tenant" className="hover:underline">Tenant Profile</a>
            <a href="/property" className="hover:underline">Property Profile</a>
          </div>
        </div>
      </nav>
      
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome to PropertyPulse</h2>
          <p className="text-gray-600">Matching profiles system is ready!</p>
        </div>
      </div>
    </div>
  )
}

export default App