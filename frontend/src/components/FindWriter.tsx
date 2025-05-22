import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import { API } from '../utils/api';
import { debugLog, errorLog } from '../utils/logUtil';

import { GuestContext } from '../App';

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
        course_name: '',
        course_code: '',
        assignment_type: 'class_assignment',
        num_pages: 1,
        deadline: '',
        estimated_cost: 50,
        whatsapp_number: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const { isGuest } = useContext(GuestContext);

    useEffect(() => {
        if (isGuest) {
            // For guest users, provide sample writers (only active or busy writers)
            const sampleWriters: Writer[] = [
                {
                    id: 1001,
                    name: 'John Smith',
                    rating: 4.8,
                    total_ratings: 24,
                    writer_status: 'active',
                    university_stream: 'Computer Science',
                    sample_work_image: 'https://lh3.googleusercontent.com/d/1qbBt39377NTLPVs7PTDB3UbbZbJ9EQq3'
                },
                {
                    id: 1002,
                    name: 'Alice Johnson',
                    rating: 4.5,
                    total_ratings: 18,
                    writer_status: 'active',
                    university_stream: 'Business Administration',
                    sample_work_image: 'https://lh3.googleusercontent.com/d/1ny8x8rKe-Y-0IYWoP3ObmjcF98aiPmPt'
                },
                {
                    id: 1003,
                    name: 'Jacob Williams',
                    rating: 4.7,
                    total_ratings: 32,
                    writer_status: 'busy',
                    university_stream: 'Engineering',
                    sample_work_image: 'https://lh3.googleusercontent.com/d/1mM9I1h7n2JhL2kHr8iPuEjlXC5YwSMmn'
                }
                // Note: We don't include any inactive writers in the sample data
            ];
            debugLog('Showing sample writers for guest mode (all active or busy)');
            setWriters(sampleWriters);
            setLoading(false);
        } else {
            // For registered users, fetch real writers
            debugLog('Fetching writers from:', API.writers.all);
            fetch(API.writers.all, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            })
            .then(res => {
                if (!res.ok) {
                    errorLog(`Writers fetch failed with status: ${res.status}`);
                    return res.text().then(text => {
                        errorLog('Error response text:', text);
                        throw new Error(`HTTP error! Status: ${res.status}`);
                    });
                }
                return res.json();
            })
            .then(data => {
                debugLog('Writers data received:', data);
                let writersData = [];
                
                if (data && Array.isArray(data.writers)) {
                    writersData = data.writers;
                } else if (data && Array.isArray(data)) {
                    // Handle case where API returns array directly
                    writersData = data;
                } else {
                    errorLog('Unexpected writers data format:', data);
                }
                
                // Filter out inactive writers
                const activeWriters = writersData.filter((writer: Writer) => 
                    writer.writer_status === 'active' || writer.writer_status === 'busy'
                );
                
                debugLog(`Filtered ${writersData.length - activeWriters.length} inactive writers, showing ${activeWriters.length} active/busy writers`);
                setWriters(activeWriters);
                setLoading(false);
            })
            .catch(error => {
                errorLog('Error fetching writers:', error);
                setLoading(false);
                setError('Failed to load writers. Please try again later.');
            });
        }
    }, [isGuest]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-500';
            case 'busy': return 'bg-red-500';
            case 'inactive': return 'bg-gray-500';
            default: return 'bg-gray-500';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'active': return 'Available';
            case 'busy': return 'Currently Busy';
            case 'inactive': return 'Not Available';
            default: return 'Unknown';
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validateForm = () => {
        // Validate field lengths based on database constraints
        if (formData.course_name.length > 255) {
            setError('Course name must be less than 255 characters');
            return false;
        }
        
        if (formData.course_code.length > 50) {
            setError('Course code must be less than 50 characters');
            return false;
        }
        
        if (formData.assignment_type.length > 100) {
            setError('Assignment type must be less than 100 characters');
            return false;
        }
        
        // Validate numeric fields
        if (isNaN(parseInt(formData.num_pages.toString())) || parseInt(formData.num_pages.toString()) <= 0) {
            setError('Number of pages must be a positive number');
            return false;
        }
        
        if (isNaN(parseFloat(formData.estimated_cost.toString())) || parseFloat(formData.estimated_cost.toString()) % 50 !== 0) {
            setError('Estimated cost must be a multiple of 50');
            return false;
        }
        
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setSuccess(null);

        if (isGuest) {
            // For guest users, show a message that they need to sign in
            setError('Sign in first to use this feature');
            setSubmitting(false);
            return;
        }

        // Validate form before submission
        if (!validateForm()) {
            setSubmitting(false);
            return;
        }
        
        try {
            // Truncate values to match database constraints
            const sanitizedData = {
                ...formData,
                course_name: formData.course_name.substring(0, 255),
                course_code: formData.course_code.substring(0, 50),
                assignment_type: formData.assignment_type.substring(0, 100),
                num_pages: parseInt(formData.num_pages.toString()),
                estimated_cost: parseFloat(formData.estimated_cost.toString())
            };
            
            const response = await fetch(API.assignmentRequests.create, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(sanitizedData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            setSuccess('Your assignment request has been created successfully!');
            setTimeout(() => {
                navigate('/my-assignments');
            }, 2000);
        } catch (error) {
            console.error('Error creating assignment request:', error);
            setError('Failed to create assignment request. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleWriterClick = (writerId: number) => {
        if (isGuest) {
            // For guest users, show the form but will show a message when they try to submit
            setShowShareForm(true);
        } else {
            navigate(`/writer-profile/${writerId}`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <Header title="Find a Writer" />

            {/* Main content */}
            <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                {loading ? (
                    <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <>
                        {showShareForm ? (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Share Assignment Details with All Writers</h3>
                                    <button 
                                        onClick={() => setShowShareForm(false)}
                                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Course Name</label>
                                        <input
                                            type="text"
                                            name="course_name"
                                            value={formData.course_name}
                                            onChange={handleChange}
                                            required
                                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Course Code</label>
                                        <input
                                            type="text"
                                            name="course_code"
                                            value={formData.course_code}
                                            onChange={handleChange}
                                            required
                                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assignment Type</label>
                                        <select
                                            name="assignment_type"
                                            value={formData.assignment_type}
                                            onChange={handleChange}
                                            required
                                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        >
                                            <option value="class_assignment">Class Assignment</option>
                                            <option value="lab_files">Lab Files</option>
                                            <option value="graphic_design">Graphic Design</option>
                                            <option value="workshop_files">Workshop Files</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Number of Pages</label>
                                        <input
                                            type="number"
                                            name="num_pages"
                                            value={formData.num_pages}
                                            onChange={handleChange}
                                            required
                                            min="1"
                                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Deadline</label>
                                        <input
                                            type="datetime-local"
                                            name="deadline"
                                            value={formData.deadline}
                                            onChange={handleChange}
                                            required
                                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estimated Cost (₹)</label>
                                        <div className="mt-1">
                                            <div className="flex items-center space-x-2">
                                                <span className="text-gray-700 dark:text-gray-300 font-medium">₹50</span>
                                                <input
                                                    type="range"
                                                    name="estimated_cost"
                                                    min="50"
                                                    max="2500"
                                                    step="50"
                                                    value={formData.estimated_cost}
                                                    onChange={(e) => {
                                                        const value = parseInt(e.target.value);
                                                        setFormData({
                                                            ...formData,
                                                            estimated_cost: value
                                                        });
                                                    }}
                                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                                />
                                                <span className="text-gray-700 font-medium">₹2500</span>
                                            </div>
                                            <div className="mt-2 text-center">
                                                <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">₹{formData.estimated_cost}</span>
                                            </div>
                                        </div>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Drag the slider to set cost in multiples of ₹50
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Your WhatsApp Number</label>
                                        <input
                                            type="tel"
                                            name="whatsapp_number"
                                            value={formData.whatsapp_number}
                                            onChange={handleChange}
                                            required
                                            placeholder="+91XXXXXXXXXX"
                                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>

                                    <div className="text-sm text-gray-500 italic">
                                        <p>Note: Your request will be visible to all writers for 7 days. After that, it will expire and no longer be visible in the marketplace.</p>
                                    </div>

                                    {error && <p className="text-red-500">{error}</p>}
                                    {success && <p className="text-green-500">{success}</p>}

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        {submitting ? 'Submitting...' : 'Submit Assignment Request'}
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {/* Broadcast Assignment Request Card */}
                                <div
                                    onClick={() => setShowShareForm(true)}
                                    className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-indigo-900 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-blue-200 dark:border-blue-800 cursor-pointer"
                                >
                                    <div className="h-48 w-full flex items-center justify-center relative overflow-hidden">
                                        <div className="absolute inset-0 bg-blue-500 opacity-10 dark:opacity-20"></div>
                                        <div className="relative z-10 flex flex-col items-center justify-center space-y-3">
                                            <div className="p-3 bg-white dark:bg-gray-700 rounded-full shadow-md">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                                </svg>
                                            </div>
                                            <span className="px-4 py-1 bg-blue-600 dark:bg-blue-700 text-white text-sm font-medium rounded-full shadow-sm">Fast Response</span>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Broadcast Your Assignment</h3>
                                        <p className="text-gray-600 dark:text-gray-400 mt-2 mb-4">Reach all available writers instantly and get multiple responses for your project</p>
                                        <div className="flex items-center text-blue-600 dark:text-blue-400 group">
                                            <span className="font-medium group-hover:underline">Create broadcast request</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1 group-hover:translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Individual Writer Cards */}
                                {writers.map(writer => (
                                    <div
                                        key={writer.id}
                                        onClick={() => handleWriterClick(writer.id)}
                                        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 transform hover:scale-105"
                                    >
                                        {/* Sample Work Image */}
                                        <div className="w-full bg-gray-200 rounded-t-lg overflow-hidden shadow-inner" style={{ height: '420px', borderRadius: '0.5rem 0.5rem 0 0', border: '1px solid rgba(0,0,0,0.05)' }}>
                                            <img 
                                                src={writer.sample_work_image || 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22565%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20565%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_189e96ddb7f%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A20pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_189e96ddb7f%22%3E%3Crect%20width%3D%22400%22%20height%3D%22565%22%20fill%3D%22%23eee%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22120%22%20y%3D%22280%22%3ENo%20Sample%20Work%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E'}
                                                alt={`${writer.name}'s sample work`}
                                                className="w-full h-full object-cover rounded-t-lg transition-all duration-300 hover:scale-105"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22565%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20565%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_189e96ddb7f%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A20pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_189e96ddb7f%22%3E%3Crect%20width%3D%22400%22%20height%3D%22565%22%20fill%3D%22%23eee%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22120%22%20y%3D%22280%22%3EImage%20Not%20Found%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';
                                                    target.onerror = null; // Prevent infinite error loop
                                                }}
                                                loading="lazy"
                                            />
                                        </div>

                                        {/* Writer Info */}
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{writer.name}</h3>
                                                <div className="flex items-center">
                                                    <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                    <span className="ml-1 text-gray-600">
                                                        {typeof writer.rating === 'number' 
                                                            ? writer.rating.toFixed(1) 
                                                            : parseFloat(writer.rating as string).toFixed(1)} ({writer.total_ratings})
                                                    </span>
                                                </div>
                                            </div>

                                            <p className="text-sm text-gray-600 dark:text-gray-400">{writer.university_stream}</p>

                                            {/* Status Indicator */}
                                            <div className="flex items-center">
                                                <div className={`h-3 w-3 rounded-full ${getStatusColor(writer.writer_status)} mr-2`}></div>
                                                <span className="text-sm text-gray-600">{getStatusText(writer.writer_status)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default FindWriter;
