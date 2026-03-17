import React, { useState } from 'react';
import { API } from '../utils/api';
import { Star, X, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../utils/cn';

interface RatingModalProps {
  isOpen: boolean; onClose: () => void; ratedUserId: number; ratedUserName: string;
  assignmentRequestId: number; onRatingSubmitted: () => void; userType: 'client' | 'writer';
}

const RatingModal: React.FC<RatingModalProps> = ({ isOpen, onClose, ratedUserId, ratedUserName, assignmentRequestId, onRatingSubmitted, userType }) => {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { setError('Please select a rating'); return; }
    setIsSubmitting(true); setError(null);
    try {
      const response = await fetch(API.ratings.submit, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ rated_id: ratedUserId, rating, comment, assignment_request_id: assignmentRequestId }) });
      if (!response.ok) { const d = await response.json(); throw new Error(d.error || 'Failed'); }
      onRatingSubmitted(); onClose();
    } catch (error) { setError('Failed to submit. Please try again.'); } finally { setIsSubmitting(false); }
  };

  const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg max-w-sm w-full overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex justify-between items-center">
          <div>
            <h2 className="text-base font-semibold text-foreground">Rate {userType === 'client' ? 'Client' : 'Writer'}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{ratedUserName}</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-md hover:bg-accent flex items-center justify-center text-muted-foreground"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3">How was your experience?</p>
              <div className="flex justify-center gap-1.5">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} type="button" onClick={() => setRating(star)} onMouseEnter={() => setHoveredRating(star)} onMouseLeave={() => setHoveredRating(0)}
                    className="focus:outline-none transition-transform hover:scale-110 active:scale-95">
                    <Star className={cn("h-8 w-8 transition-colors", (hoveredRating ? hoveredRating >= star : rating >= star) ? "text-amber-500 fill-amber-500" : "text-border")} />
                  </button>
                ))}
              </div>
              <div className="h-5 mt-2"><span className="text-xs font-medium text-muted-foreground">{labels[rating]}</span></div>
            </div>
            <div>
              <label htmlFor="comment" className="text-xs font-medium text-foreground mb-1.5 block">Review (optional)</label>
              <textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                placeholder={`Share your experience with ${ratedUserName}...`} />
            </div>
            {error && <div className="p-2.5 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20 flex items-center gap-2"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={onClose} className="h-8 px-3 text-sm rounded-md border border-border hover:bg-accent transition-colors">Cancel</button>
              <button type="submit" disabled={isSubmitting || rating === 0}
                className="h-8 px-4 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 inline-flex items-center">
                {isSubmitting ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Submitting...</> : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;
