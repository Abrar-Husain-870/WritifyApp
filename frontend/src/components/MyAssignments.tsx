import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import RatingModal from './RatingModal';
import { API } from '../utils/api';
import { GuestContext } from '../App';
import { Loader2, AlertCircle, FileText, CheckCircle2, Star, Clock, PlusCircle, Search, CircleDashed, CircleDot, CheckCircle, XCircle, MessageCircle, Calendar } from 'lucide-react';
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
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const { isGuest } = useContext(GuestContext);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        if (isGuest) {
          setUserRole('guest');
          setAssignments([
            {
              id: 1001, request_id: 2001,
              writer: { id: 3001, name: 'Anonymous Writer', email: 'writer@example.com', profile_picture: null, rating: 4.5, total_ratings: 12, whatsapp_number: '**********' },
              client: { id: 4001, name: 'Guest', email: 'guest@example.com', profile_picture: null, rating: 4.2, total_ratings: 8 },
              status: 'in_progress', created_at: new Date(Date.now() - 7 * 86400000).toISOString(), completed_at: null,
              course_name: 'Introduction to Computer Science', course_code: 'CS101', assignment_type: 'class_assignment',
              num_pages: 5, deadline: new Date(Date.now() + 3 * 86400000).toISOString(), estimated_cost: 50, has_rated_writer: false, has_rated_client: false
            },
            {
              id: 1002, request_id: 2002,
              writer: { id: 3002, name: 'Anonymous Writer', email: 'writer2@example.com', profile_picture: null, rating: 4.8, total_ratings: 24, whatsapp_number: '**********' },
              client: { id: 4002, name: 'Guest', email: 'guest@example.com', profile_picture: null, rating: 4.0, total_ratings: 5 },
              status: 'completed', created_at: new Date(Date.now() - 14 * 86400000).toISOString(), completed_at: new Date(Date.now() - 2 * 86400000).toISOString(),
              course_name: 'Advanced Database Systems', course_code: 'CS305', assignment_type: 'lab_file',
              num_pages: 10, deadline: new Date(Date.now() - 3 * 86400000).toISOString(), estimated_cost: 120, has_rated_writer: true, has_rated_client: true
            },
            {
              id: 1003, request_id: 2003, writer: null,
              client: { id: 4003, name: 'Guest', email: 'guest@example.com', profile_picture: null, rating: 4.3, total_ratings: 7 },
              status: 'pending', created_at: new Date(Date.now() - 3 * 86400000).toISOString(), completed_at: null,
              course_name: 'Marketing Principles', course_code: 'MKT201', assignment_type: 'workshop_file',
              num_pages: 7, deadline: new Date(Date.now() + 5 * 86400000).toISOString(), estimated_cost: 70, has_rated_writer: false, has_rated_client: false
            }
          ]);
          setLoading(false);
          return;
        }
        const response = await fetch(API.assignments.my, { credentials: 'include', headers: { 'Accept': 'application/json' } });
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) { navigate('/login'); return; }
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
      const response = await fetch(`${API.baseUrl}/api/assignments/${assignmentId}/complete`, { method: 'PUT', credentials: 'include' });
      if (!response.ok) throw new Error('Failed to complete assignment');
      setAssignments(prev => prev.map(a => a.id === assignmentId ? { ...a, status: 'completed', completed_at: new Date().toISOString() } : a));
    } catch (error) {
      setError('Failed to complete assignment. Please try again.');
    }
  };

  const handleContactWriter = (assignment: Assignment) => {
    const contactUser = userRole === 'client' ? assignment.writer : assignment.client;
    if (!contactUser?.whatsapp_number) return;
    let phone = contactUser.whatsapp_number.replace(/\D/g, '');
    if (phone.length === 10) phone = '91' + phone;
    if (phone.length < 10) return;
    const msg = encodeURIComponent(`Hi, regarding the assignment: ${assignment.course_name} (${assignment.course_code}) [ID: ${assignment.unique_id || assignment.id}]`);
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  const openRatingModal = (assignment: Assignment) => { setSelectedAssignment(assignment); setShowRatingModal(true); };

  const handleRatingSubmitted = () => {
    if (!selectedAssignment) return;
    setAssignments(prev => prev.map(a => {
      if (a.id === selectedAssignment.id) {
        return userRole === 'client' ? { ...a, has_rated_writer: true } : { ...a, has_rated_client: true };
      }
      return a;
    }));
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getRatingButtonText = (assignment: Assignment) => {
    if (!assignment.writer) return 'Pending Writer';
    if (userRole === 'client' && assignment.has_rated_writer) return 'Rated';
    if (userRole === 'writer' && assignment.has_rated_client) return 'Rated';
    return userRole === 'client' ? 'Rate Writer' : 'Rate Client';
  };

  const isRatingDisabled = (assignment: Assignment) => {
    return !assignment.writer || (userRole === 'client' && assignment.has_rated_writer) || (userRole === 'writer' && assignment.has_rated_client);
  };

  const formatRating = (rating: any): string => {
    if (rating === null || rating === undefined) return '0.0';
    const num = typeof rating === 'number' ? rating : parseFloat(String(rating));
    return isNaN(num) ? '0.0' : num.toFixed(1);
  };

  const updateWhatsAppNumber = async () => {
    try {
      setUpdatingWhatsApp(true);
      const response = await fetch(`${API.baseUrl}/api/users/update-whatsapp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ whatsapp_number: whatsappNumber }),
      });
      if (!response.ok) throw new Error('Failed to update WhatsApp number');
      alert('WhatsApp number updated successfully! Please refresh the page.');
      setShowWhatsAppModal(false);
    } catch (error) {
      alert('Failed to update WhatsApp number. Please try again.');
    } finally {
      setUpdatingWhatsApp(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const base = "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full";
    switch (status) {
      case 'completed': return <span className={cn(base, "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400")}><CheckCircle className="w-3 h-3" /> Completed</span>;
      case 'cancelled': return <span className={cn(base, "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400")}><XCircle className="w-3 h-3" /> Cancelled</span>;
      case 'pending': return <span className={cn(base, "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400")}><CircleDashed className="w-3 h-3" /> Pending</span>;
      default: return <span className={cn(base, "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400")}><CircleDot className="w-3 h-3" /> In Progress</span>;
    }
  };

  const formatAssignmentType = (type: string) => type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const filteredAssignments = assignments.filter(a => filterStatus === 'all' || a.status === filterStatus);
  const stats = {
    total: assignments.length,
    active: assignments.filter(a => a.status === 'in_progress').length,
    pending: assignments.filter(a => a.status === 'pending').length,
    completed: assignments.filter(a => a.status === 'completed').length,
  };

  const canContact = (assignment: Assignment) => {
    const contactUser = userRole === 'client' ? assignment.writer : assignment.client;
    return contactUser?.whatsapp_number && assignment.status !== 'pending' && assignment.status !== 'cancelled';
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Header title="My Assignments" />
      <main className="flex-1 max-w-5xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-7 w-48 mb-6" />
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-lg" />)}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="h-8 w-8 text-destructive mb-3" strokeWidth={1.5} />
            <h3 className="text-base font-semibold text-foreground mb-1">Failed to load</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="text-sm font-medium text-primary hover:underline">Try again</button>
          </div>
        ) : assignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center max-w-sm mx-auto">
            <FileText className="h-8 w-8 text-muted-foreground mb-3" strokeWidth={1.5} />
            <h3 className="text-base font-semibold text-foreground mb-1">No assignments yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {userRole === 'client' ? "Post your first assignment to connect with writers." : "Browse the marketplace to find work."}
            </p>
            <button
              onClick={() => navigate(userRole === 'client' ? '/find-writer' : '/browse-requests')}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 transition-colors"
            >
              {userRole === 'client' ? <><PlusCircle className="w-4 h-4 mr-1.5" /> Post Assignment</> : <><Search className="w-4 h-4 mr-1.5" /> Browse</>}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-foreground">Assignments</h1>
                <p className="text-sm text-muted-foreground">
                  {stats.active} active, {stats.pending} pending, {stats.completed} completed
                </p>
              </div>
              <div className="flex items-center bg-muted p-0.5 rounded-md border border-border">
                {(['all', 'pending', 'in_progress', 'completed'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={cn(
                      "px-3 py-1 text-xs font-medium rounded-sm transition-colors",
                      filterStatus === status ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {status === 'in_progress' ? 'Active' : status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredAssignments.length === 0 ? (
                <div className="py-10 text-center border border-border rounded-lg bg-card">
                  <p className="text-sm text-muted-foreground">No assignments match this filter.</p>
                  <button onClick={() => setFilterStatus('all')} className="mt-1 text-sm text-primary hover:underline font-medium">Clear filter</button>
                </div>
              ) : (
                filteredAssignments.map((assignment, index) => {
                  const assignedUser = userRole === 'client' ? assignment.writer : assignment.client;
                  const isOverdue = assignment.status === 'in_progress' && new Date(assignment.deadline) < new Date();
                  const assignmentKey = `${assignment.unique_id || assignment.id}-${assignment.request_id}-${assignment.created_at || ''}-${index}`;
                  return (
                    <div key={assignmentKey} className="border border-border rounded-lg bg-card overflow-hidden">
                      <div className="p-4 sm:p-5">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">{formatAssignmentType(assignment.assignment_type)}</span>
                              {getStatusBadge(assignment.status)}
                            </div>
                            <h3 className="text-base font-semibold text-foreground">{assignment.course_name}</h3>
                            <p className="text-xs text-muted-foreground font-medium mt-0.5">{assignment.course_code}{assignment.unique_id && <span className="ml-2 font-mono">#{assignment.unique_id}</span>}</p>
                          </div>

                          {assignedUser ? (
                            <div className="flex items-center gap-3 shrink-0 border border-border rounded-lg px-3 py-2 bg-background">
                              <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border overflow-hidden">
                                {assignedUser.profile_picture ? (
                                  <img src={assignedUser.profile_picture} alt={assignedUser.name} className="h-full w-full object-cover" />
                                ) : (
                                  <span className="text-sm font-medium text-muted-foreground">{assignedUser.name.charAt(0)}</span>
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground leading-tight">{assignedUser.name}</p>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                                  {formatRating(assignedUser.rating)} <span>({assignedUser.total_ratings})</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground border border-border rounded-lg px-3 py-2 bg-background">
                              <CircleDashed className="h-3.5 w-3.5 animate-pulse" />
                              Waiting for a writer to accept
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div>
                            <span className="text-muted-foreground flex items-center gap-1 mb-0.5"><FileText className="w-3 h-3" /> Pages</span>
                            <span className="font-medium text-foreground">{assignment.num_pages}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground flex items-center gap-1 mb-0.5">₹ Cost</span>
                            <span className="font-medium text-foreground">₹{Number(assignment.estimated_cost).toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground flex items-center gap-1 mb-0.5"><Calendar className="w-3 h-3" /> Created</span>
                            <span className="font-medium text-foreground">{formatDate(assignment.created_at)}</span>
                          </div>
                          <div>
                            <span className={cn("flex items-center gap-1 mb-0.5", isOverdue ? "text-destructive" : "text-muted-foreground")}><Clock className="w-3 h-3" /> Deadline</span>
                            <span className={cn("font-medium", isOverdue ? "text-destructive" : "text-foreground")}>{formatDate(assignment.deadline)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-border px-4 sm:px-5 py-3 flex flex-wrap items-center gap-2 bg-muted/30">
                        {canContact(assignment) && (
                          <button
                            onClick={() => handleContactWriter(assignment)}
                            className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors h-8 px-3 border border-border bg-background text-foreground hover:bg-accent"
                          >
                            <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                            Contact {userRole === 'client' ? 'Writer' : 'Client'}
                          </button>
                        )}

                        {userRole === 'writer' && assignment.status === 'in_progress' && (
                          <button
                            onClick={() => handleCompleteAssignment(assignment.id)}
                            className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors h-8 px-3 border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Mark as Done
                          </button>
                        )}

                        {assignment.status === 'completed' && (
                          <button
                            onClick={() => openRatingModal(assignment)}
                            disabled={isRatingDisabled(assignment)}
                            className={cn(
                              "inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors h-8 px-3",
                              isRatingDisabled(assignment)
                                ? "text-muted-foreground bg-muted border border-border cursor-default"
                                : "bg-primary text-primary-foreground hover:bg-primary/90"
                            )}
                          >
                            <Star className={cn("w-3.5 h-3.5 mr-1.5", !isRatingDisabled(assignment) && "fill-primary-foreground")} />
                            {getRatingButtonText(assignment)}
                          </button>
                        )}

                        {assignment.status === 'pending' && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Loader2 className="h-3 w-3 animate-spin" /> Pending writer acceptance
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </main>

      {showWhatsAppModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg max-w-md w-full p-6">
            <h3 className="text-base font-semibold text-foreground mb-1">Update WhatsApp Number</h3>
            <p className="text-sm text-muted-foreground mb-4">Enter your WhatsApp number with country code.</p>
            <input
              type="text" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="e.g. 919876543210"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm mb-4"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowWhatsAppModal(false)} className="h-8 px-3 text-sm rounded-md border border-border hover:bg-accent transition-colors">Cancel</button>
              <button onClick={updateWhatsAppNumber} disabled={updatingWhatsApp || !whatsappNumber} className="h-8 px-3 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
                {updatingWhatsApp ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRatingModal && selectedAssignment && (
        <RatingModal
          isOpen={showRatingModal} onClose={() => setShowRatingModal(false)}
          ratedUserId={userRole === 'client' ? selectedAssignment.writer?.id || 0 : selectedAssignment.client.id}
          ratedUserName={userRole === 'client' ? selectedAssignment.writer?.name || 'Unknown' : selectedAssignment.client.name}
          assignmentRequestId={selectedAssignment?.request_id || 0}
          onRatingSubmitted={handleRatingSubmitted}
          userType={userRole === 'client' ? 'writer' : 'client'}
        />
      )}
    </div>
  );
};

export default MyAssignments;
