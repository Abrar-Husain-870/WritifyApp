import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

import Header from './Header';
import RatingModal from './RatingModal';
import { API } from '../utils/api';
import { GuestContext } from '../App';
import { Loader2, AlertCircle, FileText, CheckCircle2, Star, User, IndianRupee, Clock, Calendar, FileDigit, PlusCircle, Search } from 'lucide-react';
import { cn } from '../utils/cn';
import { Skeleton } from './ui/Skeleton';

interface UserData {
  id: number;
  name: string;
  email: string;
  profile_picture: string | null;
  rating: number;
  total_ratings: number;
  whatsapp_number?: string;
}

interface Assignment {
  id: number;
  request_id: number;
  writer: UserData | null;
  client: UserData;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  completed_at: string | null;
  course_name: string;
  course_code: string;
  assignment_type: string;
  num_pages: number;
  deadline: string;
  estimated_cost: number;
  has_rated_writer: boolean;
  has_rated_client: boolean;
  unique_id?: string;
}

const MyAssignments: React.FC = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'client' | 'writer' | 'guest' | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [updatingWhatsApp, setUpdatingWhatsApp] = useState(false);
  const { isGuest } = useContext(GuestContext);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        
        if (isGuest) {
          setUserRole('guest');
          
          const sampleAssignments: Assignment[] = [
            {
              id: 1001,
              request_id: 2001,
              writer: {
                id: 3001,
                name: 'Anonymous Writer',
                email: 'writer@example.com',
                profile_picture: null,
                rating: 4.5,
                total_ratings: 12,
                whatsapp_number: '**********'
              },
              client: {
                id: 4001,
                name: 'Guest',
                email: 'guest@example.com',
                profile_picture: null,
                rating: 4.2,
                total_ratings: 8
              },
              status: 'in_progress',
              created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              completed_at: null,
              course_name: 'Introduction to Computer Science',
              course_code: 'CS101',
              assignment_type: 'class_assignment',
              num_pages: 5,
              deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
              estimated_cost: 50,
              has_rated_writer: false,
              has_rated_client: false
            },
            {
              id: 1002,
              request_id: 2002,
              writer: {
                id: 3002,
                name: 'Anonymous Writer',
                email: 'writer2@example.com',
                profile_picture: null,
                rating: 4.8,
                total_ratings: 24,
                whatsapp_number: '**********'
              },
              client: {
                id: 4002,
                name: 'Guest',
                email: 'guest@example.com',
                profile_picture: null,
                rating: 4.0,
                total_ratings: 5
              },
              status: 'completed',
              created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
              completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              course_name: 'Advanced Database Systems',
              course_code: 'CS305',
              assignment_type: 'lab_files',
              num_pages: 10,
              deadline: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              estimated_cost: 120,
              has_rated_writer: true,
              has_rated_client: true
            },
            {
              id: 1003,
              request_id: 2003,
              writer: null,
              client: {
                id: 4003,
                name: 'Guest',
                email: 'guest@example.com',
                profile_picture: null,
                rating: 4.3,
                total_ratings: 7
              },
              status: 'pending',
              created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              completed_at: null,
              course_name: 'Marketing Principles',
              course_code: 'MKT201',
              assignment_type: 'workshop_files',
              num_pages: 7,
              deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
              estimated_cost: 70,
              has_rated_writer: false,
              has_rated_client: false
            }
          ];
          
          setAssignments(sampleAssignments);
          setLoading(false);
          return;
        }
        
        const response = await fetch(API.assignments.my, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            navigate('/login');
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setAssignments(data.assignments || []);
        setUserRole(data.role);
        setLoading(false);
      } catch (err) {
        setError('Failed to load assignments. Please try again later.');
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [isGuest, navigate]);

  const handleCompleteAssignment = async (assignmentId: number) => {
    try {
      const response = await fetch(`${API.baseUrl}/api/assignments/${assignmentId}/complete`, {
        method: 'PUT',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to complete assignment');
      }

      setAssignments(prevAssignments => 
        prevAssignments.map(assignment => 
          assignment.id === assignmentId 
            ? { ...assignment, status: 'completed', completed_at: new Date().toISOString() } 
            : assignment
        )
      );
    } catch (error) {
      setError('Failed to complete assignment. Please try again.');
    }
  };

  const openRatingModal = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowRatingModal(true);
  };

  const handleRatingSubmitted = () => {
    if (!selectedAssignment) return;
    
    setAssignments(prevAssignments => 
      prevAssignments.map(assignment => {
        if (assignment.id === selectedAssignment.id) {
          if (userRole === 'client') {
            return { ...assignment, has_rated_writer: true };
          } else {
            return { ...assignment, has_rated_client: true };
          }
        }
        return assignment;
      })
    );
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) {
      return new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    
    const date = new Date(dateString);
    
    if (isNaN(date.getTime()) || date.getFullYear() === 1970) {
      if (dateString.includes('T')) {
        const isoDate = new Date(dateString.split('T')[0]);
        if (!isNaN(isoDate.getTime())) {
          return isoDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        }
      }
      
      if (!isNaN(Number(dateString))) {
        const milliseconds = parseInt(dateString);
        const timestampDate = new Date(milliseconds);
        
        if (!isNaN(timestampDate.getTime())) {
          return timestampDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        }
      }
      
      return new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRatingButtonText = (assignment: Assignment) => {
    if (!assignment.writer) {
      return 'Pending Writer';
    }
    if (userRole === 'client' && assignment.has_rated_writer) {
      return 'Writer Rated';
    } else if (userRole === 'writer' && assignment.has_rated_client) {
      return 'Client Rated';
    } else {
      return userRole === 'client' ? 'Rate Writer' : 'Rate Client';
    }
  };

  const isRatingDisabled = (assignment: Assignment) => {
    return !assignment.writer || 
           (userRole === 'client' && assignment.has_rated_writer) || 
           (userRole === 'writer' && assignment.has_rated_client);
  };

  const formatRating = (rating: any): string => {
    if (rating === null || rating === undefined) return '0.0';
    if (typeof rating === 'number') return rating.toFixed(1);
    try {
      const numRating = parseFloat(String(rating));
      return isNaN(numRating) ? '0.0' : numRating.toFixed(1);
    } catch (e) {
      return '0.0';
    }
  };

  const updateWhatsAppNumber = async () => {
    try {
      setUpdatingWhatsApp(true);
      const response = await fetch(`${API.baseUrl}/api/users/update-whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ whatsapp_number: whatsappNumber }),
      });

      if (!response.ok) {
        throw new Error('Failed to update WhatsApp number');
      }

      alert('WhatsApp number updated successfully! Please refresh the page.');
      setShowWhatsAppModal(false);
    } catch (error) {
      alert('Failed to update WhatsApp number. Please try again.');
    } finally {
      setUpdatingWhatsApp(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800"><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</span>;
      case 'cancelled':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800"><AlertCircle className="w-3 h-3 mr-1" /> Cancelled</span>;
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800"><Clock className="w-3 h-3 mr-1" /> Pending</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> In Progress</span>;
    }
  };

  const formatAssignmentType = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header title="My Assignments" />

      <main className="flex-1 max-w-7xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-24 w-full rounded-xl" />
            <div className="grid grid-cols-1 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-xl border border-border overflow-hidden flex flex-col md:flex-row">
                  <div className="p-6 flex-1 border-b md:border-b-0 md:border-r border-border space-y-4">
                    <div className="flex gap-2 mb-2">
                      <Skeleton className="h-5 w-24 rounded" />
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-5 w-32 rounded" />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                  <div className="p-6 md:w-80 flex flex-col bg-muted/10">
                    <Skeleton className="h-4 w-24 mb-4" />
                    <div className="flex items-center gap-3 mb-6">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <div className="mt-auto">
                      <Skeleton className="h-9 w-full rounded-md" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Assignments</h3>
            <p className="text-muted-foreground mb-6">{error}</p>
            <button 
                onClick={() => window.location.reload()} 
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-6"
            >
                Try Again
            </button>
          </div>
        ) : assignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-card/50 rounded-3xl border border-border border-dashed relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
            <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 relative z-10">
                <FileText className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3 relative z-10">No assignments found</h3>
            <p className="text-lg text-muted-foreground mb-8 max-w-md relative z-10">
              {userRole === 'client' 
                ? "You haven't created any assignment requests yet. Start by posting your first assignment." 
                : "You haven't accepted any assignments yet. Browse open requests to get started."}
            </p>
            <button
              onClick={() => navigate(userRole === 'client' ? '/create-assignment' : '/browse-requests')}
              className="relative z-10 inline-flex items-center justify-center rounded-full text-base font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:scale-105 h-12 px-8"
            >
              {userRole === 'client' ? <><PlusCircle className="w-5 h-5 mr-2" /> Create Request</> : <><Search className="w-5 h-5 mr-2" /> Browse Requests</>}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex items-start gap-3">
              <Star className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-semibold text-foreground mb-1">Rating Instructions</h2>
                <p className="text-sm text-muted-foreground">
                  You can rate {userRole === 'client' ? 'writers' : 'clients'} once an assignment has been accepted. 
                  Your ratings help build trust in our community and provide valuable feedback.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col md:flex-row">
                  {/* Left side: Assignment Details */}
                  <div className="p-6 flex-1 border-b md:border-b-0 md:border-r border-border">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground border border-border">
                            {formatAssignmentType(assignment.assignment_type)}
                          </span>
                          {getStatusBadge(assignment.status)}
                        </div>
                        <h3 className="text-xl font-bold text-foreground">
                          {assignment.course_name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">{assignment.course_code}</span>
                          {assignment.unique_id && (
                            <span className="text-xs font-medium text-muted-foreground flex items-center">
                              <FileDigit className="h-3 w-3 mr-1" /> ID: {assignment.unique_id}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground flex items-center"><FileText className="h-3.5 w-3.5 mr-1" /> Pages</span>
                        <p className="text-sm font-medium text-foreground">{assignment.num_pages}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground flex items-center"><IndianRupee className="h-3.5 w-3.5 mr-1" /> Cost</span>
                        <p className="text-sm font-semibold text-primary">₹{assignment.estimated_cost}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground flex items-center"><Calendar className="h-3.5 w-3.5 mr-1" /> Created</span>
                        <p className="text-sm font-medium text-foreground">{formatDate(assignment.created_at)}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground flex items-center"><Clock className="h-3.5 w-3.5 mr-1" /> Deadline</span>
                        <p className="text-sm font-medium text-foreground">{formatDate(assignment.deadline)}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right side: User & Actions */}
                  <div className="p-6 md:w-80 flex flex-col bg-muted/10">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                      {assignment.writer ? (userRole === 'client' ? 'Assigned Writer' : 'Client') : 'Status'}
                    </h4>
                    
                    {assignment.writer || userRole === 'writer' ? (
                      <div className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center shrink-0 border border-border overflow-hidden">
                          {(userRole === 'client' ? assignment.writer?.profile_picture : assignment.client.profile_picture) ? (
                            <img 
                              src={userRole === 'client' ? assignment.writer?.profile_picture! : assignment.client.profile_picture!} 
                              alt="Profile" 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <User className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground line-clamp-1">
                            {userRole === 'client' ? assignment.writer?.name : assignment.client.name}
                          </p>
                          <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 mr-1" />
                            {userRole === 'client' ? 
                              formatRating(assignment.writer?.rating) : 
                              formatRating(assignment.client.rating)} 
                            <span className="ml-1">
                              ({userRole === 'client' ? 
                                assignment.writer?.total_ratings || 0 : 
                                assignment.client.total_ratings || 0})
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Waiting for a writer to accept
                      </div>
                    )}
                    
                    <div className="mt-auto space-y-2">
                      {userRole === 'writer' && assignment.status === 'in_progress' && (
                        <button
                          onClick={() => handleCompleteAssignment(assignment.id)}
                          className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-green-600 text-white hover:bg-green-700 h-9"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" /> Mark as Completed
                        </button>
                      )}
                      
                      <button
                        onClick={() => openRatingModal(assignment)}
                        disabled={isRatingDisabled(assignment)}
                        className={cn(
                          "w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-9",
                          isRatingDisabled(assignment)
                            ? "bg-secondary text-secondary-foreground opacity-50 cursor-not-allowed"
                            : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                        )}
                      >
                        <Star className={cn("w-4 h-4 mr-2", !isRatingDisabled(assignment) && "fill-current")} />
                        {getRatingButtonText(assignment)}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* WhatsApp Number Modal */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border shadow-lg rounded-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-2">Update WhatsApp Number</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your WhatsApp number is missing or incorrect. Please enter your WhatsApp number with country code (e.g., 919876543210 for India).
              </p>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="e.g. 919876543210"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mb-6"
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowWhatsAppModal(false)}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4"
                >
                  Cancel
                </button>
                <button
                  onClick={updateWhatsAppNumber}
                  disabled={updatingWhatsApp || !whatsappNumber}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 disabled:opacity-50"
                >
                  {updatingWhatsApp ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...</> : 'Update'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRatingModal && selectedAssignment && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          ratedUserId={selectedAssignment && (userRole === 'client' ? selectedAssignment.writer?.id || 0 : selectedAssignment.client.id)}
          ratedUserName={selectedAssignment && (userRole === 'client' ? selectedAssignment.writer?.name || 'Unknown' : selectedAssignment.client.name)}
          assignmentRequestId={selectedAssignment?.request_id || 0}
          onRatingSubmitted={handleRatingSubmitted}
          userType={userRole === 'client' ? 'writer' : 'client'}
        />
      )}
    </div>
  );
};

export default MyAssignments;