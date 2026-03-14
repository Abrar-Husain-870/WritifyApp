import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import { API } from '../utils/api';
import { GuestContext } from '../App';
import { Star, Loader2, X, Send, User, ChevronRight, BookOpen, Clock, IndianRupee, FileText, Phone, Search } from 'lucide-react';
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
        course_name: '',
        course_code: '',
        assignment_type: 'class_assignment',
        num_pages: 1,
        deadline: '',
        estimated_cost: 50,
        whatsapp_number: ''
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [streamFilter, setStreamFilter] = useState('all');
    const [submitting, setSubmitting] = useState(false);
    const [userStream, setUserStream] = useState<string>('');
    const { isGuest } = useContext(GuestContext);

    useEffect(() => {
        if (!isGuest) {
            fetch(`${API.baseUrl}/api/users/profile`, {
                credentials: 'include'
            })
            .then(res => res.json())
            .then(data => {
                if (data && data.university_stream) {
                    setUserStream(data.university_stream);
                }
            })
            .catch(err => console.error('Error fetching user profile:', err));
        }
    }, [isGuest]);

    useEffect(() => {
        if (isGuest) {
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
            ];
            setWriters(sampleWriters);
            setLoading(false);
        } else {
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
                    throw new Error(`HTTP error! Status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                let writersData = [];
                if (data && Array.isArray(data.writers)) {
                    writersData = data.writers;
                } else if (data && Array.isArray(data)) {
                    writersData = data;
                }
                
                const activeWriters = writersData.filter((writer: Writer) => 
                    writer.writer_status === 'active' || writer.writer_status === 'busy'
                );
                
                setWriters(activeWriters);
                setLoading(false);
            })
            .catch(error => {
                setLoading(false);
                toast.error('Failed to load writers. Please try again later.');
            });
        }
    }, [isGuest]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-500';
            case 'busy': return 'bg-amber-500';
            case 'inactive': return 'bg-muted-foreground';
            default: return 'bg-muted-foreground';
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
        if (formData.course_name.length > 255) {
            toast.error('Course name must be less than 255 characters');
            return false;
        }
        if (formData.course_code.length > 50) {
            toast.error('Course code must be less than 50 characters');
            return false;
        }
        if (formData.assignment_type.length > 100) {
            toast.error('Assignment type must be less than 100 characters');
            return false;
        }
        if (isNaN(parseInt(formData.num_pages.toString())) || parseInt(formData.num_pages.toString()) <= 0) {
            toast.error('Number of pages must be a positive number');
            return false;
        }
        if (isNaN(parseFloat(formData.estimated_cost.toString())) || parseFloat(formData.estimated_cost.toString()) % 50 !== 0) {
            toast.error('Estimated cost must be a multiple of 50');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        if (isGuest) {
            toast.error('Sign in first to use this feature');
            setSubmitting(false);
            return;
        }

        if (!validateForm()) {
            setSubmitting(false);
            return;
        }
        
        try {
            const submitData = {
                course_name: formData.course_name.substring(0, 255),
                course_code: formData.course_code.substring(0, 50),
                assignment_type: formData.assignment_type.substring(0, 100),
                num_pages: parseInt(formData.num_pages.toString()).toString(),
                deadline: formData.deadline,
                estimated_cost: parseFloat(formData.estimated_cost.toString()).toString(),
                whatsapp_number: formData.whatsapp_number
            };
            
            const response = await fetch(API.assignmentRequests.create, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(submitData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            toast.success('Your assignment request has been created successfully!');
            setTimeout(() => {
                navigate('/my-assignments');
            }, 2000);
        } catch (error) {
            toast.error('Failed to create assignment request. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleWriterClick = (writerId: number) => {
        if (isGuest) {
            setShowShareForm(true);
        } else {
            navigate(`/writer-profile/${writerId}`);
        }
    };

    const uniqueStreams = Array.from(new Set(writers.map(w => w.university_stream))).filter(Boolean);

    const filteredWriters = writers.filter(writer => {
        const matchesSearch = writer.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              writer.university_stream.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || writer.writer_status === statusFilter;
        const matchesStream = streamFilter === 'all' || writer.university_stream === streamFilter;
        
        return matchesSearch && matchesStatus && matchesStream;
    });

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header title="Find a Writer" />

            <main className="flex-1 max-w-7xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {loading ? (
                    <div className="space-y-8">
                        <Skeleton className="h-32 w-full rounded-2xl" />
                        <div className="flex items-center justify-between border-b border-border pb-4">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-5 w-24" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="bg-card rounded-xl border border-border overflow-hidden flex flex-col h-full">
                                    <Skeleton className="h-48 w-full rounded-none" />
                                    <div className="p-5 flex-1 flex flex-col gap-4">
                                        <div className="flex justify-between items-start">
                                            <Skeleton className="h-6 w-32" />
                                            <Skeleton className="h-6 w-16 rounded-md" />
                                        </div>
                                        <Skeleton className="h-4 w-40" />
                                        <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                                            <Skeleton className="h-4 w-24" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {showShareForm ? (
                            <div className="max-w-2xl mx-auto bg-card rounded-xl border border-border shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
                                    <div>
                                        <h3 className="text-xl font-semibold text-foreground">Broadcast Assignment</h3>
                                        <p className="text-sm text-muted-foreground mt-1">Share details with all available writers</p>
                                    </div>
                                    <button 
                                        onClick={() => setShowShareForm(false)}
                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-accent hover:text-accent-foreground h-9 w-9"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                                
                                <div className="p-6">
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                                                    <BookOpen className="h-4 w-4 text-muted-foreground" /> Course Name
                                                </label>
                                                <input
                                                    type="text"
                                                    name="course_name"
                                                    value={formData.course_name}
                                                    onChange={handleChange}
                                                    required
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    placeholder="e.g. Data Structures"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-muted-foreground" /> Course Code
                                                </label>
                                                <input
                                                    type="text"
                                                    name="course_code"
                                                    value={formData.course_code}
                                                    onChange={handleChange}
                                                    required
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    placeholder="e.g. CS301"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Assignment Type</label>
                                            <select
                                                name="assignment_type"
                                                value={formData.assignment_type}
                                                onChange={handleChange}
                                                required
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <option value="class_assignment">Class Assignment</option>
                                                <option value="lab_file">Lab File</option>
                                                {userStream.startsWith('B.Tech') && (
                                                    <>
                                                        <option value="workshop_file">Workshop Files</option>
                                                        <option value="graphics_sheet">Graphics Sheet</option>
                                                    </>
                                                )}
                                                <option value="notes">Notes</option>
                                                <option value="project_report">Project Report</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Number of Pages</label>
                                                <input
                                                    type="number"
                                                    name="num_pages"
                                                    value={formData.num_pages}
                                                    onChange={handleChange}
                                                    required
                                                    min="1"
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-muted-foreground" /> Deadline
                                                </label>
                                                <input
                                                    type="date"
                                                    name="deadline"
                                                    value={formData.deadline}
                                                    onChange={handleChange}
                                                    required
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [color-scheme:light] dark:[color-scheme:dark]"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4 bg-muted/30 p-4 rounded-lg border border-border">
                                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                                                <IndianRupee className="h-4 w-4 text-muted-foreground" /> Estimated Cost
                                            </label>
                                            <div>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-sm font-medium text-muted-foreground">₹50</span>
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
                                                        className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                                    />
                                                    <span className="text-sm font-medium text-muted-foreground">₹2500</span>
                                                </div>
                                                <div className="mt-4 text-center">
                                                    <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-lg">
                                                        ₹{formData.estimated_cost}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-muted-foreground" /> Your WhatsApp Number
                                            </label>
                                            <input
                                                type="tel"
                                                name="whatsapp_number"
                                                value={formData.whatsapp_number}
                                                onChange={handleChange}
                                                required
                                                placeholder="+91XXXXXXXXXX"
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                        </div>

                                        <div className="text-xs text-muted-foreground bg-secondary/50 p-3 rounded-md border border-border/50">
                                            <p>Note: Your request will be visible to all writers for 7 days. After that, it will expire and no longer be visible in the marketplace.</p>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-11 px-8 disabled:opacity-50"
                                        >
                                            {submitting ? (
                                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                                            ) : (
                                                <><Send className="mr-2 h-4 w-4" /> Submit Request</>
                                            )}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Broadcast Card */}
                                <div
                                    onClick={() => setShowShareForm(true)}
                                    className="group relative overflow-hidden rounded-2xl border border-border bg-card hover:border-primary/50 transition-all cursor-pointer shadow-sm hover:shadow-md"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
                                        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                                            <Send className="h-10 w-10 text-primary" />
                                        </div>
                                        <div className="flex-1 text-center sm:text-left">
                                            <h3 className="text-2xl font-bold text-foreground mb-2">Broadcast Your Assignment</h3>
                                            <p className="text-muted-foreground mb-4">Reach all available writers instantly and get multiple responses for your project. Perfect for urgent assignments.</p>
                                            <span className="inline-flex items-center text-sm font-medium text-primary">
                                                Create broadcast request <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border pb-4 gap-4">
                                    <h2 className="text-xl font-semibold text-foreground">Available Writers</h2>
                                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                                        <div className="relative w-full sm:w-64">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <input 
                                                type="text" 
                                                placeholder="Search writers..." 
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                        </div>
                                        <div className="flex items-center gap-3 w-full sm:w-auto">
                                            <select 
                                                value={statusFilter}
                                                onChange={(e) => setStatusFilter(e.target.value)}
                                                className="flex h-10 w-full sm:w-auto rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <option value="all">All Status</option>
                                                <option value="active">Available</option>
                                                <option value="busy">Busy</option>
                                            </select>
                                            <select 
                                                value={streamFilter}
                                                onChange={(e) => setStreamFilter(e.target.value)}
                                                className="flex h-10 w-full sm:w-auto rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <option value="all">All Streams</option>
                                                {uniqueStreams.map(stream => (
                                                    <option key={stream} value={stream}>{stream}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {filteredWriters.map(writer => (
                                        <div
                                            key={writer.id}
                                            onClick={() => handleWriterClick(writer.id)}
                                            className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col h-full hover:-translate-y-1"
                                        >
                                            <div className="relative h-48 w-full bg-muted overflow-hidden">
                                                <img 
                                                    src={writer.sample_work_image || 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22300%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20300%22%20preserveAspectRatio%3D%22none%22%3E%3Crect%20width%3D%22400%22%20height%3D%22300%22%20fill%3D%22%23f3f4f6%22%3E%3C%2Frect%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22%239ca3af%22%20font-family%3D%22sans-serif%22%20font-size%3D%2214%22%3ENo%20Sample%20Work%3C%2Ftext%3E%3C%2Fsvg%3E'}
                                                    alt={`${writer.name}'s sample work`}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22300%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20300%22%20preserveAspectRatio%3D%22none%22%3E%3Crect%20width%3D%22400%22%20height%3D%22300%22%20fill%3D%22%23f3f4f6%22%3E%3C%2Frect%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22%239ca3af%22%20font-family%3D%22sans-serif%22%20font-size%3D%2214%22%3EImage%20Not%20Found%3C%2Ftext%3E%3C%2Fsvg%3E';
                                                    }}
                                                    loading="lazy"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>

                                            <div className="p-5 flex-1 flex flex-col">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="font-semibold text-lg text-foreground line-clamp-1">{writer.name}</h3>
                                                    <div className="flex items-center gap-1 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md border border-border text-sm">
                                                        <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                                                        <span className="font-medium">
                                                            {typeof writer.rating === 'number' 
                                                                ? writer.rating.toFixed(1) 
                                                                : parseFloat(writer.rating as string).toFixed(1)}
                                                        </span>
                                                        <span className="text-muted-foreground text-xs">({writer.total_ratings})</span>
                                                    </div>
                                                </div>

                                                <p className="text-sm text-muted-foreground mb-4 line-clamp-1 flex items-center gap-1.5">
                                                    <BookOpen className="h-3.5 w-3.5" />
                                                    {writer.university_stream}
                                                </p>

                                                <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn("h-2.5 w-2.5 rounded-full", getStatusColor(writer.writer_status))} />
                                                        <span className="text-sm font-medium text-muted-foreground">{getStatusText(writer.writer_status)}</span>
                                                    </div>
                                                    <span className="text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                                                        View <ChevronRight className="h-4 w-4 ml-0.5" />
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                {filteredWriters.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-24 text-center bg-card/50 rounded-3xl border border-border border-dashed relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
                                        <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 relative z-10">
                                            <User className="h-10 w-10 text-primary" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-foreground mb-3 relative z-10">No writers available</h3>
                                        <p className="text-lg text-muted-foreground max-w-md relative z-10">There are currently no active writers. Try broadcasting your request instead.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default FindWriter;