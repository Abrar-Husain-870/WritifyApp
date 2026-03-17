import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API } from '../utils/api';
import Header from './Header';
import { Star, BookOpen, User, CheckCircle2, AlertCircle, Loader2, Send } from 'lucide-react';
import { cn } from '../utils/cn';

interface Writer {
    id: number; name: string; email: string; profile_picture: string; university_stream: string;
    whatsapp_number: string; whatsapp_redirect?: string; writer_status: 'active' | 'busy' | 'inactive';
    rating: number | string; total_ratings: number; sample_work_image?: string;
}

interface AssignmentRequest {
    course_name: string; course_code: string; assignment_type: string; num_pages: number;
    deadline: string; estimated_cost: number; whatsapp_number: string;
}

const WriterProfile: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [writer, setWriter] = useState<Writer | null>(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState<AssignmentRequest>({ course_name: '', course_code: '', assignment_type: 'class_assignment', num_pages: 1, deadline: '', estimated_cost: 50, whatsapp_number: '' });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        fetch(API.writers.byId(Number(id)), { credentials: 'include' })
        .then(res => res.json())
        .then(data => { if (typeof data?.rating === 'string') data.rating = parseFloat(data.rating) || 0; setWriter(data); setLoading(false); })
        .catch(() => setLoading(false));
    }, [id]);

    const validateForm = () => {
        if (formData.course_name.length > 255) { setError('Course name too long'); return false; }
        if (formData.course_code.length > 50) { setError('Course code too long'); return false; }
        if (isNaN(parseInt(formData.num_pages.toString())) || parseInt(formData.num_pages.toString()) <= 0) { setError('Pages must be positive'); return false; }
        if (isNaN(parseFloat(formData.estimated_cost.toString())) || parseFloat(formData.estimated_cost.toString()) <= 0 || parseFloat(formData.estimated_cost.toString()) % 50 !== 0) { setError('Cost must be a positive multiple of 50'); return false; }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSubmitting(true); setError(null);
        if (!validateForm()) { setSubmitting(false); return; }
        try {
            const response = await fetch(API.assignmentRequests.create, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
                body: JSON.stringify({ writer_id: Number(id), course_name: formData.course_name.substring(0, 255), course_code: formData.course_code.substring(0, 50), assignment_type: formData.assignment_type.substring(0, 100), num_pages: parseInt(formData.num_pages.toString()), estimated_cost: parseFloat(formData.estimated_cost.toString()), deadline: formData.deadline, whatsapp_number: formData.whatsapp_number }) });
            if (response.ok) {
                const data = await response.json();
                let phone = (writer?.whatsapp_number || writer?.whatsapp_redirect || '').replace(/\D/g, '');
                if (!phone) { setSuccess('Request submitted!'); setTimeout(() => navigate('/dashboard'), 1000); return; }
                if (phone.length === 10) phone = '91' + phone;
                if (phone.length < 10) { setSuccess('Request submitted!'); setTimeout(() => navigate('/dashboard'), 1000); return; }
                const msg = encodeURIComponent(`Hi, I've submitted an assignment request for ${formData.course_name}${data.unique_id ? ` [ID: ${data.unique_id}]` : ''}. Let's discuss.`);
                setSuccess('Request submitted! Connecting to WhatsApp...');
                setTimeout(() => { window.open(`https://wa.me/${phone}?text=${msg}`, '_blank'); setTimeout(() => navigate('/dashboard'), 1000); }, 500);
            } else { const d = await response.json(); setError(d.error || 'Failed to submit.'); }
        } catch (error) { setError('Network error. Please try again.'); } finally { setSubmitting(false); }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { setFormData(prev => ({ ...prev, [e.target.name]: e.target.value })); };

    if (loading) return (<div className="min-h-screen bg-background flex flex-col"><Header title="Writer Profile" /><div className="flex-1 flex justify-center items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div></div>);
    if (!writer) return (<div className="min-h-screen bg-background flex flex-col"><Header title="Writer Profile" /><div className="flex-1 flex flex-col items-center justify-center text-center p-6"><User className="h-8 w-8 text-muted-foreground mb-3" /><h3 className="text-base font-semibold text-foreground mb-1">Writer Not Found</h3><p className="text-sm text-muted-foreground">This writer doesn't exist or has been removed.</p></div></div>);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header title={writer.name} />
            <main className="flex-1 max-w-5xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-5 space-y-6">
                        <div className="border border-border rounded-lg bg-card p-5">
                            <div className="flex items-center gap-4 mb-5">
                                <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border overflow-hidden">
                                    {writer.profile_picture ? <img src={writer.profile_picture} alt={writer.name} className="h-full w-full object-cover" /> : <User className="h-6 w-6 text-muted-foreground" />}
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">{writer.name}</h2>
                                    <div className="flex items-center gap-1 text-sm">
                                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                                        <span className="font-medium">{parseFloat(String(writer.rating)).toFixed(1)}</span>
                                        <span className="text-muted-foreground text-xs">({writer.total_ratings})</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">Stream:</span><span className="font-medium text-foreground">{writer.university_stream}</span></div>
                                <div className="flex items-center gap-2">
                                    <div className={cn("h-1.5 w-1.5 rounded-full", writer.writer_status === 'active' ? 'bg-emerald-500' : writer.writer_status === 'busy' ? 'bg-amber-500' : 'bg-muted-foreground')} />
                                    <span className="text-muted-foreground">Status:</span>
                                    <span className="font-medium text-foreground">{writer.writer_status === 'active' ? 'Available' : writer.writer_status === 'busy' ? 'Busy' : 'Inactive'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="border border-border rounded-lg bg-card overflow-hidden">
                            <div className="px-4 py-3 border-b border-border text-sm font-medium text-foreground">Sample Work</div>
                            <div className="aspect-[3/4] w-full bg-muted">
                                <img src={writer.sample_work_image || ''} alt="Sample work" className="w-full h-full object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-7">
                        <div className="border border-border rounded-lg bg-card">
                            <div className="px-5 py-4 border-b border-border">
                                <h3 className="text-base font-semibold text-foreground">Submit Request</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">Send a direct request to {writer.name}</p>
                            </div>
                            <div className="p-5">
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="text-xs font-medium text-foreground mb-1.5 block">Course Name</label><input type="text" name="course_name" value={formData.course_name} onChange={handleChange} required className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" placeholder="e.g. Data Structures" /></div>
                                        <div><label className="text-xs font-medium text-foreground mb-1.5 block">Course Code</label><input type="text" name="course_code" value={formData.course_code} onChange={handleChange} required className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" placeholder="e.g. CS301" /></div>
                                    </div>
                                    <div><label className="text-xs font-medium text-foreground mb-1.5 block">Assignment Type</label><select name="assignment_type" value={formData.assignment_type} onChange={handleChange} required className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="class_assignment">Class Assignment</option><option value="lab_file">Lab File</option><option value="workshop_file">Workshop File</option><option value="graphics_sheet">Graphics Sheet</option></select></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="text-xs font-medium text-foreground mb-1.5 block">Pages</label><input type="number" name="num_pages" value={formData.num_pages} onChange={handleChange} required min="1" className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" /></div>
                                        <div><label className="text-xs font-medium text-foreground mb-1.5 block">Deadline</label><input type="date" name="deadline" value={formData.deadline} onChange={handleChange} required className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm [color-scheme:light] dark:[color-scheme:dark]" /></div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-foreground mb-1.5 block">Cost: ₹{formData.estimated_cost}</label>
                                        <input type="range" name="estimated_cost" min="50" max="2500" step="50" value={formData.estimated_cost} onChange={(e) => setFormData({ ...formData, estimated_cost: parseInt(e.target.value) })} className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-foreground" />
                                        <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>₹50</span><span>₹2500</span></div>
                                    </div>
                                    <div><label className="text-xs font-medium text-foreground mb-1.5 block">WhatsApp Number</label><input type="tel" name="whatsapp_number" value={formData.whatsapp_number} onChange={handleChange} required placeholder="e.g. 9876543210" className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" /></div>
                                    <p className="text-xs text-muted-foreground">Request visible for 7 days.</p>
                                    {error && <div className="p-2.5 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20 flex items-center gap-2"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
                                    {success && <div className="p-2.5 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 rounded-md border border-emerald-200 dark:border-emerald-800 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 shrink-0" />{success}</div>}
                                    <button type="submit" disabled={submitting || writer.writer_status === 'inactive'}
                                        className={cn("w-full h-9 rounded-md text-sm font-medium transition-colors inline-flex items-center justify-center", writer.writer_status === 'inactive' ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50")}>
                                        {submitting ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Submitting...</> : writer.writer_status === 'inactive' ? 'Writer is inactive' : <><Send className="mr-1.5 h-4 w-4" /> Submit & Connect</>}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default WriterProfile;
