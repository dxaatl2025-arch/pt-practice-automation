import React, { useState } from 'react'

export default function PropertyProfilePage() {
  const [profile, setProfile] = useState({
    rent: 0,
    beds: 0,
    baths: 0,
    petPolicy: '',
    amenities: [] as string[],
    parking: false,
    termMonths: 12
  })

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="bg-green-600 px-6 py-4">
          <h1 className="text-2xl font-bold text-white">Property Match Profile</h1>
          <p className="text-green-100">Set your property preferences for tenant matching</p>
        </div>

        <div className="p-6">
          <p className="text-gray-600">Property matching profile coming soon...</p>
        </div>
      </div>
    </div>
  )
}