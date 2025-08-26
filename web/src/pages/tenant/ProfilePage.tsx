import React, { useState, useEffect } from 'react'

interface TenantProfile {
  id?: string
  budgetMin?: number
  budgetMax?: number
  beds?: number
  baths?: number
  pets?: string[]
  smoker?: boolean
  locations?: string[]
  vehicle?: boolean
  householdSize?: number
  mustHaves?: string[]
  noGos?: string[]
}

export default function TenantProfilePage() {
  const [profile, setProfile] = useState<TenantProfile>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newLocation, setNewLocation] = useState('')
  const [newMustHave, setNewMustHave] = useState('')
  const [newNoGo, setNewNoGo] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      // For demo, use the debug endpoint
      const response = await fetch('/api/profiles/debug-auth')
      
      if (response.ok) {
        const data = await response.json()
        setProfile(data.data || {})
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/profiles/debug-auth', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profile)
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data.data)
        alert('Profile saved successfully!')
      } else {
        alert('Failed to save profile')
      }
    } catch (error) {
      console.error('Failed to save profile:', error)
      alert('Error saving profile')
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: keyof TenantProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  const addToArray = (field: 'pets' | 'locations' | 'mustHaves' | 'noGos', value: string) => {
    if (value.trim()) {
      updateField(field, [...(profile[field] || []), value.trim()])
    }
  }

  const removeFromArray = (field: 'pets' | 'locations' | 'mustHaves' | 'noGos', index: number) => {
    const array = profile[field] || []
    updateField(field, array.filter((_, i) => i !== index))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="bg-blue-600 px-6 py-4">
          <h1 className="text-2xl font-bold text-white">My Rental Profile</h1>
          <p className="text-blue-100">Tell us what you're looking for in your next home</p>
        </div>

        <form onSubmit={saveProfile} className="p-6 space-y-8">
          {/* Budget Section */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Budget Range</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Budget ($)
                </label>
                <input
                  type="number"
                  value={profile.budgetMin || ''}
                  onChange={(e) => updateField('budgetMin', parseInt(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Budget ($)
                </label>
                <input
                  type="number"
                  value={profile.budgetMax || ''}
                  onChange={(e) => updateField('budgetMax', parseInt(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="2500"
                />
              </div>
            </div>
          </section>

          {/* Property Preferences */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Property Preferences</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
                <select
                  value={profile.beds || ''}
                  onChange={(e) => updateField('beds', parseInt(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any</option>
                  {[1,2,3,4,5].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
                <select
                  value={profile.baths || ''}
                  onChange={(e) => updateField('baths', parseInt(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any</option>
                  {[1,1.5,2,2.5,3,3.5,4].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Household Size</label>
                <input
                  type="number"
                  value={profile.householdSize || ''}
                  onChange={(e) => updateField('householdSize', parseInt(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="2"
                  min="1"
                  max="20"
                />
              </div>
            </div>
          </section>

          {/* Lifestyle */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Lifestyle</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={profile.smoker || false}
                  onChange={(e) => updateField('smoker', e.target.checked)}
                  className="mr-2"
                />
                I am a smoker
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={profile.vehicle || false}
                  onChange={(e) => updateField('vehicle', e.target.checked)}
                  className="mr-2"
                />
                I have a vehicle
              </label>
            </div>
          </section>

          {/* Locations */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Preferred Locations</h2>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="Add a location (e.g., Atlanta, Buckhead)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addToArray('locations', newLocation)
                      setNewLocation('')
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    addToArray('locations', newLocation)
                    setNewLocation('')
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(profile.locations || []).map((location, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    {location}
                    <button
                      type="button"
                      onClick={() => removeFromArray('locations', index)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Must Haves */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Must Haves</h2>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMustHave}
                  onChange={(e) => setNewMustHave(e.target.value)}
                  placeholder="Add a requirement (e.g., parking, gym, pool)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addToArray('mustHaves', newMustHave)
                      setNewMustHave('')
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    addToArray('mustHaves', newMustHave)
                    setNewMustHave('')
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(profile.mustHaves || []).map((item, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => removeFromArray('mustHaves', index)}
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* No-Gos */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Deal Breakers</h2>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNoGo}
                  onChange={(e) => setNewNoGo(e.target.value)}
                  placeholder="Add a deal breaker (e.g., smoking, no pets)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addToArray('noGos', newNoGo)
                      setNewNoGo('')
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    addToArray('noGos', newNoGo)
                    setNewNoGo('')
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(profile.noGos || []).map((item, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => removeFromArray('noGos', index)}
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}