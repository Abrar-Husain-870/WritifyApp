import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import { API } from '../utils/api';
import { GuestContext } from '../App';

interface Client {
    id: number;
    name: string;
    rating: number | string;
    total_ratings: number;
}

interface AssignmentRequest {
    id: number;
    client: Client;
    course_name: string;
    course_code: string;
    assignment_type: string;
    num_pages: number;
    deadline: string;
    expiration_deadline: string;
    estimated_cost: number;
    status: 'open' | 'assigned' | 'completed';
    created_at: string;
}

const BrowseRequests: React.FC = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState<AssignmentRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [acceptingId, setAcceptingId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<number | null>(null);
    const [guestActionAttempt, setGuestActionAttempt] = useState<number | null>(null);

    const { isGuest } = useContext(GuestContext);

    useEffect(() => {
        if (isGuest) {
            // For guest users, provide sample assignment requests
            const sampleRequests: AssignmentRequest[] = [
                {
                    id: 2001,
                    client: {
                        id: 3001,
                        name: 'Sample Client 1',
                        rating: 4.2,
                        total_ratings: 5
                    },
                    course_name: 'Introduction to Computer Science',
                    course_code: 'CS101',
                    assignment_type: 'Essay',
                    num_pages: 5,
                    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    expiration_deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                    estimated_cost: 50,
                    status: 'open',
                    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
                },
                {
                    id: 2002,
                    client: {
                        id: 3002,
                        name: 'Sample Client 2',
                        rating: 4.5,
                        total_ratings: 12
                    },
                    course_name: 'Business Ethics',
                    course_code: 'BUS205',
                    assignment_type: 'Research Paper',
                    num_pages: 8,
                    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
                    expiration_deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                    estimated_cost: 80,
                    status: 'open',
                    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
                },
                {
                    id: 2003,
                    client: {
                        id: 3003,
                        name: 'Sample Client 3',
                        rating: 4.8,
                        total_ratings: 8
                    },
                    course_name: 'Advanced Database Systems',
                    course_code: 'CS305',
                    assignment_type: 'Programming Assignment',
                    num_pages: 3,
                    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
                    expiration_deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
                    estimated_cost: 100,
                    status: 'open',
                    created_at: new Date().toISOString()
                }
            ];
            setRequests(sampleRequests);
            setCurrentUserId(1000); // Dummy ID for guest
            setLoading(false);
        } else {
            // For registered users, fetch real data
            // Fetch the current user's profile to get their ID
            fetch(API.users.profile, {
                credentials: 'include'
            })
            .then(res => {
                if (res.ok) {
                    return res.json();
                }
                throw new Error('Failed to fetch user profile');
            })
            .then(data => {
                setCurrentUserId(data.id);
            })
            .catch(err => {
                console.error('Error fetching user profile:', err);
            })
            .finally(() => {
                // Fetch assignment requests
                console.log('Fetching assignment requests from:', API.assignmentRequests.all);
                fetch(API.assignmentRequests.all, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                })
                .then(res => {
                    if (!res.ok) {
                        console.error(`Assignment requests fetch failed with status: ${res.status}`);
                        return res.text().then(text => {
                            console.error('Error response text:', text);
                            throw new Error(`HTTP error! Status: ${res.status}`);
                        });
                    }
                    return res.json();
                })
                .then(data => {
                    console.log('Assignment requests data received:', data);
                    if (data && Array.isArray(data.requests)) {
                        setRequests(data.requests);
                    } else if (data && Array.isArray(data)) {
                        // Handle case where API returns array directly
                        setRequests(data);
                    } else {
                        console.warn('Unexpected assignment requests data format:', data);
                        setRequests([]);
                    }
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Error fetching requests:', err);
                    setLoading(false);
                    setError('Failed to load assignment requests. Please try again later.');
                });
            });
        }
    }, [isGuest]);

    const getAssignmentTypeIcon = (type: string) => {
        switch (type) {
            case 'class_assignment':
                return (
                    <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                );
            case 'lab_files':
                return (
                    <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                );
            case 'graphic_design':
                return (
                    <svg className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                );
            case 'workshop_files':
                return (
                    <svg className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                );
            default:
                return null;
        }
    };

    const formatAssignmentType = (type: string) => {
        return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const handleAcceptRequest = async (requestId: number) => {
        setAcceptingId(requestId);
        setError(null);

        if (isGuest) {
            // For guest users, show an inline message that they need to sign in
            setGuestActionAttempt(requestId);
            setAcceptingId(null);
            return;
        }

        try {
            const response = await fetch(API.assignmentRequests.accept(requestId), {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            
            // Remove the accepted request from the list
            setRequests(requests.filter(req => req.id !== requestId));
            
            // Navigate to the assignments page
            navigate('/my-assignments');
        } catch (error) {
            console.error('Error accepting request:', error);
            setError('Failed to accept assignment request. Please try again.');
        } finally {
            setAcceptingId(null);
        }
    };

    const handleDeleteRequest = async (requestId: number) => {
        try {
            setDeletingId(requestId);
            const response = await fetch(API.assignmentRequests.delete(requestId), {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                // Remove the deleted request from the state
                setRequests(prevRequests => prevRequests.filter(req => req.id !== requestId));
                setShowDeleteConfirmation(null);
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.error || 'Failed to delete request'}`);
            }
        } catch (error) {
            console.error('Error deleting request:', error);
            alert('Failed to delete request. Please try again.');
        } finally {
            setDeletingId(null);
        }
    };

    // Check if the current user is the client who created the request
    const isClientRequest = (request: AssignmentRequest) => {
        return currentUserId === request.client.id;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <Header title="Browse Requests" />

            {/* Main content */}
            <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                {loading ? (
                    <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : error ? (
                    <div className="col-span-full text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Requests</h3>
                        <p className="mt-1 text-sm text-gray-500">{error}</p>
                        <button 
                            onClick={() => window.location.reload()} 
                            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Try Again
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {requests.length === 0 ? (
                            <div className="col-span-full text-center py-12">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No assignment requests</h3>
                                <p className="mt-1 text-sm text-gray-500">There are no open assignment requests at the moment.</p>
                            </div>
                        ) : (
                            requests.map(request => (
                                <div key={request.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                                    <div className="p-6">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">{request.course_name}</h3>
                                                <p className="text-sm text-gray-600">{request.course_code}</p>
                                            </div>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {request.assignment_type}
                                            </span>
                                        </div>
                                        
                                        <div className="mt-4 space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-500">Pages:</span>
                                                <span className="text-sm font-medium text-gray-900">{request.num_pages}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-500">Deadline:</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {new Date(request.deadline).toLocaleDateString()} 
                                                    ({Math.ceil((new Date(request.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left)
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-500">Estimated Cost:</span>
                                                <span className="text-sm font-medium text-gray-900">₹{request.estimated_cost}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-500">Expires:</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {(() => {
                                                        // If expiration_deadline exists, use it
                                                        if (request.expiration_deadline) {
                                                            const expirationDate = new Date(request.expiration_deadline);
                                                            const daysLeft = Math.ceil((expirationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                                            return `${expirationDate.toLocaleDateString()} (${daysLeft} days)`;
                                                        }
                                                        
                                                        // Otherwise calculate it as 7 days from creation date
                                                        const creationDate = new Date(request.created_at);
                                                        const expirationDate = new Date(creationDate);
                                                        expirationDate.setDate(creationDate.getDate() + 7);
                                                        const daysLeft = Math.ceil((expirationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                                        return `${expirationDate.toLocaleDateString()} (${daysLeft} days)`;
                                                    })()}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <svg className="h-10 w-10 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                                                    </svg>
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {request.client.name}
                                                    </p>
                                                    <div className="flex items-center">
                                                        <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                        </svg>
                                                        <span className="ml-1 text-sm text-gray-500">
                                                            {request.client.rating 
                                                                ? (typeof request.client.rating === 'number' 
                                                                    ? request.client.rating.toFixed(1) 
                                                                    : parseFloat(String(request.client.rating)).toFixed(1))
                                                                : 'N/A'} ({request.client.total_ratings || 0})
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-6 space-y-2">
                                            {guestActionAttempt === request.id && isGuest && (
                                                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                                                    <p className="text-sm text-yellow-700 text-center">
                                                        Please <button 
                                                            onClick={() => {
                                                                sessionStorage.removeItem('GUEST_MODE');
                                                                window.location.href = '/login';
                                                            }} 
                                                            className="font-medium text-blue-600 hover:text-blue-800 underline"
                                                        >sign in</button> first to use this feature
                                                    </p>
                                                </div>
                                            )}
                                            {isClientRequest(request) && request.status === 'open' ? (
                                                <button
                                                    onClick={() => setShowDeleteConfirmation(request.id)}
                                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                                >
                                                    Delete Request
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleAcceptRequest(request.id)}
                                                    disabled={acceptingId === request.id}
                                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                                >
                                                    {acceptingId === request.id ? 'Accepting...' : 'Accept Request'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirmation && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Delete</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete this assignment request? This action cannot be undone.
                        </p>
                        <div className="flex space-x-4">
                            <button
                                onClick={() => setShowDeleteConfirmation(null)}
                                className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => showDeleteConfirmation && handleDeleteRequest(showDeleteConfirmation)}
                                disabled={deletingId !== null}
                                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                            >
                                {deletingId !== null ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BrowseRequests;
