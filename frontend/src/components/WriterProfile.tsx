import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API } from '../utils/api';
import Header from './Header';
import { Star, BookOpen, User, Phone, CheckCircle2, AlertCircle, Loader2, Send, Clock, FileText, IndianRupee } from 'lucide-react';
import { cn } from '../utils/cn';

interface Writer {
    id: number;
    name: string;
    email: string;
    profile_picture: string;
    university_stream: string;
    whatsapp_number: string;
    whatsapp_redirect?: string;
    writer_status: 'active' | 'busy' | 'inactive';
    rating: number | string;
    total_ratings: number;
    sample_work_image?: string;
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

const WriterProfile: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [writer, setWriter] = useState<Writer | null>(null);
    const [loading, setLoading] = useState(true);
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

    useEffect(() => {
        fetch(API.writers.byId(Number(id)), {
            credentials: 'include'
        })
        .then(res => res.json())
        .then(data => {
            if (data && typeof data.rating === 'string') {
                data.rating = parseFloat(data.rating) || 0;
            }
            setWriter(data);
            setLoading(false);
        })
        .catch(err => {
            setLoading(false);
        });
    }, [id]);

    const validateForm = () => {
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
        if (isNaN(parseInt(formData.num_pages.toString())) || parseInt(formData.num_pages.toString()) <= 0) {
            setError('Number of pages must be a positive number');
            return false;
        }
        if (isNaN(parseFloat(formData.estimated_cost.toString())) || parseFloat(formData.estimated_cost.toString()) <= 0 || parseFloat(formData.estimated_cost.toString()) % 50 !== 0) {
            setError('Estimated cost must be a positive multiple of 50');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        
        if (!validateForm()) {
            setSubmitting(false);
            return;
        }
        
        try {
            const sanitizedData = {
                ...formData,
                course_name: formData.course_name.substring(0, 255),
                course_code: formData.course_code.substring(0, 50),
                assignment_type: formData.assignment_type.substring(0, 100),
                num_pages: parseInt(formData.num_pages.toString()),
                estimated_cost: parseFloat(formData.estimated_cost.toString())
            };
            
            const requestData = {
                writer_id: Number(id),
                ...sanitizedData
            };
            
            const response = await fetch(API.assignmentRequests.create, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(requestData)
            });

            if (response.ok) {
                const responseData = await response.json();
                const uniqueId = responseData.unique_id;
                
                let whatsappNumber = writer?.whatsapp_number || writer?.whatsapp_redirect || '';
                
                if (!whatsappNumber) {
                    setSuccess('Request submitted successfully!');
                    alert('The writer has not added their WhatsApp number. Please check your assignments page later.');
                    setTimeout(() => navigate('/dashboard'), 1000);
                    return;
                }
                
                whatsappNumber = whatsappNumber.replace(/\D/g, '');
                
                if (whatsappNumber.length === 10) {
                    whatsappNumber = '91' + whatsappNumber;
                } else if (whatsappNumber.length < 10) {
                    setSuccess('Request submitted successfully!');
                    alert(`The writer has an invalid phone number (${whatsappNumber}). Please check your assignments page later.`);
                    setTimeout(() => navigate('/dashboard'), 1000);
                    return;
                }
                
                const message = encodeURIComponent(`Hi, I've submitted an assignment request for ${formData.course_name}${uniqueId ? ` [ID: ${uniqueId}]` : ''}. Let's discuss the details.`);
                
                setSuccess('Request submitted successfully! Connecting to WhatsApp...');
                
                setTimeout(() => {
                    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
                    setTimeout(() => navigate('/dashboard'), 1000);
                }, 500);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to submit request. Please try again.');
            }
        } catch (error) {
            setError('Network error. Please check your connection and try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

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

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Header title="Writer Profile" />
                <div className="flex-1 flex justify-center items-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    if (!writer) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Header title="Writer Profile" />
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
                    <User className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Writer Not Found</h3>
                    <p className="text-muted-foreground">The writer you are looking for does not exist or has been removed.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header title={`${writer.name}'s Profile`} />

            <main className="flex-1 max-w-7xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Writer Profile & Sample Work */}
                    <div className="lg:col-span-5 space-y-8">
                        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                            <div className="p-6">
                                <div className="flex items-center gap-5 mb-6">
                                    <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center shrink-0 border-2 border-border overflow-hidden">
                                        {writer.profile_picture ? (
                                            <img 
                                                src={writer.profile_picture} 
                                                alt={writer.name} 
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <User className="h-10 w-10 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-foreground mb-1">{writer.name}</h2>
                                        <div className="flex items-center gap-1.5 bg-secondary/50 px-2 py-1 rounded-md w-fit">
                                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                            <span className="font-medium text-sm">{parseFloat(String(writer.rating)).toFixed(1)}</span>
                                            <span className="text-muted-foreground text-xs">({writer.total_ratings} reviews)</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-sm text-foreground">
                                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                                        <span>Studying <span className="font-medium">{writer.university_stream}</span></span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-foreground">
                                        <div className="flex items-center justify-center h-4 w-4">
                                            <div className={cn("h-2.5 w-2.5 rounded-full", getStatusColor(writer.writer_status))} />
                                        </div>
                                        <span>Status: <span className="font-medium">{getStatusText(writer.writer_status)}</span></span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-foreground">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <span>WhatsApp: <span className="font-medium">{writer.whatsapp_number ? '******' + writer.whatsapp_number.slice(-4) : 'Not provided'}</span></span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-border bg-muted/20">
                                <h3 className="font-semibold text-foreground flex items-center gap-2">
                                    <FileText className="h-4 w-4" /> Sample Work
                                </h3>
                            </div>
                            <div className="relative aspect-[3/4] w-full bg-muted">
                                <img 
                                    src={writer.sample_work_image || 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22533%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20533%22%20preserveAspectRatio%3D%22none%22%3E%3Crect%20width%3D%22400%22%20height%3D%22533%22%20fill%3D%22%23f3f4f6%22%3E%3C%2Frect%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22%239ca3af%22%20font-family%3D%22sans-serif%22%20font-size%3D%2216%22%3ENo%20Sample%20Work%3C%2Ftext%3E%3C%2Fsvg%3E'} 
                                    alt="Sample work" 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22533%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20533%22%20preserveAspectRatio%3D%22none%22%3E%3Crect%20width%3D%22400%22%20height%3D%22533%22%20fill%3D%22%23f3f4f6%22%3E%3C%2Frect%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22%239ca3af%22%20font-family%3D%22sans-serif%22%20font-size%3D%2216%22%3EImage%20Not%20Found%3C%2Ftext%3E%3C%2Fsvg%3E';
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Assignment Request Form */}
                    <div className="lg:col-span-7">
                        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden h-full">
                            <div className="p-6 border-b border-border bg-muted/20">
                                <h3 className="text-xl font-semibold text-foreground">Submit Assignment Request</h3>
                                <p className="text-sm text-muted-foreground mt-1">Send a direct request to {writer.name}</p>
                            </div>
                            
                            <div className="p-6">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium leading-none flex items-center gap-2">
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
                                            <label className="text-sm font-medium leading-none flex items-center gap-2">
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
                                        <label className="text-sm font-medium leading-none">Assignment Type</label>
                                        <select
                                            name="assignment_type"
                                            value={formData.assignment_type}
                                            onChange={handleChange}
                                            required
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="class_assignment">Class Assignment</option>
                                            <option value="lab_files">Lab Files</option>
                                            <option value="graphic_design">Graphic Design</option>
                                            <option value="workshop_files">Workshop Files</option>
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium leading-none">Number of Pages</label>
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
                                            <label className="text-sm font-medium leading-none flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-muted-foreground" /> Deadline
                                            </label>
                                            <input
                                                type="datetime-local"
                                                name="deadline"
                                                value={formData.deadline}
                                                onChange={handleChange}
                                                required
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4 bg-muted/30 p-4 rounded-lg border border-border">
                                        <label className="text-sm font-medium leading-none flex items-center gap-2">
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
                                        <label className="text-sm font-medium leading-none flex items-center gap-2">
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
                                        <p>Note: Your request will be visible to writers for 7 days. After that, it will expire and no longer be visible in the marketplace.</p>
                                    </div>

                                    {error && (
                                        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20 flex items-start gap-2">
                                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                            <span>{error}</span>
                                        </div>
                                    )}
                                    {success && (
                                        <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 flex items-start gap-2">
                                            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                                            <span>{success}</span>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={submitting || writer.writer_status === 'inactive'}
                                        className={cn(
                                            "w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-11 px-8",
                                            writer.writer_status === 'inactive' 
                                                ? "bg-secondary text-secondary-foreground opacity-50 cursor-not-allowed" 
                                                : "bg-primary text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
                                        )}
                                    >
                                        {submitting ? (
                                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                                        ) : writer.writer_status === 'inactive' ? (
                                            'Writer is currently inactive'
                                        ) : (
                                            <><Send className="mr-2 h-4 w-4" /> Submit Request & Connect on WhatsApp</>
                                        )}
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