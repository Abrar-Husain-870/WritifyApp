import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import { API } from '../utils/api';
import { GuestContext } from '../App';
import { Star, Loader2, X, Send, User, ChevronRight, BookOpen, Search } from 'lucide-react';
import { cn } from '../utils/cn';
import { Skeleton } from './ui/Skeleton';
import { toast } from 'sonner';

interface Writer {
    id: number;
    name: string;
    rating: number | string;
    total_ratings: number;
    writer_status: 'active' | 'busy' | 'inactive';
    university_stream: string;
    sample_work_image: string;
}

interface AssignmentRequest {
    course_name: string;
    course_code: string;
    assignment_type: string;
    num_pages: number;
    deadline: string;
    estimated_cost: number;
    whatsapp_number: string;
}

const FindWriter: React.FC = () => {
    const navigate = useNavigate();
    const [writers, setWriters] = useState<Writer[]>([]);
    const [loading, setLoading] = useState(true);
    const [showShareForm, setShowShareForm] = useState(false);
    const [formData, setFormData] = useState<AssignmentRequest>({
        course_name: '', course_code: '', assignment_type: 'class_assignment',
        num_pages: 1, deadline: '', estimated_cost: 50, whatsapp_number: ''
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [streamFilter, setStreamFilter] = useState('all');
    const [submitting, setSubmitting] = useState(false);
    const [userStream, setUserStream] = useState<string>('');
    const { isGuest } = useContext(GuestContext);

    useEffect(() => {
        if (!isGuest) {
            fetch(API.users.profile, { credentials: 'include' })
            .then(res => res.json())
            .then(data => { if (data?.university_stream) setUserStream(data.university_stream); })
            .catch(err => console.error('Error fetching user profile:', err));
        }
    }, [isGuest]);

    useEffect(() => {
        if (isGuest) {
            setWriters([
                { id: 1001, name: 'John Smith', rating: 4.8, total_ratings: 24, writer_status: 'active', university_stream: 'Computer Science', sample_work_image: 'https://lh3.googleusercontent.com/d/1qbBt39377NTLPVs7PTDB3UbbZbJ9EQq3' },
                { id: 1002, name: 'Alice Johnson', rating: 4.5, total_ratings: 18, writer_status: 'active', university_stream: 'Business Administration', sample_work_image: 'https://lh3.googleusercontent.com/d/1ny8x8rKe-Y-0IYWoP3ObmjcF98aiPmPt' },
                { id: 1003, name: 'Jacob Williams', rating: 4.7, total_ratings: 32, writer_status: 'busy', university_stream: 'Engineering', sample_work_image: 'https://lh3.googleusercontent.com/d/1mM9I1h7n2JhL2kHr8iPuEjlXC5YwSMmn' }
            ]);
            setLoading(false);
        } else {
            fetch(API.writers.all, { method: 'GET', credentials: 'include', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' } })
            .then(res => { if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`); return res.json(); })
            .then(data => {
                let writersData = Array.isArray(data?.writers) ? data.writers : Array.isArray(data) ? data : [];
                setWriters(writersData.filter((w: Writer) => w.writer_status === 'active' || w.writer_status === 'busy'));
                setLoading(false);
            })
            .catch(() => { setLoading(false); toast.error('Failed to load writers.'); });
        }
    }, [isGuest]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-emerald-500';
            case 'busy': return 'bg-amber-500';
            default: return 'bg-muted-foreground';
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        if (formData.course_name.length > 255) { toast.error('Course name too long'); return false; }
        if (formData.course_code.length > 50) { toast.error('Course code too long'); return false; }
        if (isNaN(parseInt(formData.num_pages.toString())) || parseInt(formData.num_pages.toString()) <= 0) { toast.error('Pages must be positive'); return false; }
        if (isNaN(parseFloat(formData.estimated_cost.toString())) || parseFloat(formData.estimated_cost.toString()) % 50 !== 0) { toast.error('Cost must be a multiple of 50'); return false; }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        if (isGuest) { toast.error('Sign in to use this feature'); setSubmitting(false); return; }
        if (!validateForm()) { setSubmitting(false); return; }
        try {
            const response = await fetch(API.assignmentRequests.create, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
                body: JSON.stringify({
                    course_name: formData.course_name.substring(0, 255), course_code: formData.course_code.substring(0, 50),
                    assignment_type: formData.assignment_type.substring(0, 100), num_pages: parseInt(formData.num_pages.toString()).toString(),
                    deadline: formData.deadline, estimated_cost: parseFloat(formData.estimated_cost.toString()).toString(), whatsapp_number: formData.whatsapp_number
                })
            });
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            toast.success('Assignment request created!');
            setTimeout(() => navigate('/my-assignments'), 2000);
        } catch (error) {
            toast.error('Failed to create request. Please try again.');
        } finally { setSubmitting(false); }
    };

    const handleWriterClick = (writerId: number) => { isGuest ? setShowShareForm(true) : navigate(`/writer-profile/${writerId}`); };
    const uniqueStreams = Array.from(new Set(writers.map(w => w.university_stream))).filter(Boolean);
    const filteredWriters = writers.filter(w => {
        const matchesSearch = w.name.toLowerCase().includes(searchQuery.toLowerCase()) || w.university_stream.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch && (statusFilter === 'all' || w.writer_status === statusFilter) && (streamFilter === 'all' || w.university_stream === streamFilter);
    });

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header title="Find a Writer" />
            <main className="flex-1 max-w-5xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {loading ? (
                    <div className="space-y-6">
                        <Skeleton className="h-20 w-full rounded-lg" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full rounded-lg" />)}
                        </div>
                    </div>
                ) : showShareForm ? (
                    <div className="max-w-lg mx-auto">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-lg font-semibold text-foreground">Broadcast Assignment</h1>
                                <p className="text-sm text-muted-foreground">Share details with all available writers.</p>
                            </div>
                            <button onClick={() => setShowShareForm(false)} className="h-8 w-8 rounded-md hover:bg-accent flex items-center justify-center text-muted-foreground">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-foreground mb-1.5 block">Course Name</label>
                                    <input type="text" name="course_name" value={formData.course_name} onChange={handleChange} required
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground/60" placeholder="e.g. Data Structures" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-foreground mb-1.5 block">Course Code</label>
                                    <input type="text" name="course_code" value={formData.course_code} onChange={handleChange} required
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground/60" placeholder="e.g. CS301" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-foreground mb-1.5 block">Assignment Type</label>
                                <select name="assignment_type" value={formData.assignment_type} onChange={handleChange} required
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                                    <option value="class_assignment">Class Assignment</option>
                                    <option value="lab_file">Lab File</option>
                                    {userStream.startsWith('B.Tech') && (<><option value="workshop_file">Workshop File</option><option value="graphics_sheet">Graphics Sheet</option></>)}
                                    <option value="notes">Notes</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-foreground mb-1.5 block">Pages</label>
                                    <input type="number" name="num_pages" value={formData.num_pages} onChange={handleChange} required min="1"
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-foreground mb-1.5 block">Deadline</label>
                                    <input type="date" name="deadline" value={formData.deadline} onChange={handleChange} required
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm [color-scheme:light] dark:[color-scheme:dark]" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-foreground mb-1.5 block">Estimated Cost: ₹{formData.estimated_cost}</label>
                                <input type="range" name="estimated_cost" min="50" max="2500" step="50" value={formData.estimated_cost}
                                    onChange={(e) => setFormData({ ...formData, estimated_cost: parseInt(e.target.value) })}
                                    className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-foreground" />
                                <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>₹50</span><span>₹2500</span></div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-foreground mb-1.5 block">WhatsApp Number</label>
                                <input type="tel" name="whatsapp_number" value={formData.whatsapp_number} onChange={handleChange} required placeholder="e.g. 9876543210"
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" />
                            </div>
                            <p className="text-xs text-muted-foreground">Your request will be visible to all writers for 7 days.</p>
                            <button type="submit" disabled={submitting}
                                className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 transition-colors disabled:opacity-50">
                                {submitting ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Submitting...</> : <><Send className="mr-1.5 h-4 w-4" /> Submit Request</>}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <button onClick={() => setShowShareForm(true)}
                            className="group w-full flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-accent/30 transition-colors text-left">
                            <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                                <Send className="h-5 w-5 text-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-foreground">Broadcast Your Assignment</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">Reach all writers instantly. Perfect for urgent requests.</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
                        </button>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-lg font-semibold text-foreground">Available Writers</h1>
                                <p className="text-xs text-muted-foreground">{filteredWriters.length} writers</p>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <div className="relative flex-1 sm:w-48">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                    <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                        className="flex h-8 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm" />
                                </div>
                                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                                    className="flex h-8 rounded-md border border-input bg-background px-2 text-xs">
                                    <option value="all">All</option><option value="active">Available</option><option value="busy">Busy</option>
                                </select>
                                <select value={streamFilter} onChange={(e) => setStreamFilter(e.target.value)}
                                    className="flex h-8 rounded-md border border-input bg-background px-2 text-xs hidden sm:flex">
                                    <option value="all">All Streams</option>
                                    {uniqueStreams.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        {filteredWriters.length === 0 ? (
                            <div className="py-16 text-center">
                                <User className="h-8 w-8 text-muted-foreground mx-auto mb-3" strokeWidth={1.5} />
                                <h3 className="text-sm font-semibold text-foreground mb-1">No writers found</h3>
                                <p className="text-xs text-muted-foreground">Try adjusting your filters or broadcast your request.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredWriters.map(writer => (
                                    <button key={writer.id} onClick={() => handleWriterClick(writer.id)}
                                        className="group bg-card rounded-lg border border-border overflow-hidden hover:border-foreground/20 transition-colors text-left flex flex-col">
                                        <div className="h-40 w-full bg-muted overflow-hidden">
                                            <img src={writer.sample_work_image || ''} alt={`${writer.name}'s work`}
                                                className="w-full h-full object-cover"
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                loading="lazy" />
                                        </div>
                                        <div className="p-4 flex-1 flex flex-col">
                                            <div className="flex justify-between items-start mb-1.5">
                                                <h3 className="text-sm font-semibold text-foreground truncate">{writer.name}</h3>
                                                <div className="flex items-center gap-1 text-xs font-medium text-foreground shrink-0">
                                                    <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                                                    {typeof writer.rating === 'number' ? writer.rating.toFixed(1) : parseFloat(writer.rating as string).toFixed(1)}
                                                    <span className="text-muted-foreground">({writer.total_ratings})</span>
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                                                <BookOpen className="h-3 w-3" /> {writer.university_stream}
                                            </p>
                                            <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <div className={cn("h-1.5 w-1.5 rounded-full", getStatusColor(writer.writer_status))} />
                                                    <span className="text-xs text-muted-foreground">{writer.writer_status === 'active' ? 'Available' : 'Busy'}</span>
                                                </div>
                                                <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                                                    View <ChevronRight className="h-3 w-3 ml-0.5" />
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default FindWriter;
