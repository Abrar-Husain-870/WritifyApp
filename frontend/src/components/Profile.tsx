import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header'; // Assuming the Header component is in the same directory
import { API } from '../utils/api'; // Correct import path for the API utility
import { debugLog, errorLog } from '../utils/logUtil';

import { GuestContext } from '../App';

interface User {
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
    const [user, setUser] = useState<User | null>(null);
    const [portfolio, setPortfolio] = useState<Portfolio>({
        sample_work_image: '',
        description: ''
    });
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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
                console.error(`Profile fetch failed with status: ${res.status}`);
                return res.text().then(text => {
                    try {
                        const errorData = JSON.parse(text);
                        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
                    } catch (e) {
                        throw new Error(`HTTP error! status: ${res.status}`);
                    }
                });
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
            setMessage({
                type: 'error',
                text: 'Failed to load profile. Please try again later.'
            });
            setLoading(false);
        });
    }, [isGuest]);

    const handleWriterStatusUpdate = async (status: 'active' | 'busy' | 'inactive') => {
        try {
            if ((status === 'active' || status === 'busy') && (!user?.whatsapp_number || user.whatsapp_number.trim() === '')) {
                setMessage({ 
                    type: 'error', 
                    text: 'Please add your WhatsApp number before setting your status to Available or Busy' 
                });
                return;
            }
            
            debugLog('Submitting profile update with data:', { writer_status: status, university_stream: user?.university_stream || '', whatsapp_number: user?.whatsapp_number || '' });
            
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

            debugLog('Response status:', response.status);
            
            if (response.ok) {
                const updatedUser = await response.json();
                debugLog('Profile data received:', updatedUser);
                setUser(updatedUser);
                setMessage({ type: 'success', text: 'Writer status updated successfully!' });
            } else {
                const errorText = await response.text();
                errorLog('Profile update error:', errorText);
                try {
                    const error = JSON.parse(errorText);
                    setMessage({ type: 'error', text: error.error || 'Failed to update writer status' });
                } catch (e) {
                    setMessage({ type: 'error', text: 'Failed to update writer status' });
                }
            }
        } catch (error) {
            errorLog('Error updating writer status:', error);
            setMessage({ type: 'error', text: 'Failed to update writer status' });
        }
    };

    // Function to validate if a URL is likely an image URL
    const isValidImageUrl = (url: string): boolean => {
        if (!url) return false;
        
        // Check for common image extensions
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
        const hasImageExtension = imageExtensions.some(ext => url.toLowerCase().includes(ext));
        
        // Check for known image hosting domains
        const imageHostingDomains = [
            // Common image hosting services
            'imagekit.io', 'imgur.com', 'i.imgur.com', 'ibb.co', 'i.ibb.co', 'postimg.cc',
            'cloudinary.com', 'res.cloudinary.com', 'flickr.com', 'imgbb.com',
            
            // Cloud storage services
            'drive.google.com', 'dropbox.com', 'dl.dropboxusercontent.com', 
            'onedrive.live.com', '1drv.ms',
            
            // Additional image hosting services
            'freeimage.host', 'iili.io', 'imgbox.com', 'pasteboard.co',
            'tinypic.com', 'photobucket.com', 'postimages.org', 'imgpile.com',
            'snipboard.io', 'imgtr.ee', 'pixhost.to', 'picr.de'
        ];
        const isFromImageHost = imageHostingDomains.some(domain => url.toLowerCase().includes(domain));
        
        // Special case for Google Drive URLs with export=download or export=view
        const isGoogleDriveImage = url.includes('drive.google.com/uc?export=');
        
        // If it's from a known image host or a special case URL, we'll trust it
        // Otherwise, it should have a valid image extension
        return isFromImageHost || isGoogleDriveImage || hasImageExtension;
    };
    
    const handlePortfolioUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        
        let imageUrl = portfolio.sample_work_image;
        if (!imageUrl) {
            setMessage({ type: 'error', text: 'Please provide an image URL' });
            return;
        }
        
        // Process various URL types
        try {
            // Google Drive handling
            if (imageUrl.includes('drive.google.com')) {
                // Extract file ID from various Google Drive URL formats
                let fileId = null;
                
                // Format: https://drive.google.com/file/d/FILE_ID/view
                if (imageUrl.includes('/file/d/')) {
                    const fileIdMatch = imageUrl.match(/\/d\/([^/\?]+)/);
                    if (fileIdMatch && fileIdMatch[1]) {
                        fileId = fileIdMatch[1];
                    }
                } 
                // Format: https://drive.google.com/open?id=FILE_ID
                else if (imageUrl.includes('open?id=')) {
                    const urlObj = new URL(imageUrl);
                    fileId = urlObj.searchParams.get('id');
                }
                // Format: https://drive.google.com/uc?export=view&id=FILE_ID
                else if (imageUrl.includes('uc?') && imageUrl.includes('id=')) {
                    const urlObj = new URL(imageUrl);
                    fileId = urlObj.searchParams.get('id');
                }
                
                if (fileId) {
                    // Use the export=download parameter for better compatibility
                    imageUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
                    debugLog('Converted Google Drive URL:', imageUrl);
                }
            } 
            // Dropbox handling
            else if (imageUrl.includes('dropbox.com')) {
                // Convert dropbox share links to direct links
                imageUrl = imageUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
                imageUrl = imageUrl.replace('?dl=0', '').replace('?dl=1', '');
                debugLog('Converted Dropbox URL:', imageUrl);
            } 
            // OneDrive handling
            else if (imageUrl.includes('1drv.ms') || imageUrl.includes('onedrive.live.com')) {
                debugLog('OneDrive URL detected. Using as is:', imageUrl);
            } 
            // Imgur handling
            else if (imageUrl.includes('imgur.com') && !imageUrl.includes('i.imgur.com')) {
                // Convert regular imgur links to direct image links if needed
                if (!imageUrl.match(/\.(jpg|jpeg|png|gif)$/i)) {
                    imageUrl = imageUrl.replace('imgur.com', 'i.imgur.com') + '.jpg';
                    debugLog('Converted Imgur URL:', imageUrl);
                }
            }
            // ImgBB handling (ibb.co)
            else if (imageUrl.includes('ibb.co')) {
                // ibb.co links are already direct, but make sure we're getting the image
                if (!imageUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                    // If it's a sharing page URL, try to extract the image ID
                    const ibbMatch = imageUrl.match(/ibb\.co\/([^/\?]+)/);
                    if (ibbMatch && ibbMatch[1]) {
                        // Convert to direct image URL format
                        imageUrl = `https://i.ibb.co/${ibbMatch[1]}/image.jpg`;
                        debugLog('Converted ImgBB URL:', imageUrl);
                    }
                }
            }
            // FreeImage.host handling
            else if (imageUrl.includes('freeimage.host')) {
                // Convert viewing URL to direct image URL
                if (imageUrl.includes('/i/')) {
                    const imageIdMatch = imageUrl.match(/\/i\/([^/\?]+)/);
                    if (imageIdMatch && imageIdMatch[1]) {
                        imageUrl = `https://iili.io/${imageIdMatch[1]}.jpg`;
                        debugLog('Converted FreeImage.host URL:', imageUrl);
                    }
                }
            }
        } catch (error) {
            debugLog('Error processing image URL:', error);
            // Continue with the original URL if there's an error in processing
        }
        
        // Validate the URL is likely an image
        if (!isValidImageUrl(imageUrl)) {
            setMessage({ 
                type: 'error', 
                text: 'The URL may not be a valid image. Please ensure it points directly to an image file.'
            });
            // We'll still continue with the submission, but warn the user
        }
        
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
                setMessage({ type: 'success', text: 'Portfolio updated successfully!' });
                setPortfolio(prevState => ({
                    ...prevState,
                    sample_work_image: imageUrl
                }));
            } else {
                const error = await response.json();
                setMessage({ type: 'error', text: error.error || 'Failed to update portfolio' });
            }
        } catch (error) {
            console.error('Error updating portfolio:', error);
            setMessage({ type: 'error', text: 'Failed to update portfolio' });
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
                console.error('Error deleting account:', errorText);
                try {
                    const error = JSON.parse(errorText);
                    setDeleteError(error.error || 'Failed to delete account');
                } catch (e) {
                    setDeleteError('Failed to delete account');
                }
                return;
            }

            console.log('Account deletion successful, redirecting to confirmation page');
            navigate('/account-deleted');
        } catch (error) {
            console.error('Error deleting account:', error);
            setDeleteError('Failed to delete account. Please try again later.');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <p className="mt-4 text-gray-600">Loading profile...</p>
            </div>
        );
    }

    if (isGuest) {
        return (
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg p-8">
                <div className="text-center py-12">
                    <div className="mx-auto w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">Guest Mode</h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                        You are currently browsing as a guest. To access your profile and use all features, please sign in with your university email address.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Sign In
                    </button>
                </div>
            </div>
        );
    }

    if (!user) {
        return <div>User not found</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header title="My Profile" />
            
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {message && (
                    <div className={`p-4 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-8">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                            <div className="flex items-center space-x-4 mb-6">
                                <img
                                    src={user.profile_picture}
                                    alt={user.name}
                                    className="h-16 w-16 rounded-full"
                                />
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{user.name}</h2>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">{user?.email}</dd>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">University Stream</label>
                                    <input
                                        type="text"
                                        value={user.university_stream || ''}
                                        onChange={(e) => setUser({ ...user, university_stream: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">WhatsApp Number</label>
                                    <input
                                        type="tel"
                                        value={user.whatsapp_number || ''}
                                        onChange={(e) => setUser({ ...user, whatsapp_number: e.target.value })}
                                        placeholder="+91XXXXXXXXXX"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                    {!user.whatsapp_number && (
                                        <p className="mt-1 text-sm text-amber-600">
                                            * Required to set your status as Available or Busy
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">Writer Status</label>
                                    <div className="flex space-x-4">
                                        <button
                                            onClick={() => handleWriterStatusUpdate('active')}
                                            disabled={!user.whatsapp_number || user.whatsapp_number.trim() === ''}
                                            className={`px-4 py-2 rounded-md ${
                                                user.writer_status === 'active'
                                                    ? 'bg-green-600 text-white'
                                                    : !user.whatsapp_number || user.whatsapp_number.trim() === ''
                                                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            Available
                                        </button>
                                        <button
                                            onClick={() => handleWriterStatusUpdate('busy')}
                                            disabled={!user.whatsapp_number || user.whatsapp_number.trim() === ''}
                                            className={`px-4 py-2 rounded-md ${
                                                user.writer_status === 'busy'
                                                    ? 'bg-red-600 text-white'
                                                    : !user.whatsapp_number || user.whatsapp_number.trim() === ''
                                                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            Busy
                                        </button>
                                        <button
                                            onClick={() => handleWriterStatusUpdate('inactive')}
                                            className={`px-4 py-2 rounded-md ${
                                                user.writer_status === 'inactive'
                                                    ? 'bg-gray-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            Inactive
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {user.rating > 0 && (
                            <div className="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ratings & Reviews</h3>
                                <div className="flex items-center space-x-2">
                                    <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    <span className="text-xl font-semibold text-gray-900 dark:text-white">{parseFloat(String(user.rating) || '0').toFixed(1)}</span>
                                    <span className="text-gray-500 dark:text-gray-400">({user.total_ratings || 0} reviews)</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Portfolio Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Writer Portfolio</h3>
                        <form onSubmit={handlePortfolioUpdate} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Sample Work Image URL</label>
                                <input
                                    type="url"
                                    value={portfolio.sample_work_image}
                                    onChange={(e) => setPortfolio(prev => ({ ...prev, sample_work_image: e.target.value }))}
                                    placeholder="https://example.com/image.jpg"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    You can use any image hosting website to showcase your portfolio work.
                                </p>
                                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/30 rounded text-sm">
                                    <p className="font-medium text-blue-700 dark:text-blue-200">Supported Image Hosting Services:</p>
                                    <ul className="list-disc pl-5 mt-1 text-blue-600 dark:text-blue-300 space-y-1">
                                        <li><strong>ImageKit:</strong> <a href="https://imagekit.io/tools/free-image-hosting/" target="_blank" rel="noopener noreferrer" className="underline">Free image hosting tool</a> (No signup required)</li>
                                        <li><strong>Google Drive:</strong> Upload your image, right-click and select "Get link", set to "Anyone with the link", then copy and paste the link</li>
                                        <li><strong>ImgBB:</strong> <a href="https://imgbb.com/upload" target="_blank" rel="noopener noreferrer" className="underline">Upload here</a>, then use the "Direct link" URL</li>
                                        <li><strong>FreeImage.host:</strong> <a href="https://freeimage.host/" target="_blank" rel="noopener noreferrer" className="underline">Upload here</a> and copy the direct image URL</li>
                                        <li><strong>Imgur:</strong> <a href="https://imgur.com/upload" target="_blank" rel="noopener noreferrer" className="underline">Upload here</a> and copy the direct image URL</li>
                                    </ul>
                                    <p className="mt-2 text-blue-700 dark:text-blue-200 font-medium">For Google Drive images:</p>
                                    <ol className="list-decimal pl-5 mt-1 text-blue-600 dark:text-blue-300 space-y-1">
                                        <li>Upload your image to Google Drive</li>
                                        <li>Right-click the image and select "Share"</li>
                                        <li>Click "Get link" and set access to "Anyone with the link"</li>
                                        <li>Copy the link (format: drive.google.com/file/d/...)</li>
                                        <li>Paste it here - our system will automatically convert it</li>
                                    </ol>
                                </div>
                                {portfolio.sample_work_image && (
                                    <div className="mt-4 border p-3 rounded-md">
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Image Preview:</p>
                                        <img 
                                            src={portfolio.sample_work_image} 
                                            alt="Preview" 
                                            className="max-h-60 rounded border border-gray-300"
                                            onLoad={() => setMessage({ type: 'success', text: 'Image loaded successfully!' })}
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20200%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_189e96ddb7f%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A20pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_189e96ddb7f%22%3E%3Crect%20width%3D%22400%22%20height%3D%22200%22%20fill%3D%22%23eee%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22150%22%20y%3D%22110%22%3EInvalid%20Image%20URL%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';
                                                target.onerror = null; // Prevent infinite error loop
                                            }}
                                            loading="lazy"
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Description</label>
                                <textarea
                                    value={portfolio.description}
                                    onChange={(e) => setPortfolio(prev => ({ ...prev, description: e.target.value }))}
                                    rows={4}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    placeholder="Tell others about your writing experience and expertise..."
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Update Portfolio
                            </button>
                        </form>
                    </div>
                </div>
            </main>
            
            {/* Account Settings Section */}
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-12">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-2">Account Settings</h3>
                    
                    <div className="space-y-6">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-md">
                            <p className="text-blue-700 dark:text-blue-200">
                                <span className="font-medium">Tip:</span> Getting unwanted assignment requests? Try switching your writing status to "Inactive".
                            </p>
                        </div>
                        
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Danger Zone</h4>
                            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-start space-x-3">
                                        <svg className="h-6 w-6 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <div>
                                            <h5 className="text-md font-medium text-gray-900 dark:text-white">Delete Account</h5>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Permanently delete your account and all associated data. This action cannot be undone.
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowDeleteConfirmation(true)}
                                        className="px-4 py-2 rounded-md border border-red-300 text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                                    >
                                        Delete Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {showDeleteConfirmation && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Confirm Account Deletion</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">Are you sure you want to delete your account? This action is irreversible.</p>
                        {deleteError && (
                            <div className="mb-6 p-4 rounded-md bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200">
                                {deleteError}
                            </div>
                        )}
                        <div className="flex space-x-4">
                            <button
                                onClick={() => setShowDeleteConfirmation(false)}
                                className="px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                            >
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
