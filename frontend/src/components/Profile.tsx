import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import { API } from '../utils/api';
import { GuestContext } from '../App';
import { User, AlertTriangle, Star, Loader2, ShieldAlert } from 'lucide-react';
import { cn } from '../utils/cn';
import { toast } from 'sonner';

interface UserData {
    id: number; name: string; email: string; profile_picture: string; university_stream: string;
    whatsapp_number: string; writer_status: 'active' | 'busy' | 'inactive'; rating: number; total_ratings: number;
}

interface Portfolio { sample_work_image: string; description: string; }

const Profile: React.FC = () => {
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const navigate = useNavigate();
    const [user, setUser] = useState<UserData | null>(null);
    const [portfolio, setPortfolio] = useState<Portfolio>({ sample_work_image: '', description: '' });
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const { isGuest } = useContext(GuestContext);

    useEffect(() => {
        if (isGuest) { setLoading(false); return; }
        fetch(API.users.profile, { method: 'GET', credentials: 'include', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' } })
        .then(res => { if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`); return res.json(); })
        .then(data => { setUser(data); if (data.portfolio) setPortfolio(data.portfolio); setLoading(false); })
        .catch(() => { toast.error('Failed to load profile.'); setLoading(false); });
    }, [isGuest]);

    const handleWriterStatusUpdate = async (status: 'active' | 'busy' | 'inactive') => {
        try {
            if ((status === 'active' || status === 'busy') && (!user?.whatsapp_number || user.whatsapp_number.trim() === '')) {
                toast.error('Please add your WhatsApp number first'); return;
            }
            setIsUpdating(true);
            const response = await fetch(API.users.updateWriterProfile, {
                method: 'PUT', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, credentials: 'include',
                body: JSON.stringify({ writer_status: status, university_stream: user?.university_stream || '', whatsapp_number: user?.whatsapp_number || '' })
            });
            if (response.ok) { setUser(await response.json()); toast.success('Profile updated!'); }
            else { const t = await response.text(); try { toast.error(JSON.parse(t).error || 'Update failed'); } catch (e) { toast.error('Update failed'); } }
        } catch (error) { toast.error('Update failed'); } finally { setIsUpdating(false); }
    };

    const isValidImageUrl = (url: string): boolean => {
        if (!url) return false;
        const exts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
        const hosts = ['imagekit.io', 'imgur.com', 'i.imgur.com', 'ibb.co', 'cloudinary.com', 'res.cloudinary.com', 'drive.google.com', 'dropbox.com', 'freeimage.host', 'iili.io'];
        return exts.some(e => url.toLowerCase().includes(e)) || hosts.some(h => url.toLowerCase().includes(h)) || url.includes('drive.google.com/uc?export=');
    };
    
    const handlePortfolioUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        let imageUrl = portfolio.sample_work_image;
        if (!imageUrl) { toast.error('Please provide an image URL'); return; }
        try {
            if (imageUrl.includes('drive.google.com')) {
                let fileId = null;
                if (imageUrl.includes('/file/d/')) { const m = imageUrl.match(/\/d\/([^/?]+)/); if (m?.[1]) fileId = m[1]; }
                else if (imageUrl.includes('open?id=') || (imageUrl.includes('uc?') && imageUrl.includes('id='))) { fileId = new URL(imageUrl).searchParams.get('id'); }
                if (fileId) imageUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
            } else if (imageUrl.includes('dropbox.com')) { imageUrl = imageUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace(/\?dl=[01]/, ''); }
            else if (imageUrl.includes('imgur.com') && !imageUrl.includes('i.imgur.com') && !imageUrl.match(/\.(jpg|jpeg|png|gif)$/i)) { imageUrl = imageUrl.replace('imgur.com', 'i.imgur.com') + '.jpg'; }
        } catch (error) { /* use original */ }
        if (!isValidImageUrl(imageUrl)) toast.error('URL may not be a valid image.');
        setIsUpdating(true);
        try {
            const response = await fetch(API.users.updatePortfolio, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, credentials: 'include', body: JSON.stringify({ ...portfolio, sample_work_image: imageUrl }) });
            if (response.ok) { toast.success('Portfolio updated!'); setPortfolio(prev => ({ ...prev, sample_work_image: imageUrl })); }
            else { const d = await response.json(); toast.error(d.error || 'Update failed'); }
        } catch (error) { toast.error('Update failed'); } finally { setIsUpdating(false); }
    };

    const handleDeleteAccount = async () => {
        try {
            setDeleteError(null);
            const response = await fetch(API.users.deleteAccount, { method: 'DELETE', credentials: 'include', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ confirmDelete: 'DELETE_MY_ACCOUNT_PERMANENTLY' }) });
            if (!response.ok) { const t = await response.text(); try { setDeleteError(JSON.parse(t).error || 'Failed'); } catch (e) { setDeleteError('Failed'); } return; }
            navigate('/account-deleted');
        } catch (error) { setDeleteError('Failed to delete account.'); }
    };

    if (loading) return (<div className="min-h-screen bg-background flex flex-col"><Header title="Profile" /><div className="flex-1 flex justify-center items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div></div>);
    if (isGuest) return (
        <div className="min-h-screen bg-background flex flex-col"><Header title="Profile" />
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 max-w-sm mx-auto">
                <User className="h-8 w-8 text-muted-foreground mb-3" />
                <h2 className="text-base font-semibold text-foreground mb-1">Guest Mode</h2>
                <p className="text-sm text-muted-foreground mb-6">Sign in to access your profile.</p>
                <button onClick={() => navigate('/login')} className="h-8 px-4 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium">Sign In</button>
            </div>
        </div>
    );
    if (!user) return null;

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
            <Header title="Account Settings" />
            <main className="flex-1 max-w-2xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border">
                    <div className="h-14 w-14 rounded-full border border-border bg-muted overflow-hidden shrink-0">
                        <img src={user.profile_picture} alt={user.name} className="h-full w-full object-cover" />
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold text-foreground">{user.name}</h1>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-medium text-foreground capitalize">{user.writer_status === 'active' ? 'Available' : user.writer_status}</span>
                            {user.rating > 0 && (
                                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> {parseFloat(String(user.rating)).toFixed(1)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <section>
                        <h2 className="text-sm font-semibold text-foreground mb-4">Personal Details</h2>
                        <div className="space-y-4 border border-border rounded-lg p-4 bg-card">
                            <div>
                                <label className="text-xs font-medium text-foreground mb-1.5 block">University Stream</label>
                                <select value={user.university_stream || ''} onChange={(e) => setUser({ ...user, university_stream: e.target.value })}
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                                    <option value="" disabled>Select stream</option>
                                    <option value="B.Tech - Computer Science">B.Tech - Computer Science</option>
                                    <option value="B.Tech - Information Technology">B.Tech - Information Technology</option>
                                    <option value="B.Tech - Electronics & Communication">B.Tech - Electronics & Communication</option>
                                    <option value="B.Tech - Mechanical">B.Tech - Mechanical</option>
                                    <option value="B.Tech - Civil">B.Tech - Civil</option>
                                    <option value="B.Tech - Electrical">B.Tech - Electrical</option>
                                    <option value="B.Tech - Biotechnology">B.Tech - Biotechnology</option>
                                    <option value="Bachelor of Business Administration (BBA)">BBA</option>
                                    <option value="Bachelor of Computer Applications (BCA)">BCA</option>
                                    <option value="Bachelor of Arts (BA)">BA</option>
                                    <option value="Bachelor of Science (BSc)">BSc</option>
                                    <option value="Bachelor of Commerce (BCom)">BCom</option>
                                    <option value="Master of Technology (M.Tech)">M.Tech</option>
                                    <option value="Master of Business Administration (MBA)">MBA</option>
                                    <option value="Master of Computer Applications (MCA)">MCA</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-foreground mb-1.5 block">WhatsApp Number</label>
                                <input type="tel" value={user.whatsapp_number || ''} onChange={(e) => setUser({ ...user, whatsapp_number: e.target.value })} placeholder="e.g. 9876543210"
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" />
                                {!user.whatsapp_number && <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Required for writer status</p>}
                            </div>
                            <div>
                                <label className="text-xs font-medium text-foreground mb-2 block">Writer Status</label>
                                <div className="flex bg-muted p-0.5 rounded-md border border-border w-fit">
                                    {(['active', 'busy', 'inactive'] as const).map(status => (
                                        <button key={status} onClick={() => handleWriterStatusUpdate(status)}
                                            disabled={(!user.whatsapp_number && status !== 'inactive') || isUpdating}
                                            className={cn("px-3 py-1 text-xs font-medium rounded-sm transition-colors capitalize",
                                                user.writer_status === status ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                                                (!user.whatsapp_number && status !== 'inactive') && "opacity-40 cursor-not-allowed")}>
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="pt-3 border-t border-border flex justify-end">
                                <button onClick={() => handleWriterStatusUpdate(user.writer_status)} disabled={isUpdating}
                                    className="h-8 px-4 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium disabled:opacity-50">
                                    {isUpdating && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5 inline" />}Save
                                </button>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-sm font-semibold text-foreground mb-4">Portfolio</h2>
                        <form onSubmit={handlePortfolioUpdate} className="space-y-4 border border-border rounded-lg p-4 bg-card">
                            <div>
                                <label className="text-xs font-medium text-foreground mb-1.5 block">Sample Work Image URL</label>
                                <input type="url" value={portfolio.sample_work_image} onChange={(e) => setPortfolio(prev => ({ ...prev, sample_work_image: e.target.value }))} placeholder="https://example.com/image.jpg"
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" />
                            </div>
                            {portfolio.sample_work_image && (
                                <div className="rounded-md border border-border overflow-hidden bg-muted">
                                    <img src={portfolio.sample_work_image} alt="Preview" className="w-full h-40 object-cover"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                </div>
                            )}
                            <div>
                                <label className="text-xs font-medium text-foreground mb-1.5 block">Description</label>
                                <textarea value={portfolio.description} onChange={(e) => setPortfolio(prev => ({ ...prev, description: e.target.value }))} rows={4}
                                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                                    placeholder="Describe your experience and expertise..." />
                            </div>
                            <div className="pt-3 border-t border-border flex justify-end">
                                <button type="submit" disabled={isUpdating} className="h-8 px-4 text-sm rounded-md border border-border bg-background hover:bg-accent transition-colors font-medium disabled:opacity-50">
                                    {isUpdating && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5 inline" />}Update Portfolio
                                </button>
                            </div>
                        </form>
                    </section>

                    <section>
                        <h2 className="text-sm font-semibold text-destructive mb-4 flex items-center gap-1.5"><ShieldAlert className="w-4 h-4" /> Danger Zone</h2>
                        <div className="border border-destructive/20 rounded-lg p-4 flex items-center justify-between bg-destructive/5 dark:bg-destructive/10">
                            <div>
                                <p className="text-sm font-medium text-foreground">Delete Account</p>
                                <p className="text-xs text-muted-foreground">Permanently remove all your data.</p>
                            </div>
                            <button onClick={() => setShowDeleteConfirmation(true)}
                                className="h-8 px-3 text-xs rounded-md border border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors font-medium">
                                Delete
                            </button>
                        </div>
                    </section>
                </div>
            </main>
            
            {showDeleteConfirmation && (
                <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-lg max-w-sm w-full p-6">
                        <div className="flex items-center gap-2 text-destructive mb-3">
                            <AlertTriangle className="h-5 w-5" />
                            <h3 className="text-base font-semibold">Delete Account</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-6">This will permanently remove all your data, assignments, and portfolio. This cannot be undone.</p>
                        {deleteError && <div className="mb-4 p-2.5 rounded-md bg-destructive/10 border border-destructive/20 text-sm text-destructive">{deleteError}</div>}
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowDeleteConfirmation(false)} className="h-8 px-3 text-sm rounded-md border border-border hover:bg-accent transition-colors">Cancel</button>
                            <button onClick={handleDeleteAccount} className="h-8 px-3 text-sm rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors">Delete account</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
