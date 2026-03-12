import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import { API } from '../utils/api';
import { GuestContext } from '../App';
import { User, AlertTriangle, Star, Image as ImageIcon, Trash2, Loader2 } from 'lucide-react';
import { cn } from '../utils/cn';
import { toast } from 'sonner';

interface UserData {
    id: number;
    name: string;
    email: string;
    profile_picture: string;
    university_stream: string;
    whatsapp_number: string;
    writer_status: 'active' | 'busy' | 'inactive';
    rating: number;
    total_ratings: number;
}

interface Portfolio {
    sample_work_image: string;
    description: string;
}

const Profile: React.FC = () => {
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const navigate = useNavigate();
    const [user, setUser] = useState<UserData | null>(null);
    const [portfolio, setPortfolio] = useState<Portfolio>({
        sample_work_image: '',
        description: ''
    });
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    const { isGuest } = useContext(GuestContext);

    useEffect(() => {
        if (isGuest) {
            setLoading(false);
            return;
        }

        fetch(API.users.profile, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            setUser(data);
            if (data.portfolio) {
                setPortfolio(data.portfolio);
            }
            setLoading(false);
        })
        .catch(error => {
            console.error('Error fetching profile:', error);
            toast.error('Failed to load profile. Please try again later.');
            setLoading(false);
        });
    }, [isGuest]);

    const handleWriterStatusUpdate = async (status: 'active' | 'busy' | 'inactive') => {
        try {
            if ((status === 'active' || status === 'busy') && (!user?.whatsapp_number || user.whatsapp_number.trim() === '')) {
                toast.error('Please add your WhatsApp number before setting your status');
                return;
            }
            
            setIsUpdating(true);
            
            const response = await fetch(API.users.updateWriterProfile, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    writer_status: status,
                    university_stream: user?.university_stream || '',
                    whatsapp_number: user?.whatsapp_number || ''
                })
            });

            if (response.ok) {
                const updatedUser = await response.json();
                setUser(updatedUser);
                toast.success('Profile updated successfully!');
            } else {
                const errorText = await response.text();
                try {
                    const error = JSON.parse(errorText);
                    toast.error(error.error || 'Failed to update profile');
                } catch (e) {
                    toast.error('Failed to update profile');
                }
            }
        } catch (error) {
            toast.error('Failed to update profile');
        } finally {
            setIsUpdating(false);
        }
    };

    const isValidImageUrl = (url: string): boolean => {
        if (!url) return false;
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
        const hasImageExtension = imageExtensions.some(ext => url.toLowerCase().includes(ext));
        const imageHostingDomains = [
            'imagekit.io', 'imgur.com', 'i.imgur.com', 'ibb.co', 'i.ibb.co', 'postimg.cc',
            'cloudinary.com', 'res.cloudinary.com', 'flickr.com', 'imgbb.com',
            'drive.google.com', 'dropbox.com', 'dl.dropboxusercontent.com', 
            'onedrive.live.com', '1drv.ms', 'freeimage.host', 'iili.io', 'imgbox.com'
        ];
        const isFromImageHost = imageHostingDomains.some(domain => url.toLowerCase().includes(domain));
        const isGoogleDriveImage = url.includes('drive.google.com/uc?export=');
        return isFromImageHost || isGoogleDriveImage || hasImageExtension;
    };
    
    const handlePortfolioUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        
        let imageUrl = portfolio.sample_work_image;
        if (!imageUrl) {
            toast.error('Please provide an image URL');
            return;
        }
        
        try {
            if (imageUrl.includes('drive.google.com')) {
                let fileId = null;
                if (imageUrl.includes('/file/d/')) {
                    const fileIdMatch = imageUrl.match(/\/d\/([^/?]+)/);
                    if (fileIdMatch && fileIdMatch[1]) fileId = fileIdMatch[1];
                } else if (imageUrl.includes('open?id=')) {
                    const urlObj = new URL(imageUrl);
                    fileId = urlObj.searchParams.get('id');
                } else if (imageUrl.includes('uc?') && imageUrl.includes('id=')) {
                    const urlObj = new URL(imageUrl);
                    fileId = urlObj.searchParams.get('id');
                }
                if (fileId) {
                    imageUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
                }
            } else if (imageUrl.includes('dropbox.com')) {
                imageUrl = imageUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
                imageUrl = imageUrl.replace('?dl=0', '').replace('?dl=1', '');
            } else if (imageUrl.includes('imgur.com') && !imageUrl.includes('i.imgur.com')) {
                if (!imageUrl.match(/\.(jpg|jpeg|png|gif)$/i)) {
                    imageUrl = imageUrl.replace('imgur.com', 'i.imgur.com') + '.jpg';
                }
            } else if (imageUrl.includes('ibb.co')) {
                if (!imageUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                    const ibbMatch = imageUrl.match(/ibb\.co\/([^/?]+)/);
                    if (ibbMatch && ibbMatch[1]) {
                        imageUrl = `https://i.ibb.co/${ibbMatch[1]}/image.jpg`;
                    }
                }
            } else if (imageUrl.includes('freeimage.host')) {
                if (imageUrl.includes('/i/')) {
                    const imageIdMatch = imageUrl.match(/\/i\/([^/?]+)/);
                    if (imageIdMatch && imageIdMatch[1]) {
                        imageUrl = `https://iili.io/${imageIdMatch[1]}.jpg`;
                    }
                }
            }
        } catch (error) {
            // Ignore processing errors and use original URL
        }
        
        if (!isValidImageUrl(imageUrl)) {
            toast.error('The URL may not be a valid image. Please ensure it points directly to an image file.');
        }
        
        setIsUpdating(true);
        try {
            const response = await fetch(API.users.updatePortfolio, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    ...portfolio,
                    sample_work_image: imageUrl
                })
            });

            if (response.ok) {
                toast.success('Portfolio updated successfully!');
                setPortfolio(prevState => ({
                    ...prevState,
                    sample_work_image: imageUrl
                }));
            } else {
                const error = await response.json();
                toast.error(error.error || 'Failed to update portfolio');
            }
        } catch (error) {
            toast.error('Failed to update portfolio');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteAccount = async () => {
        try {
            setDeleteError(null);
            const response = await fetch(API.users.deleteAccount, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    confirmDelete: 'DELETE_MY_ACCOUNT_PERMANENTLY'
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                try {
                    const error = JSON.parse(errorText);
                    setDeleteError(error.error || 'Failed to delete account');
                } catch (e) {
                    setDeleteError('Failed to delete account');
                }
                return;
            }

            navigate('/account-deleted');
        } catch (error) {
            setDeleteError('Failed to delete account. Please try again later.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Header title="My Profile" />
                <div className="flex-1 flex justify-center items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    if (isGuest) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Header title="My Profile" />
                <div className="flex-1 max-w-3xl w-full mx-auto p-6 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-6">
                        <User className="h-10 w-10 text-yellow-600 dark:text-yellow-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Guest Mode</h2>
                    <p className="text-muted-foreground max-w-md mb-8">
                        You are currently browsing as a guest. To access your profile and use all features, please sign in with your university email address.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 h-10 px-8"
                    >
                        Sign In
                    </button>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header title="My Profile" />
            
            <main className="flex-1 max-w-7xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Personal Info & Settings */}
                    <div className="lg:col-span-5 space-y-8">
                        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                            <div className="p-6">
                                <div className="flex items-center gap-5 mb-8">
                                    <img
                                        src={user.profile_picture}
                                        alt={user.name}
                                        className="h-20 w-20 rounded-full border-2 border-border object-cover"
                                    />
                                    <div>
                                        <h2 className="text-2xl font-bold text-foreground">{user.name}</h2>
                                        <p className="text-sm text-muted-foreground">{user.email}</p>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1.5">University Stream</label>
                                        <input
                                            type="text"
                                            value={user.university_stream || ''}
                                            onChange={(e) => setUser({ ...user, university_stream: e.target.value })}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            placeholder="e.g. B.Tech CSE"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1.5">WhatsApp Number</label>
                                        <input
                                            type="tel"
                                            value={user.whatsapp_number || ''}
                                            onChange={(e) => setUser({ ...user, whatsapp_number: e.target.value })}
                                            placeholder="+91XXXXXXXXXX"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                        {!user.whatsapp_number && (
                                            <p className="mt-2 text-xs text-amber-600 dark:text-amber-500 flex items-center">
                                                <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                                                Required to set status as Available or Busy
                                            </p>
                                        )}
                                    </div>

                                    <div className="pt-2">
                                        <label className="block text-sm font-medium text-foreground mb-3">Writer Status</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            <button
                                                onClick={() => handleWriterStatusUpdate('active')}
                                                disabled={!user.whatsapp_number || isUpdating}
                                                className={cn(
                                                    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-9 px-3",
                                                    user.writer_status === 'active'
                                                        ? "bg-green-600 text-white hover:bg-green-700"
                                                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                                                    (!user.whatsapp_number || isUpdating) && "opacity-50 cursor-not-allowed"
                                                )}
                                            >
                                                Available
                                            </button>
                                            <button
                                                onClick={() => handleWriterStatusUpdate('busy')}
                                                disabled={!user.whatsapp_number || isUpdating}
                                                className={cn(
                                                    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-9 px-3",
                                                    user.writer_status === 'busy'
                                                        ? "bg-amber-600 text-white hover:bg-amber-700"
                                                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                                                    (!user.whatsapp_number || isUpdating) && "opacity-50 cursor-not-allowed"
                                                )}
                                            >
                                                Busy
                                            </button>
                                            <button
                                                onClick={() => handleWriterStatusUpdate('inactive')}
                                                disabled={isUpdating}
                                                className={cn(
                                                    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-9 px-3",
                                                    user.writer_status === 'inactive'
                                                        ? "bg-muted-foreground text-white hover:bg-muted-foreground/90"
                                                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                                                    isUpdating && "opacity-50 cursor-not-allowed"
                                                )}
                                            >
                                                Inactive
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <button
                                        onClick={() => handleWriterStatusUpdate(user.writer_status)}
                                        disabled={isUpdating}
                                        className="w-full mt-4 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4 disabled:opacity-50"
                                    >
                                        {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                        Save Profile Info
                                    </button>
                                </div>
                            </div>
                            
                            {user.rating > 0 && (
                                <div className="border-t border-border bg-muted/20 p-6 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-medium text-foreground">Writer Rating</h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">Based on {user.total_ratings} reviews</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-background px-3 py-1.5 rounded-full border border-border">
                                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                        <span className="font-semibold text-sm">{parseFloat(String(user.rating)).toFixed(1)}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Danger Zone */}
                        <div className="bg-card rounded-xl border border-destructive/20 shadow-sm overflow-hidden">
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-destructive flex items-center gap-2 mb-4">
                                    <AlertTriangle className="h-5 w-5" /> Danger Zone
                                </h3>
                                <p className="text-sm text-muted-foreground mb-6">
                                    Permanently delete your account and all associated data. This action cannot be undone.
                                </p>
                                <button
                                    onClick={() => setShowDeleteConfirmation(true)}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-destructive bg-background hover:bg-destructive hover:text-destructive-foreground h-10 px-4 text-destructive w-full sm:w-auto"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete Account
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Portfolio */}
                    <div className="lg:col-span-7">
                        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden h-full">
                            <div className="p-6">
                                <div className="flex items-center gap-2 mb-6">
                                    <ImageIcon className="h-5 w-5 text-primary" />
                                    <h3 className="text-xl font-semibold text-foreground">Writer Portfolio</h3>
                                </div>
                                
                                <form onSubmit={handlePortfolioUpdate} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1.5">Sample Work Image URL</label>
                                        <input
                                            type="url"
                                            value={portfolio.sample_work_image}
                                            onChange={(e) => setPortfolio(prev => ({ ...prev, sample_work_image: e.target.value }))}
                                            placeholder="https://example.com/image.jpg"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            Provide a direct link to an image showcasing your handwriting or previous work.
                                        </p>
                                    </div>

                                    {portfolio.sample_work_image && (
                                        <div className="rounded-lg border border-border overflow-hidden bg-muted/10 relative group">
                                            <div className="absolute inset-0 bg-background/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                <span className="text-sm font-medium px-3 py-1.5 bg-background rounded-full shadow-sm border border-border">Image Preview</span>
                                            </div>
                                            <img 
                                                src={portfolio.sample_work_image} 
                                                alt="Portfolio Preview" 
                                                className="w-full h-64 object-cover"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20200%22%20preserveAspectRatio%3D%22none%22%3E%3Crect%20width%3D%22400%22%20height%3D%22200%22%20fill%3D%22%23f3f4f6%22%3E%3C%2Frect%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22%239ca3af%22%20font-family%3D%22sans-serif%22%20font-size%3D%2214%22%3EInvalid%20Image%20URL%3C%2Ftext%3E%3C%2Fsvg%3E';
                                                }}
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
                                        <textarea
                                            value={portfolio.description}
                                            onChange={(e) => setPortfolio(prev => ({ ...prev, description: e.target.value }))}
                                            rows={6}
                                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                            placeholder="Describe your writing experience, preferred subjects, and expertise..."
                                        />
                                    </div>

                                    <div className="pt-4 border-t border-border">
                                        <button
                                            type="submit"
                                            disabled={isUpdating}
                                            className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4 disabled:opacity-50"
                                        >
                                            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                            Update Portfolio
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            
            {/* Delete Confirmation Modal */}
            {showDeleteConfirmation && (
                <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-card border border-border shadow-lg rounded-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="flex items-center gap-3 text-destructive mb-4">
                                <AlertTriangle className="h-6 w-6" />
                                <h3 className="text-lg font-semibold">Delete Account</h3>
                            </div>
                            <p className="text-sm text-muted-foreground mb-6">
                                Are you absolutely sure you want to delete your account? This action cannot be undone and will permanently remove all your data, assignments, and portfolio.
                            </p>
                            
                            {deleteError && (
                                <div className="mb-6 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                                    {deleteError}
                                </div>
                            )}
                            
                            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirmation(false)}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 px-4"
                                >
                                    Yes, delete my account
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;