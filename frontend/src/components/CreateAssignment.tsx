import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import { Loader2, Send } from 'lucide-react';
import { cn } from '../utils/cn';
import { toast } from 'sonner';
import { API } from '../utils/api';
import { GuestContext } from '../App';

interface AssignmentData {
    title: string;
    description: string;
    subject: string;
    assignment_type: string;
    deadline: string;
    budget: number;
}

const CreateAssignment: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<AssignmentData>({
        title: '',
        description: '',
        subject: '',
        assignment_type: 'class_assignment',
        deadline: '',
        budget: 0
    });
    const [userStream, setUserStream] = useState<string>('');
    const { isGuest } = React.useContext(GuestContext);

    React.useEffect(() => {
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const submitData = {
                course_name: formData.title,
                course_code: formData.subject,
                assignment_type: formData.assignment_type,
                num_pages: '1', // Default for now
                deadline: formData.deadline,
                estimated_cost: formData.budget.toString()
            };

            const response = await fetch(`${API.baseUrl}/api/assignment-requests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(submitData)
            });

            if (!response.ok) {
                if (response.status === 401) {
                    navigate('/login');
                    throw new Error('Please login to create an assignment');
                }
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create assignment');
            }

            await response.json();
            toast.success('Assignment created successfully!');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'An error occurred');
            console.error('Error creating assignment:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'budget' ? parseFloat(value) || 0 : value
        }));
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header title="Create Assignment" />
            
            <main className="flex-1 max-w-3xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-border bg-muted/20">
                        <h2 className="text-xl font-semibold text-foreground">New Assignment Request</h2>
                        <p className="text-sm text-muted-foreground mt-1">Fill out the details below to post a new assignment.</p>
                    </div>
                    
                    <div className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g., Data Structures Final Project"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    required
                                    rows={5}
                                    placeholder="Provide detailed instructions and requirements..."
                                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Subject</label>
                                    <input
                                        type="text"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g., Computer Science"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Assignment Type</label>
                                    <select
                                        name="assignment_type"
                                        value={formData.assignment_type}
                                        onChange={(e) => setFormData(prev => ({ ...prev, assignment_type: e.target.value }))}
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
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Deadline</label>
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

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Budget (₹)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                    <input
                                        type="number"
                                        name="budget"
                                        value={formData.budget}
                                        onChange={handleChange}
                                        required
                                        min="0"
                                        className="flex h-10 w-full rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-border">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={cn(
                                        "w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-11 px-8",
                                        loading 
                                            ? "bg-secondary text-secondary-foreground opacity-50 cursor-not-allowed"
                                            : "bg-primary text-primary-foreground shadow hover:bg-primary/90"
                                    )}
                                >
                                    {loading ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                                    ) : (
                                        <><Send className="mr-2 h-4 w-4" /> Create Assignment</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CreateAssignment;