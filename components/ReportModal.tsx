import React, { useState } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { reportUser, reportPost, reportComment } from '../services/moderationService';
import { useAuth } from '../App';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'user' | 'post' | 'comment';
  targetId: string;
  targetUserId: string;
  targetName: string;
  postId?: string; // Required for comment reports
}

const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  type,
  targetId,
  targetUserId,
  targetName,
  postId
}) => {
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const reasons = {
    user: [
      'Harassment or bullying',
      'Inappropriate profile',
      'Spam or scam',
      'Impersonation',
      'Other'
    ],
    post: [
      'Spam or misleading',
      'Harassment or hate speech',
      'Violence or dangerous content',
      'Inappropriate content',
      'Copyright violation',
      'Other'
    ],
    comment: [
      'Spam',
      'Harassment or hate speech',
      'Inappropriate content',
      'Misinformation',
      'Other'
    ]
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !reason) return;

    setSubmitting(true);

    try {
      if (type === 'user') {
        await reportUser(user.uid, targetUserId, reason, description);
      } else if (type === 'post') {
        await reportPost(user.uid, targetId, targetUserId, reason, description);
      } else if (type === 'comment' && postId) {
        await reportComment(user.uid, targetId, targetUserId, postId, reason, description);
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setReason('');
        setDescription('');
      }, 2000);
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Report {type}</h2>
              <p className="text-sm text-slate-500">{targetName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Report Submitted</h3>
            <p className="text-sm text-slate-600">Thank you for helping keep our community safe.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Reason for reporting *
              </label>
              <div className="space-y-2">
                {reasons[type].map((r) => (
                  <label key={r} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                    <input
                      type="radio"
                      name="reason"
                      value={r}
                      checked={reason === r}
                      onChange={(e) => setReason(e.target.value)}
                      className="text-primary focus:ring-primary"
                      required
                    />
                    <span className="text-sm text-slate-700">{r}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Additional details (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide more context about why you're reporting this..."
                rows={4}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> Reports are reviewed by moderators. False or malicious reports may result in action against your account.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !reason}
                className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-red-700 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Report'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReportModal;

