import React, { useState } from 'react';
import { API } from '../utils/api';
import { Star, X, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../utils/cn';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  ratedUserId: number;
  ratedUserName: string;
  assignmentRequestId: number;
  onRatingSubmitted: () => void;
  userType: 'client' | 'writer';
}

const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  ratedUserId,
  ratedUserName,
  assignmentRequestId,
  onRatingSubmitted,
  userType
}) => {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(API.ratings.submit, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          rated_id: ratedUserId,
          rating,
          comment,
          assignment_request_id: assignmentRequestId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit rating');
      }

      onRatingSubmitted();
      onClose();
    } catch (error) {
      setError('Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border shadow-lg rounded-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Rate {userType === 'client' ? 'Client' : 'Writer'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Feedback for {ratedUserName}</p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-accent hover:text-accent-foreground h-9 w-9"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-3 text-center">
                How was your experience?
              </label>
              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star
                      className={cn(
                        "h-10 w-10 transition-colors duration-200",
                        (hoveredRating ? hoveredRating >= star : rating >= star)
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-muted-foreground/30"
                      )}
                    />
                  </button>
                ))}
              </div>
              <div className="text-center mt-2 h-5">
                <span className="text-sm font-medium text-muted-foreground">
                  {rating === 1 && "Poor"}
                  {rating === 2 && "Fair"}
                  {rating === 3 && "Good"}
                  {rating === 4 && "Very Good"}
                  {rating === 5 && "Excellent"}
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-foreground mb-2">
                Review (Optional)
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                rows={4}
                placeholder={`Share your experience working with ${ratedUserName}...`}
              />
            </div>

            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || rating === 0}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4 disabled:opacity-50"
              >
                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : 'Submit Rating'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;