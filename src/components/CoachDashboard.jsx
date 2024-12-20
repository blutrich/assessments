import React, { useState, useEffect } from 'react';
import { fetchAllUsersData, fetchAssessmentsByEmail, updateUserNotes } from '../utils/airtable';
import { generateAIResponse } from '../utils/coachAI';
import ClimbingAnalysis from './ClimbingAnalysis';
import { Users, ChevronRight, ChevronDown, ChevronLeft, MessageSquare, Save, Edit2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

function CoachDashboard() {
  const [usersData, setUsersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [expandedUser, setExpandedUser] = useState(null);
  const [selectedUserAssessments, setSelectedUserAssessments] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [editingNotes, setEditingNotes] = useState(null);
  const [notesContent, setNotesContent] = useState('');
  const [isAITyping, setIsAITyping] = useState(false);

  useEffect(() => {
    const loadUsersData = async () => {
      try {
        const data = await fetchAllUsersData();
        setUsersData(data);
      } catch (err) {
        console.error('Error fetching users data:', err);
        setError('Failed to load users data');
      } finally {
        setLoading(false);
      }
    };

    loadUsersData();
  }, []);

  const handleViewFullAnalysis = async (email) => {
    try {
      setLoading(true);
      const assessments = await fetchAssessmentsByEmail(email);
      setSelectedUserAssessments(assessments);
      setSelectedUser(email);
    } catch (err) {
      console.error('Error fetching user assessments:', err);
      toast.error('Failed to load user assessments');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    // Add user message to chat
    const userMessage = {
      text: message,
      sender: 'coach',
      timestamp: new Date().toISOString()
    };
    setChatHistory(prev => [...prev, userMessage]);
    setMessage('');
    setIsAITyping(true);

    try {
      // Get selected user data if any user is expanded
      const userData = expandedUser ? usersData.find(u => u.email === expandedUser) : null;
      
      // Get AI response
      const aiResponseText = await generateAIResponse(message, userData);
      
      // Add AI response to chat
      const aiMessage = {
        text: aiResponseText,
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      setChatHistory(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast.error('Failed to get AI response');
    } finally {
      setIsAITyping(false);
    }
  };

  const handleEditNotes = (userData) => {
    setEditingNotes(userData.email);
    setNotesContent(userData.latestAssessment?.Notes?.['Coach Notes'] || '');
  };

  const handleSaveNotes = async (email) => {
    try {
      await updateUserNotes(email, notesContent);
      setEditingNotes(null);
      // Update the local state
      setUsersData(prevData => prevData.map(user => {
        if (user.email === email) {
          return {
            ...user,
            latestAssessment: {
              ...user.latestAssessment,
              Notes: {
                'Coach Notes': notesContent,
                'Last Updated': new Date().toISOString()
              }
            }
          };
        }
        return user;
      }));
      toast.success('Notes saved successfully');
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Failed to save notes');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-indigo-900 flex items-center gap-2">
            <Users className="text-indigo-500" />
            Coach Dashboard
          </h1>
          <button
            onClick={() => setShowChat(!showChat)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <MessageSquare size={20} />
            Coach AI Chat
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Users List */}
          <div className="lg:col-span-2">
            <div className={`bg-white rounded-lg shadow-lg p-6 ${selectedUser ? 'hidden' : ''}`}>
              <h1 className="text-2xl font-bold mb-6 text-indigo-900 flex items-center gap-2">
                <Users size={24} />
                Coach Dashboard
              </h1>

              <div className="grid grid-cols-1 gap-4">
                {usersData.map((userData) => (
                  <div key={userData.email} className="border rounded-lg p-4 bg-gray-50">
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedUser(expandedUser === userData.email ? null : userData.email)}
                    >
                      <div>
                        <h3 className="text-lg font-semibold text-indigo-900">
                          {userData.latestAssessment['Personal Info']['Name'] || 'Unnamed User'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {userData.email}
                        </p>
                        <p className="text-sm text-gray-500">
                          Last Assessment: {new Date(userData.lastAssessmentDate).toLocaleDateString()}
                        </p>
                      </div>
                      {expandedUser === userData.email ? (
                        <ChevronDown className="text-indigo-500" />
                      ) : (
                        <ChevronRight className="text-indigo-500" />
                      )}
                    </div>

                    {expandedUser === userData.email && (
                      <div className="mt-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="bg-white p-3 rounded-lg shadow-sm">
                            <div className="text-sm text-gray-600">Assessments</div>
                            <div className="text-lg font-bold text-indigo-900">{userData.assessmentCount}</div>
                          </div>
                          <div className="bg-white p-3 rounded-lg shadow-sm">
                            <div className="text-sm text-gray-600">Latest Boulder Grade</div>
                            <div className="text-lg font-bold text-indigo-900">
                              {userData.latestAssessment['Boulder 80% Grade'] || 'N/A'}
                            </div>
                          </div>
                          <div className="bg-white p-3 rounded-lg shadow-sm">
                            <div className="text-sm text-gray-600">Latest Lead Grade</div>
                            <div className="text-lg font-bold text-indigo-900">
                              {userData.latestAssessment['Lead 80% Grade'] || 'N/A'}
                            </div>
                          </div>
                          <div className="bg-white p-3 rounded-lg shadow-sm">
                            <div className="text-sm text-gray-600">Last Assessment</div>
                            <div className="text-lg font-bold text-indigo-900">
                              {new Date(userData.lastAssessmentDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4 bg-white p-4 rounded-lg shadow-sm">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-semibold text-gray-700">Coach Notes</h4>
                            {editingNotes === userData.email ? (
                              <button
                                onClick={() => handleSaveNotes(userData.email)}
                                className="text-green-600 hover:text-green-700 flex items-center gap-1"
                              >
                                <Save size={16} />
                                Save
                              </button>
                            ) : (
                              <button
                                onClick={() => handleEditNotes(userData)}
                                className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                              >
                                <Edit2 size={16} />
                                Edit
                              </button>
                            )}
                          </div>
                          
                          {editingNotes === userData.email ? (
                            <textarea
                              value={notesContent}
                              onChange={(e) => setNotesContent(e.target.value)}
                              className="w-full h-32 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="Add your notes here..."
                            />
                          ) : (
                            <div className="min-h-[4rem] text-gray-600">
                              {userData.latestAssessment?.Notes?.['Coach Notes'] ? (
                                <>
                                  <p className="whitespace-pre-wrap">{userData.latestAssessment.Notes['Coach Notes']}</p>
                                  <p className="text-xs text-gray-400 mt-2">
                                    Last updated: {new Date().toLocaleString()}
                                  </p>
                                </>
                              ) : (
                                <p className="text-gray-400 italic">No notes added yet</p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* User Notes Section */}
                        <div className="mt-4 bg-white p-4 rounded-lg shadow-sm">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-semibold text-gray-700">User Notes & Requests</h4>
                          </div>
                          <div className="text-gray-600">
                            {userData.latestAssessment?.Notes?.['User Notes'] ? (
                              <p className="whitespace-pre-wrap">{userData.latestAssessment.Notes['User Notes']}</p>
                            ) : (
                              <p className="text-gray-400 italic">No user notes available</p>
                            )}
                          </div>
                        </div>
                        
                        <button
                          className="w-full mt-4 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewFullAnalysis(userData.email);
                          }}
                        >
                          View Full Analysis
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {selectedUser && (
              <div className="mt-8">
                <button
                  className="mb-4 text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  onClick={() => {
                    setSelectedUser(null);
                    setSelectedUserAssessments([]);
                  }}
                >
                  <ChevronLeft size={20} />
                  Back to All Users
                </button>
                <ClimbingAnalysis 
                  assessments={selectedUserAssessments}
                  isCoach={true}
                />
              </div>
            )}
          </div>

          {/* AI Chat Panel */}
          {showChat && (
            <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 h-[calc(100vh-2rem)] flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-indigo-900 flex items-center gap-2">
                  <MessageSquare className="text-indigo-500" />
                  Coach AI Assistant
                </h2>
                {expandedUser && (
                  <p className="text-sm text-gray-500 mt-1">
                    Analyzing data for: {usersData.find(u => u.email === expandedUser)?.latestAssessment['Personal Info']['Name']}
                  </p>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatHistory.length === 0 ? (
                  <div className="text-center text-gray-500 mt-4">
                    <p>Welcome to the Coach AI Assistant!</p>
                    <p className="text-sm mt-2">Ask me about:</p>
                    <ul className="text-sm mt-1 space-y-1">
                      <li>• Athlete performance analysis</li>
                      <li>• Training recommendations</li>
                      <li>• Goal progression</li>
                      <li>• Technique improvements</li>
                    </ul>
                  </div>
                ) : (
                  chatHistory.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.sender === 'coach' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.sender === 'coach'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                        <span className="text-xs opacity-75 mt-1 block">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                {isAITyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-900 rounded-lg p-3">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isAITyping && handleSendMessage()}
                    placeholder="Ask about athlete performance..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isAITyping}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isAITyping || !message.trim()}
                    className={`px-4 py-2 bg-indigo-600 text-white rounded-lg transition-colors ${
                      isAITyping || !message.trim() 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:bg-indigo-700'
                    }`}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CoachDashboard;
