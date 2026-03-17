import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import { API } from '../utils/api';
import { GuestContext } from '../App';
import { Star, Loader2, AlertCircle, BookOpen } from 'lucide-react';
import { cn } from '../utils/cn';

interface Rating {
  id: number; rating: number; comment: string; created_at: string; rater_id: number;
  rater_name: string; rater_profile_picture: string; course_name: string; course_code: string; assignment_type: string;
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
        if (isGuest) { setRatings([]); setAverageRating(0); setTotalRatings(0); setLoading(false); return; }
        const response = await fetch(API.users.ratings, { credentials: 'include', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' } });
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) { navigate('/login'); return; }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setRatings(data.ratings || []); setAverageRating(data.averageRating || 0); setTotalRatings(data.totalRatings || 0);
      } catch (error) { setError('Failed to load ratings.'); } finally { setLoading(false); }
    };
    fetchRatings();
  }, [navigate, isGuest]);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const renderStars = (rating: number) => Array.from({ length: 5 }, (_, i) => (
    <Star key={i} className={cn("h-3.5 w-3.5", i < rating ? "text-amber-500 fill-amber-500" : "text-border")} />
  ));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header title="My Ratings" />
      <main className="flex-1 max-w-3xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : error ? (
          <div className="flex flex-col items-center py-20 text-center">
            <AlertCircle className="h-8 w-8 text-destructive mb-3" strokeWidth={1.5} />
            <h3 className="text-base font-semibold text-foreground mb-1">Error</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="text-sm text-primary hover:underline font-medium">Try again</button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between border border-border rounded-lg bg-card p-4">
              <div>
                <h1 className="text-lg font-semibold text-foreground">Your Rating</h1>
                <p className="text-xs text-muted-foreground">{totalRatings} review{totalRatings !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex">{renderStars(Math.round(averageRating))}</div>
                <span className="text-2xl font-semibold text-foreground">{averageRating.toFixed(1)}</span>
              </div>
            </div>

            {ratings.length === 0 ? (
              <div className="py-16 text-center">
                <Star className="h-8 w-8 text-muted-foreground mx-auto mb-3" strokeWidth={1.5} />
                <h3 className="text-sm font-semibold text-foreground mb-1">No ratings yet</h3>
                <p className="text-xs text-muted-foreground">Complete assignments to start receiving reviews.</p>
              </div>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
                {ratings.map((rating) => (
                  <div key={rating.id} className="p-4 bg-card">
                    <div className="flex items-start gap-3">
                      <div className="shrink-0">
                        {rating.rater_profile_picture ? (
                          <img className="h-8 w-8 rounded-full border border-border object-cover" src={rating.rater_profile_picture} alt={rating.rater_name} />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border border-border">
                            <span className="text-xs font-medium text-muted-foreground">{rating.rater_name.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-sm font-medium text-foreground truncate">{rating.rater_name}</span>
                          <span className="text-xs text-muted-foreground shrink-0">{formatDate(rating.created_at)}</span>
                        </div>
                        <div className="flex mb-2">{renderStars(rating.rating)}</div>
                        {rating.comment && <p className="text-sm text-foreground leading-relaxed mb-2">{rating.comment}</p>}
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {rating.course_name} ({rating.course_code}) · <span className="capitalize">{rating.assignment_type.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyRatings;
