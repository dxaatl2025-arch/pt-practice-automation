// client/src/pages/PropertyList.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const PropertyList = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await axios.get('/api/properties');
      setProperties(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch properties:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="page-container">Loading properties...</div>;
  }

  return (
    <div className="page-container">
      <h1>Properties</h1>
      <div className="property-grid">
        {properties.map(property => (
          <div key={property.id} className="property-card">
            <h3>{property.title || property.addressStreet}</h3>
            <p>{property.addressCity}, {property.addressState}</p>
            <p>${property.rentAmount || property.rent}/month</p>
            <Link to={`/properties/${property.id}`} className="btn btn-primary">
              View Details
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PropertyList;