import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import { API } from '../utils/api';
import { GuestContext } from '../App';
import { exitGuestMode } from '../utils/auth';
import { BookOpen, FileText, PenTool, Wrench, Loader2, AlertCircle, Trash2, CheckCircle2, Star, User, Clock, Search } from 'lucide-react';
import { cn } from '../utils/cn';
import { Skeleton } from './ui/Skeleton';

interface Client {
    id: number; name: string; rating: number | string; total_ratings: number; whatsapp_number?: string;
}

interface AssignmentRequest {
    id: number; client: Client; course_name: string; course_code: string; assignment_type: string;
    num_pages: number; deadline: string; expiration_deadline: string; estimated_cost: number;
    status: 'open' | 'assigned' | 'completed'; created_at: string; unique_id?: string;
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
            setRequests([
                { id: 2001, client: { id: 3001, name: 'Sample Client 1', rating: 4.2, total_ratings: 5 }, course_name: 'Introduction to Computer Science', course_code: 'CS101', assignment_type: 'class_assignment', num_pages: 5, deadline: new Date(Date.now() + 7 * 86400000).toISOString(), expiration_deadline: new Date(Date.now() + 2 * 86400000).toISOString(), estimated_cost: 50, status: 'open', created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
                { id: 2002, client: { id: 3002, name: 'Sample Client 2', rating: 4.5, total_ratings: 12 }, course_name: 'Business Ethics', course_code: 'BUS205', assignment_type: 'lab_file', num_pages: 8, deadline: new Date(Date.now() + 10 * 86400000).toISOString(), expiration_deadline: new Date(Date.now() + 3 * 86400000).toISOString(), estimated_cost: 80, status: 'open', created_at: new Date(Date.now() - 86400000).toISOString() },
                { id: 2003, client: { id: 3003, name: 'Sample Client 3', rating: 4.8, total_ratings: 8 }, course_name: 'Advanced Database Systems', course_code: 'CS305', assignment_type: 'workshop_file', num_pages: 3, deadline: new Date(Date.now() + 5 * 86400000).toISOString(), expiration_deadline: new Date(Date.now() + 86400000).toISOString(), estimated_cost: 100, status: 'open', created_at: new Date().toISOString() }
            ]);
            setCurrentUserId(1000);
            setLoading(false);
        } else {
            fetch(API.users.profile, { credentials: 'include' })
            .then(res => { if (res.ok) return res.json(); throw new Error('Failed'); })
            .then(data => setCurrentUserId(data.id))
            .catch(() => {})
            .finally(() => {
                fetch(API.assignmentRequests.all, { method: 'GET', credentials: 'include', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' } })
                .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
                .then(data => { setRequests(Array.isArray(data?.requests) ? data.requests : Array.isArray(data) ? data : []); setLoading(false); })
                .catch(() => { setLoading(false); setError('Failed to load requests.'); });
            });
        }
    }, [isGuest]);

    const getAssignmentTypeInfo = (type: string) => {
        switch (type) {
            case 'class_assignment': return { icon: BookOpen, label: 'Class Assignment' };
            case 'lab_file': case 'lab_files': return { icon: FileText, label: 'Lab File' };
            case 'workshop_file': case 'workshop_files': return { icon: Wrench, label: 'Workshop File' };
            case 'graphics_sheet': return { icon: PenTool, label: 'Graphics Sheet' };
            case 'notes': return { icon: FileText, label: 'Notes' };
            default: return { icon: FileText, label: type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') };
        }
    };

    const handleAcceptRequest = async (requestId: number) => {
        setAcceptingId(requestId);
        setError(null);
        if (isGuest) { setGuestActionAttempt(requestId); setAcceptingId(null); return; }
        try {
            const response = await fetch(API.assignmentRequests.accept(requestId), { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' } });
            if (!response.ok) {
                const errorText = await response.text();
                let msg = `HTTP error! Status: ${response.status}`;
                try { const j = JSON.parse(errorText); if (j.error) msg = j.error; } catch (e) { if (errorText) msg = errorText; }
                throw new Error(msg);
            }
            const data = await response.json();
            setRequests(requests.filter(r => r.id !== requestId));
            const accepted = requests.find(r => r.id === requestId);
            if (accepted) {
                const message = `Hi, I've accepted your assignment request for ${accepted.course_name} (${accepted.course_code})${accepted.unique_id ? ` [ID: ${accepted.unique_id}]` : ''}. Let's discuss the details.`;
                let phone = (data.client_whatsapp_redirect || data.client_whatsapp || '').replace(/\D/g, '');
                if (!phone && data.client_whatsapp) {
                    const digits = data.client_whatsapp.replace(/\D/g, '');
                    if (digits.length >= 10) phone = digits;
                    else { navigate('/my-assignments'); return; }
                }
                if (!phone) { alert('Client has not added their WhatsApp number.'); navigate('/my-assignments'); return; }
                if (phone.length === 10) phone = '91' + phone;
                if (phone.length < 10) { navigate('/my-assignments'); return; }
                window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
            }
            navigate('/my-assignments');
        } catch (error) { setError('Failed to accept request.'); } finally { setAcceptingId(null); }
    };

    const handleDeleteRequest = async (requestId: number) => {
        try {
            setDeletingId(requestId);
            const response = await fetch(API.assignmentRequests.delete(requestId), { method: 'DELETE', credentials: 'include', headers: { 'Content-Type': 'application/json' } });
            if (response.ok) { setRequests(prev => prev.filter(r => r.id !== requestId)); setShowDeleteConfirmation(null); }
            else { const d = await response.json(); alert(`Error: ${d.error || 'Failed to delete'}`); }
        } catch (error) { alert('Failed to delete. Please try again.'); } finally { setDeletingId(null); }
    };

    const isClientRequest = (request: AssignmentRequest) => currentUserId === request.client.id;
    const uniqueTypes = Array.from(new Set(requests.map(r => r.assignment_type))).filter(Boolean);

    const filteredAndSortedRequests = requests
        .filter(r => {
            const matchesSearch = r.course_name.toLowerCase().includes(searchQuery.toLowerCase()) || r.course_code.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSearch && (typeFilter === 'all' || r.assignment_type === typeFilter);
        })
        .sort((a, b) => {
            if (sortOrder === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            if (sortOrder === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            if (sortOrder === 'deadline_soon') return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
            if (sortOrder === 'highest_price') return b.estimated_cost - a.estimated_cost;
            return 0;
        });

    const daysUntil = (dateStr: string) => Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header title="Browse Requests" />
            <main className="flex-1 max-w-5xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {loading ? (
                    <div className="space-y-3">
                        <Skeleton className="h-8 w-48 mb-4" />
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <AlertCircle className="h-8 w-8 text-destructive mb-3" strokeWidth={1.5} />
                        <h3 className="text-base font-semibold text-foreground mb-1">Error loading requests</h3>
                        <p className="text-sm text-muted-foreground mb-4">{error}</p>
                        <button onClick={() => window.location.reload()} className="text-sm text-primary hover:underline font-medium">Try again</button>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <h1 className="text-lg font-semibold text-foreground">Open Requests</h1>
                                <p className="text-xs text-muted-foreground">{filteredAndSortedRequests.length} available</p>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <div className="relative flex-1 sm:w-48">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                    <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                        className="flex h-8 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm" />
                                </div>
                                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                                    className="flex h-8 rounded-md border border-input bg-background px-2 text-xs">
                                    <option value="all">All Types</option>
                                    {uniqueTypes.map(t => <option key={t} value={t}>{getAssignmentTypeInfo(t).label}</option>)}
                                </select>
                                <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}
                                    className="flex h-8 rounded-md border border-input bg-background px-2 text-xs hidden sm:flex">
                                    <option value="newest">Newest</option><option value="oldest">Oldest</option>
                                    <option value="deadline_soon">Deadline</option><option value="highest_price">Price</option>
                                </select>
                            </div>
                        </div>

                        {filteredAndSortedRequests.length === 0 ? (
                            <div className="py-16 text-center">
                                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" strokeWidth={1.5} />
                                <h3 className="text-sm font-semibold text-foreground mb-1">No requests found</h3>
                                <p className="text-xs text-muted-foreground">Check back later for new assignments.</p>
                            </div>
                        ) : (
                            <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
                                {filteredAndSortedRequests.map(request => {
                                    const typeInfo = getAssignmentTypeInfo(request.assignment_type);
                                    const TypeIcon = typeInfo.icon;
                                    const days = daysUntil(request.deadline);
                                    return (
                                        <div key={request.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-card hover:bg-accent/30 transition-colors gap-4">
                                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                                <TypeIcon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <h3 className="text-sm font-medium text-foreground truncate">{request.course_name}</h3>
                                                        <span className="text-xs text-muted-foreground font-mono shrink-0">{request.course_code}</span>
                                                        {request.unique_id && <span className="text-xs text-muted-foreground font-mono shrink-0">#{request.unique_id}</span>}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                                        <span>{typeInfo.label}</span>
                                                        <span>{request.num_pages} pages</span>
                                                        <span className={cn("inline-flex items-center gap-1", days <= 2 && "text-destructive font-medium")}>
                                                            <Clock className="w-3 h-3" /> {new Date(request.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ({days}d)
                                                        </span>
                                                        <span className="font-medium text-foreground inline-flex items-center gap-0.5">
                                                            ₹{request.estimated_cost}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center border border-border">
                                                        <User className="h-3 w-3 text-muted-foreground" />
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-medium text-foreground">{request.client.name}</span>
                                                        <div className="flex items-center text-xs text-muted-foreground">
                                                            <Star className="h-2.5 w-2.5 text-amber-500 fill-amber-500 mr-0.5" />
                                                            {request.client.rating ? Number(request.client.rating).toFixed(1) : 'New'}
                                                            {request.client.total_ratings > 0 && <span className="ml-0.5">({request.client.total_ratings})</span>}
                                                        </div>
                                                    </div>
                                                </div>

                                                {guestActionAttempt === request.id && isGuest && (
                                                    <span className="text-xs text-amber-600 dark:text-amber-400">
                                                        <button onClick={exitGuestMode} className="font-medium underline">Sign in</button> to accept
                                                    </span>
                                                )}

                                                {isClientRequest(request) && request.status === 'open' ? (
                                                    <button onClick={() => setShowDeleteConfirmation(request.id)}
                                                        className="inline-flex items-center justify-center rounded-md text-xs font-medium h-7 px-3 text-destructive hover:bg-destructive/10 border border-destructive/20 transition-colors">
                                                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                                                    </button>
                                                ) : (
                                                    <button onClick={() => handleAcceptRequest(request.id)} disabled={acceptingId === request.id}
                                                        className="inline-flex items-center justify-center rounded-md text-xs font-medium h-7 px-3 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
                                                        {acceptingId === request.id ? <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Accepting</> : <><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Accept</>}
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

            {showDeleteConfirmation && (
                <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-lg max-w-sm w-full p-6">
                        <div className="flex items-center gap-2 text-destructive mb-3">
                            <AlertCircle className="h-5 w-5" />
                            <h3 className="text-base font-semibold">Delete Request</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-6">This action cannot be undone.</p>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowDeleteConfirmation(null)} className="h-8 px-3 text-sm rounded-md border border-border hover:bg-accent transition-colors">Cancel</button>
                            <button onClick={() => showDeleteConfirmation && handleDeleteRequest(showDeleteConfirmation)} disabled={deletingId !== null}
                                className="h-8 px-3 text-sm rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50">
                                {deletingId ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BrowseRequests;
