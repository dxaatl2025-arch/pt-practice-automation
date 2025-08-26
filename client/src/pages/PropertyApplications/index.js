import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PropertyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState('');

  useEffect(() => {
    if (selectedProperty) {
      fetchApplications();
    }
  }, [selectedProperty]);

  const fetchApplications = async () => {
    try {
      const response = await axios.get(`/api/applications?propertyId=${selectedProperty}`);
      setApplications(response.data.data);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    }
  };

  const updateStatus = async (applicationId, status) => {
    try {
      await axios.patch(`/api/applications/${applicationId}/status`, { status });
      fetchApplications(); // Refresh
      alert(`Application ${status.toLowerCase()}`);
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const downloadPdf = async (applicationId) => {
    try {
      const response = await axios.get(`/api/applications/${applicationId}/pdf`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `application-${applicationId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Failed to download PDF');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Property Applications</h1>
      
      <select 
        value={selectedProperty}
        onChange={(e) => setSelectedProperty(e.target.value)}
        className="mb-4 p-2 border rounded"
      >
        <option value="">Select Property</option>
        {/* TODO: Load properties from API */}
      </select>

      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">Applicant</th>
              <th className="px-6 py-3 text-left">Income</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map(app => (
              <tr key={app.id}>
                <td className="px-6 py-4">{app.firstName} {app.lastName}</td>
                <td className="px-6 py-4">${app.monthlyIncome}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    app.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    app.status === 'DECLINED' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {app.status}
                  </span>
                </td>
                <td className="px-6 py-4 space-x-2">
                  {app.status === 'PENDING' && (
                    <>
                      <button 
                        onClick={() => updateStatus(app.id, 'APPROVED')}
                        className="text-green-600 hover:text-green-900"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => updateStatus(app.id, 'DECLINED')}
                        className="text-red-600 hover:text-red-900"
                      >
                        Decline
                      </button>
                    </>
                  )}
                  <button 
                    onClick={() => downloadPdf(app.id)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PropertyApplications;