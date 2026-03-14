import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import { API } from '../utils/api';
import { GuestContext } from '../App';
import { exitGuestMode } from '../utils/auth';
import { BookOpen, FileText, PenTool, Wrench, Loader2, AlertCircle, Trash2, CheckCircle2, Star, User, IndianRupee, Clock, FileDigit, Search } from 'lucide-react';
import { cn } from '../utils/cn';
import { Skeleton } from './ui/Skeleton';

interface Client {
    id: number;
    name: string;
    rating: number | string;
    total_ratings: number;
    whatsapp_number?: string;
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
    unique_id?: string;
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
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('newest');

    const { isGuest } = useContext(GuestContext);

    useEffect(() => {
        if (isGuest) {
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
                    assignment_type: 'class_assignment',
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
                    assignment_type: 'lab_files',
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
                    assignment_type: 'workshop_files',
                    num_pages: 3,
                    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
                    expiration_deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
                    estimated_cost: 100,
                    status: 'open',
                    created_at: new Date().toISOString()
                }
            ];
            setRequests(sampleRequests);
            setCurrentUserId(1000);
            setLoading(false);
        } else {
            fetch(API.users.profile, {
                credentials: 'include'
            })
            .then(res => {
                if (res.ok) return res.json();
                throw new Error('Failed to fetch user profile');
            })
            .then(data => {
                setCurrentUserId(data.id);
            })
            .catch(err => {
                console.error('Error fetching user profile', err);
            })
            .finally(() => {
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
                        return res.text().then(text => {
                            throw new Error(`HTTP error! Status: ${res.status}`);
                        });
                    }
                    return res.json();
                })
                .then(data => {
                    if (data && Array.isArray(data.requests)) {
                        setRequests(data.requests);
                    } else if (data && Array.isArray(data)) {
                        setRequests(data);
                    } else {
                        setRequests([]);
                    }
                    setLoading(false);
                })
                .catch(error => {
                    setLoading(false);
                    setError('Failed to load assignment requests. Please try again later.');
                });
            });
        }
    }, [isGuest]);

    const getAssignmentTypeInfo = (type: string) => {
        switch (type) {
            case 'class_assignment':
                return { icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Class Assignment' };
            case 'lab_file':
                return { icon: FileDigit, color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'Lab File' };
            case 'workshop_file':
                return { icon: Wrench, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Workshop Files' };
            case 'graphics_sheet':
                return { icon: PenTool, color: 'text-pink-500', bg: 'bg-pink-500/10', label: 'Graphics Sheet' };
            case 'notes':
                return { icon: FileText, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Notes' };
            case 'project_report':
                return { icon: FileText, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Project Report' };
            default:
                return { icon: FileText, color: 'text-gray-500', bg: 'bg-gray-500/10', label: type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') };
        }
    };

    const handleAcceptRequest = async (requestId: number) => {
        setAcceptingId(requestId);
        setError(null);

        if (isGuest) {
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
                const errorText = await response.text();
                let errorMessage = `HTTP error! Status: ${response.status}`;
                try {
                    const errorJson = JSON.parse(errorText);
                    if (errorJson.error) errorMessage = errorJson.error;
                } catch (e) {
                    if (errorText) errorMessage = errorText;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            
            setRequests(requests.filter(req => req.id !== requestId));
            const acceptedRequest = requests.find(req => req.id === requestId);
            
            if (acceptedRequest) {
                const message = `Hi, I've accepted your assignment request for ${acceptedRequest.course_name} (${acceptedRequest.course_code})${acceptedRequest.unique_id ? ` [ID: ${acceptedRequest.unique_id}]` : ''}. Let's discuss the details.`;
                
                let phoneNumber = data.client_whatsapp_redirect || data.client_whatsapp || '';
                phoneNumber = phoneNumber.replace(/\D/g, '');
                
                if (!phoneNumber) {
                    if (data.client_whatsapp) {
                        const extractedDigits = data.client_whatsapp.replace(/\D/g, '');
                        if (extractedDigits.length >= 10) {
                            phoneNumber = extractedDigits;
                        } else if (extractedDigits.length >= 4) {
                            const confirmContact = window.confirm(
                                `Only partial phone number is available (ending in: ${extractedDigits}). \n\n` +
                                `Please check your assignments page for more contact details. \n\n` +
                                `Would you like to go to your assignments page now?`
                            );
                            if (confirmContact) navigate('/my-assignments');
                            return;
                        }
                    }
                    
                    if (!phoneNumber) {
                        alert('The client has not added their WhatsApp number. Please check your assignments page for contact details.');
                        navigate('/my-assignments');
                        return;
                    }
                }
                
                if (phoneNumber.length === 10) {
                    phoneNumber = '91' + phoneNumber;
                } else if (phoneNumber.length < 10) {
                    alert('The client has an invalid phone number. Please check your assignments page for contact details.');
                    navigate('/my-assignments');
                    return;
                }
                
                const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
                if (phoneNumber) window.open(whatsappUrl, '_blank');
                
                navigate('/my-assignments');
            } else {
                navigate('/my-assignments');
            }
        } catch (error) {
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
                setRequests(prevRequests => prevRequests.filter(req => req.id !== requestId));
                setShowDeleteConfirmation(null);
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.error || 'Failed to delete request'}`);
            }
        } catch (error) {
            alert('Failed to delete request. Please try again.');
        } finally {
            setDeletingId(null);
        }
    };

    const isClientRequest = (request: AssignmentRequest) => {
        return currentUserId === request.client.id;
    };

    const uniqueTypes = Array.from(new Set(requests.map(r => r.assignment_type))).filter(Boolean);

    const filteredAndSortedRequests = requests
        .filter(request => {
            const matchesSearch = request.course_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  request.course_code.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = typeFilter === 'all' || request.assignment_type === typeFilter;
            return matchesSearch && matchesType;
        })
        .sort((a, b) => {
            if (sortOrder === 'newest') {
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            } else if (sortOrder === 'oldest') {
                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            } else if (sortOrder === 'deadline_soon') {
                return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
            } else if (sortOrder === 'highest_price') {
                return b.estimated_cost - a.estimated_cost;
            }
            return 0;
        });

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header title="Browse Requests" />

            <main className="flex-1 max-w-7xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {loading ? (
                    <div className="space-y-8">
                        <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-6 w-24 rounded-full" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="bg-card rounded-xl border border-border overflow-hidden flex flex-col h-full">
                                    <div className="p-5 flex-1 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <Skeleton className="h-10 w-10 rounded-lg" />
                                            <Skeleton className="h-6 w-24 rounded-full" />
                                        </div>
                                        <Skeleton className="h-6 w-3/4" />
                                        <div className="flex gap-2">
                                            <Skeleton className="h-5 w-16" />
                                        </div>
                                        <div className="space-y-3 pt-2">
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-4 w-full" />
                                        </div>
                                    </div>
                                    <div className="p-4 bg-muted/20 border-t border-border mt-auto">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Skeleton className="h-8 w-8 rounded-full" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-24" />
                                                <Skeleton className="h-3 w-16" />
                                            </div>
                                        </div>
                                        <Skeleton className="h-9 w-full rounded-md" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Requests</h3>
                        <p className="text-muted-foreground mb-6">{error}</p>
                        <button 
                            onClick={() => window.location.reload()} 
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-6"
                        >
                            Try Again
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border pb-4 mb-6 gap-4">
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-semibold text-foreground">Open Requests</h2>
                                <span className="text-sm font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                                    {filteredAndSortedRequests.length} available
                                </span>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <input 
                                        type="text" 
                                        placeholder="Search course..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                </div>
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <select 
                                        value={typeFilter}
                                        onChange={(e) => setTypeFilter(e.target.value)}
                                        className="flex h-10 w-full sm:w-auto rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="all">All Types</option>
                                        {uniqueTypes.map(type => (
                                            <option key={type} value={type}>{getAssignmentTypeInfo(type).label}</option>
                                        ))}
                                    </select>
                                    <select 
                                        value={sortOrder}
                                        onChange={(e) => setSortOrder(e.target.value)}
                                        className="flex h-10 w-full sm:w-auto rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="newest">Newest First</option>
                                        <option value="oldest">Oldest First</option>
                                        <option value="deadline_soon">Deadline Soon</option>
                                        <option value="highest_price">Highest Price</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {filteredAndSortedRequests.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center bg-card/50 rounded-3xl border border-border border-dashed relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
                                <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 relative z-10">
                                    <FileText className="h-10 w-10 text-primary" />
                                </div>
                                <h3 className="text-2xl font-bold text-foreground mb-3 relative z-10">No assignment requests</h3>
                                <p className="text-lg text-muted-foreground max-w-md relative z-10">There are no open assignment requests at the moment. Check back later!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredAndSortedRequests.map(request => {
                                    const typeInfo = getAssignmentTypeInfo(request.assignment_type);
                                    const TypeIcon = typeInfo.icon;
                                    
                                    return (
                                        <div key={request.id} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col h-full group hover:border-primary/30">
                                            <div className="p-5 flex-1">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className={cn("p-2.5 rounded-lg shrink-0", typeInfo.bg)}>
                                                        <TypeIcon className={cn("h-5 w-5", typeInfo.color)} />
                                                    </div>
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border">
                                                        {typeInfo.label}
                                                    </span>
                                                </div>
                                                
                                                <h3 className="text-lg font-bold text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">{request.course_name}</h3>
                                                <div className="flex items-center gap-2 mb-5">
                                                    <span className="text-sm font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">{request.course_code}</span>
                                                    {request.unique_id && (
                                                        <span className="text-xs font-medium text-muted-foreground flex items-center">
                                                            <FileDigit className="h-3 w-3 mr-1" /> ID: {request.unique_id}
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                <div className="space-y-3 mb-6">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-muted-foreground flex items-center"><FileText className="h-4 w-4 mr-2" /> Pages</span>
                                                        <span className="font-medium text-foreground">{request.num_pages}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-muted-foreground flex items-center"><IndianRupee className="h-4 w-4 mr-2" /> Est. Cost</span>
                                                        <span className="font-semibold text-primary">₹{request.estimated_cost}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-muted-foreground flex items-center"><Clock className="h-4 w-4 mr-2" /> Deadline</span>
                                                        <span className="font-medium text-foreground">
                                                            {new Date(request.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                            <span className="text-xs text-muted-foreground ml-1">
                                                                ({Math.ceil((new Date(request.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}d left)
                                                            </span>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="p-4 bg-muted/20 border-t border-border mt-auto">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0 border border-border">
                                                            <User className="h-4 w-4 text-muted-foreground" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-foreground line-clamp-1">{request.client.name}</p>
                                                            <div className="flex items-center text-xs text-muted-foreground">
                                                                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 mr-1" />
                                                                {request.client.rating ? Number(request.client.rating).toFixed(1) : 'New'} 
                                                                <span className="ml-1">({request.client.total_ratings || 0})</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {guestActionAttempt === request.id && isGuest && (
                                                    <div className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-800 dark:text-yellow-200 text-center">
                                                        Please <button onClick={exitGuestMode} className="font-semibold underline">sign in</button> to accept
                                                    </div>
                                                )}
                                                
                                                {isClientRequest(request) && request.status === 'open' ? (
                                                    <button
                                                        onClick={() => setShowDeleteConfirmation(request.id)}
                                                        className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-destructive/50 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground h-9"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" /> Delete Request
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleAcceptRequest(request.id)}
                                                        disabled={acceptingId === request.id}
                                                        className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 disabled:opacity-50"
                                                    >
                                                        {acceptingId === request.id ? (
                                                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Accepting...</>
                                                        ) : (
                                                            <><CheckCircle2 className="h-4 w-4 mr-2" /> Accept Request</>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirmation && (
                <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-card border border-border shadow-lg rounded-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="flex items-center gap-3 text-destructive mb-4">
                                <AlertCircle className="h-6 w-6" />
                                <h3 className="text-lg font-semibold">Confirm Delete</h3>
                            </div>
                            <p className="text-sm text-muted-foreground mb-6">
                                Are you sure you want to delete this assignment request? This action cannot be undone.
                            </p>
                            
                            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirmation(null)}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => showDeleteConfirmation && handleDeleteRequest(showDeleteConfirmation)}
                                    disabled={deletingId !== null}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 px-4 disabled:opacity-50"
                                >
                                    {deletingId !== null ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                                    {deletingId !== null ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BrowseRequests;