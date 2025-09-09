import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AIFeatures = ({ user }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [documents, setDocuments] = useState([]);
  const [leads, setLeads] = useState([]);
  const [aiStatus, setAiStatus] = useState('🔄 Checking AI services...');
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // AI Chat states
  const [chatSessions, setChatSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  
  // Leasing Agent states
  const [leadForm, setLeadForm] = useState({ email: '', firstName: '', message: '' });
  const [leasingResponse, setLeasingResponse] = useState(null);
  
  // Rent Optimizer states  
  const [selectedProperty, setSelectedProperty] = useState('');
  const [rentAnalysis, setRentAnalysis] = useState(null);
  const [optimizerGoal, setOptimizerGoal] = useState('maximize_revenue');

  const API_BASE = 'http://localhost:5000/api';

  useEffect(() => {
    checkAIServices();
    if (user) {
      loadInitialData();
    }
  }, [user]);

  const checkAIServices = async () => {
    try {
      const response = await axios.get(`${API_BASE}/ai/health`);
      if (response.data.success) {
        setAiStatus('✅ AI services ready');
      } else {
        setAiStatus('❌ AI services unavailable');
      }
    } catch (error) {
      setAiStatus('❌ AI services unavailable');
    }
  };

  const loadInitialData = async () => {
    try {
      // Load documents
      const docsResponse = await axios.get(`${API_BASE}/ai/documents`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setDocuments(docsResponse.data.data?.documents || []);

      // Load leads (if landlord)
      if (user.role === 'LANDLORD') {
        const leadsResponse = await axios.get(`${API_BASE}/ai/leasing/leads`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setLeads(leadsResponse.data.data?.leads || []);
      }

      // Load chat sessions
      const chatResponse = await axios.get(`${API_BASE}/ai/chat/sessions`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setChatSessions(chatResponse.data.data?.sessions || []);
      
    } catch (error) {
      console.error('Error loading AI data:', error);
    }
  };

  // Document Upload Handler
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('document', file);

    try {
      setUploadProgress(10);
      const response = await axios.post(`${API_BASE}/ai/documents/upload`, formData, {
        headers: { 
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });

      if (response.data.success) {
        setDocuments(prev => [...prev, response.data.data.document]);
        alert('Document uploaded successfully!');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setUploadProgress(0);
    }
  };

  // AI Chat Handler
  const sendChatMessage = async () => {
    if (!chatMessage.trim()) return;

    try {
      const response = await axios.post(`${API_BASE}/ai/chat`, {
        message: chatMessage,
        sessionId: currentSession
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      if (response.data.success) {
        const { sessionId, message: aiResponse } = response.data.data;
        setCurrentSession(sessionId);
        setChatHistory(prev => [
          ...prev,
          { role: 'user', content: chatMessage },
          { role: 'assistant', content: aiResponse }
        ]);
        setChatMessage('');
      }
    } catch (error) {
      console.error('Chat error:', error);
      alert('Chat failed: ' + (error.response?.data?.error || error.message));
    }
  };

  // Leasing Agent Handler
  const createLead = async () => {
    try {
      const response = await axios.post(`${API_BASE}/ai/leasing/lead`, leadForm);
      
      if (response.data.success) {
        setLeasingResponse(response.data.data);
        setLeadForm({ email: '', firstName: '', message: '' });
        loadInitialData(); // Refresh leads
      }
    } catch (error) {
      console.error('Lead creation error:', error);
      alert('Lead creation failed: ' + (error.response?.data?.error || error.message));
    }
  };

  // Rent Optimizer Handler
  const analyzeRent = async () => {
    if (!selectedProperty) {
      alert('Please select a property first');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/ai/rent/analyze/${selectedProperty}`, {
        goal: optimizerGoal
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      if (response.data.success) {
        setRentAnalysis(response.data.data);
      }
    } catch (error) {
      console.error('Rent analysis error:', error);
      alert('Analysis failed: ' + (error.response?.data?.error || error.message));
    }
  };

  const renderOverview = () => (
    <div className="ai-overview">
      <h2>🤖 AI Features Overview</h2>
      <div className="status-card">
        <h3>Service Status</h3>
        <p>{aiStatus}</p>
      </div>
      
      <div className="feature-grid">
        <div className="feature-card" onClick={() => setActiveTab('documents')}>
          <h3>📄 Document Search & AI Chat</h3>
          <p>{documents.length} documents uploaded</p>
          <p>{chatSessions.length} chat sessions</p>
        </div>
        
        {user?.role === 'LANDLORD' && (
          <>
            <div className="feature-card" onClick={() => setActiveTab('leasing')}>
              <h3>👩‍💼 AI Leasing Agent "Sienna"</h3>
              <p>{leads.length} leads managed</p>
            </div>
            
            <div className="feature-card" onClick={() => setActiveTab('optimizer')}>
              <h3>💰 AI Rent Optimizer</h3>
              <p>Optimize property rents</p>
            </div>
            
            <div className="feature-card" onClick={() => setActiveTab('analytics')}>
              <h3>📊 AI Analytics</h3>
              <p>Turnover prediction & forecasting</p>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderDocuments = () => (
    <div className="ai-documents">
      <h2>📄 Document Search & AI Chat</h2>
      
      <div className="upload-section">
        <h3>Upload Documents</h3>
        <input type="file" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.txt" />
        {uploadProgress > 0 && (
          <div className="progress-bar">
            <div className="progress-fill" style={{width: `${uploadProgress}%`}}></div>
          </div>
        )}
      </div>

      <div className="documents-list">
        <h3>Your Documents ({documents.length})</h3>
        {documents.map(doc => (
          <div key={doc.id} className="document-item">
            <span>{doc.originalName}</span>
            <span className="file-size">{Math.round(doc.size / 1024)}KB</span>
          </div>
        ))}
      </div>

      <div className="chat-section">
        <h3>💬 AI Assistant Chat</h3>
        <div className="chat-history">
          {chatHistory.map((msg, idx) => (
            <div key={idx} className={`chat-message ${msg.role}`}>
              <strong>{msg.role === 'user' ? 'You' : 'AI Assistant'}:</strong>
              <p>{msg.content}</p>
            </div>
          ))}
        </div>
        <div className="chat-input">
          <input 
            type="text" 
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            placeholder="Ask me anything about your documents..."
            onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
          />
          <button onClick={sendChatMessage}>Send</button>
        </div>
      </div>
    </div>
  );

  const renderLeasing = () => (
    <div className="ai-leasing">
      <h2>👩‍💼 AI Leasing Agent "Sienna"</h2>
      
      <div className="lead-creation">
        <h3>Create New Lead</h3>
        <input 
          type="email" 
          placeholder="Email"
          value={leadForm.email}
          onChange={(e) => setLeadForm({...leadForm, email: e.target.value})}
        />
        <input 
          type="text" 
          placeholder="First Name"
          value={leadForm.firstName}
          onChange={(e) => setLeadForm({...leadForm, firstName: e.target.value})}
        />
        <textarea 
          placeholder="Initial message from prospect..."
          value={leadForm.message}
          onChange={(e) => setLeadForm({...leadForm, message: e.target.value})}
        />
        <button onClick={createLead}>Create Lead</button>
      </div>

      {leasingResponse && (
        <div className="leasing-response">
          <h3>AI Analysis</h3>
          <p><strong>Lead Score:</strong> {leasingResponse.leadScore}/100</p>
          <p><strong>Temperature:</strong> {leasingResponse.temperature}</p>
          <div><strong>AI Response:</strong> {leasingResponse.response}</div>
        </div>
      )}

      <div className="leads-list">
        <h3>Leads ({leads.length})</h3>
        {leads.map(lead => (
          <div key={lead.id} className="lead-item">
            <span>{lead.firstName} {lead.lastName}</span>
            <span>{lead.email}</span>
            <span className={`temperature ${lead.temperature.toLowerCase()}`}>
              {lead.temperature}
            </span>
            <span>Score: {lead.score}/100</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderOptimizer = () => (
    <div className="ai-optimizer">
      <h2>💰 AI Rent Optimizer</h2>
      
      <div className="optimizer-controls">
        <select 
          value={selectedProperty}
          onChange={(e) => setSelectedProperty(e.target.value)}
        >
          <option value="">Select a property...</option>
          {/* This would be populated with user's properties */}
          <option value="cmfbfs3k40002u6b0f3impejv">Test Property</option>
        </select>
        
        <select 
          value={optimizerGoal}
          onChange={(e) => setOptimizerGoal(e.target.value)}
        >
          <option value="maximize_revenue">Maximize Revenue</option>
          <option value="maintain_occupancy">Maintain Occupancy</option>
          <option value="balanced">Balanced Approach</option>
        </select>
        
        <button onClick={analyzeRent}>Analyze Rent</button>
      </div>

      {rentAnalysis && (
        <div className="rent-analysis">
          <h3>💡 AI Recommendations</h3>
          <div className="analysis-grid">
            <div className="metric">
              <strong>Suggested Rent:</strong> ${rentAnalysis.analysis?.suggestedRent || 'N/A'}
            </div>
            <div className="metric">
              <strong>Confidence:</strong> {rentAnalysis.analysis?.confidence || 'N/A'}
            </div>
            <div className="metric">
              <strong>Monthly Increase:</strong> ${rentAnalysis.metrics?.monthlyIncrease || 'N/A'}
            </div>
            <div className="metric">
              <strong>Annual Impact:</strong> ${rentAnalysis.metrics?.annualIncrease || 'N/A'}
            </div>
          </div>
          <div className="recommendations">
            <h4>Recommendations:</h4>
            {rentAnalysis.recommendations?.map((rec, idx) => (
              <p key={idx}>• {rec}</p>
            )) || <p>No specific recommendations available.</p>}
          </div>
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => (
    <div className="ai-analytics">
      <h2>📊 AI Analytics Dashboard</h2>
      <div className="coming-soon">
        <p>🚧 Turnover Predictor and Forecasting tools coming soon!</p>
        <p>These features will help predict tenant retention and forecast revenue.</p>
      </div>
    </div>
  );

  return (
    <div className="ai-features-container">
      <nav className="ai-nav">
        <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={activeTab === 'documents' ? 'active' : ''} onClick={() => setActiveTab('documents')}>Documents & Chat</button>
        {user?.role === 'LANDLORD' && (
          <>
            <button className={activeTab === 'leasing' ? 'active' : ''} onClick={() => setActiveTab('leasing')}>Leasing Agent</button>
            <button className={activeTab === 'optimizer' ? 'active' : ''} onClick={() => setActiveTab('optimizer')}>Rent Optimizer</button>
            <button className={activeTab === 'analytics' ? 'active' : ''} onClick={() => setActiveTab('analytics')}>Analytics</button>
          </>
        )}
      </nav>

      <div className="ai-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'documents' && renderDocuments()}
        {activeTab === 'leasing' && renderLeasing()}
        {activeTab === 'optimizer' && renderOptimizer()}
        {activeTab === 'analytics' && renderAnalytics()}
      </div>

      <style jsx>{`
        .ai-features-container {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .ai-nav {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          border-bottom: 1px solid #ddd;
        }
        .ai-nav button {
          padding: 10px 15px;
          border: none;
          background: #f5f5f5;
          cursor: pointer;
          border-radius: 5px 5px 0 0;
        }
        .ai-nav button.active {
          background: #2563eb;
          color: white;
        }
        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        .feature-card, .status-card {
          border: 1px solid #ddd;
          padding: 20px;
          border-radius: 8px;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .feature-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .upload-section, .chat-section, .lead-creation, .optimizer-controls {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .chat-history {
          max-height: 300px;
          overflow-y: auto;
          border: 1px solid #ddd;
          padding: 10px;
          margin: 10px 0;
        }
        .chat-message {
          margin: 10px 0;
          padding: 10px;
          border-radius: 5px;
        }
        .chat-message.user {
          background: #e3f2fd;
          text-align: right;
        }
        .chat-message.assistant {
          background: #f1f8e9;
        }
        .chat-input {
          display: flex;
          gap: 10px;
        }
        .chat-input input {
          flex: 1;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        .progress-bar {
          width: 100%;
          height: 20px;
          background: #f0f0f0;
          border-radius: 10px;
          overflow: hidden;
          margin: 10px 0;
        }
        .progress-fill {
          height: 100%;
          background: #2563eb;
          transition: width 0.3s;
        }
        .document-item, .lead-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          border-bottom: 1px solid #eee;
        }
        .temperature {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
        }
        .temperature.hot { background: #ffebee; color: #c62828; }
        .temperature.warm { background: #fff3e0; color: #ef6c00; }
        .temperature.cold { background: #e8f5e8; color: #2e7d32; }
        .analysis-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin: 15px 0;
        }
        .metric {
          background: white;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #2563eb;
        }
        input, select, textarea {
          width: 100%;
          padding: 10px;
          margin: 5px 0;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        button {
          background: #2563eb;
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 4px;
          cursor: pointer;
        }
        button:hover {
          background: #1d4ed8;
        }
      `}</style>
    </div>
  );
};

export default AIFeatures;