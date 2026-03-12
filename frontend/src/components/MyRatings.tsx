import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

import Header from './Header';
import { API } from '../utils/api';
import { GuestContext } from '../App';
import { Star, Loader2, AlertCircle, MessageSquare, BookOpen } from 'lucide-react';
import { cn } from '../utils/cn';

interface Rating {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  rater_id: number;
  rater_name: string;
  rater_profile_picture: string;
  course_name: string;
  course_code: string;
  assignment_type: string;
}

const MyRatings: React.FC = () => {
  const navigate = useNavigate();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalRatings, setTotalRatings] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isGuest } = useContext(GuestContext);

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        setLoading(true);

        if (isGuest) {
          setRatings([]);
          setAverageRating(0);
          setTotalRatings(0);
          setLoading(false);
          return;
        }

        const response = await fetch(API.users.ratings, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            navigate('/login');
            return;
          }
          
          const errorText = await response.text();
          try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
          } catch (e) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        }
        
        const data = await response.json();
        setRatings(data.ratings || []);
        setAverageRating(data.averageRating || 0);
        setTotalRatings(data.totalRatings || 0);
      } catch (error) {
        setError('Failed to load ratings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, [navigate, isGuest]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star 
          key={i} 
          className={cn(
            "h-5 w-5",
            i <= rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"
          )} 
        />
      );
    }
    return stars;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header title="My Ratings & Reviews" />

      <main className="flex-1 max-w-5xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex-1 flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Ratings</h3>
            <p className="text-muted-foreground mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-6"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-card rounded-xl border border-border shadow-sm p-6 sm:p-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex flex-col items-center md:items-start text-center md:text-left">
                  <h2 className="text-2xl font-bold text-foreground mb-1">Your Overall Rating</h2>
                  <p className="text-muted-foreground">Based on {totalRatings} review{totalRatings !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-4 bg-muted/30 px-6 py-4 rounded-2xl border border-border/50">
                  <div className="flex">
                    {renderStars(Math.round(averageRating))}
                  </div>
                  <span className="text-3xl font-bold text-foreground">
                    {averageRating.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            {ratings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-card rounded-xl border border-border border-dashed">
                <Star className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No ratings yet</h3>
                <p className="text-muted-foreground max-w-md">
                  You haven't received any ratings yet. As you complete assignments, clients will be able to rate your work.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground px-1">Recent Reviews</h3>
                <div className="grid grid-cols-1 gap-4">
                  {ratings.map((rating) => (
                    <div key={rating.id} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden p-6 transition-all hover:shadow-md">
                      <div className="flex flex-col sm:flex-row gap-5">
                        <div className="flex-shrink-0">
                          {rating.rater_profile_picture ? (
                            <img 
                              className="h-12 w-12 rounded-full border border-border object-cover" 
                              src={rating.rater_profile_picture} 
                              alt={`${rating.rater_name}'s profile`} 
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center border border-border">
                              <span className="text-muted-foreground text-lg font-medium">
                                {rating.rater_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                            <h3 className="text-base font-semibold text-foreground truncate">{rating.rater_name}</h3>
                            <span className="text-sm text-muted-foreground shrink-0">{formatDate(rating.created_at)}</span>
                          </div>
                          
                          <div className="flex mb-3">
                            {renderStars(rating.rating)}
                          </div>
                          
                          {rating.comment ? (
                            <div className="bg-muted/30 p-4 rounded-lg border border-border/50 mb-4">
                              <div className="flex gap-2">
                                <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                <p className="text-sm text-foreground leading-relaxed">{rating.comment}</p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground italic mb-4">No comment provided</p>
                          )}
                          
                          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-secondary/50 w-fit px-3 py-1.5 rounded-md border border-border/50">
                            <BookOpen className="h-3.5 w-3.5" />
                            <span className="truncate max-w-[200px] sm:max-w-xs">{rating.course_name} ({rating.course_code})</span>
                            <span className="mx-1">•</span>
                            <span className="capitalize">{rating.assignment_type.replace('_', ' ')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyRatings;