import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../components/ui/dialog';
import { GeneratingStep, getStepStatus } from './ProfileHelpers';

/**
 * GeneratingDialog — Full-screen modal shown while the backend is
 * generating the company profile via the AI pipeline.
 */
export default function GeneratingDialog({ data }) {
  const isOpen = data?.status === 'generating' || data?.status === 'draft';

  return (
    <Dialog open={isOpen}>
      <DialogContent
        className="sm:max-w-[425px]"
        style={{ background: '#fff', color: '#000', border: '1px solid #e5e7eb', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
        showCloseButton={false}
      >
        <DialogHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ padding: 8, background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </div>
            <DialogTitle style={{ fontSize: 20, color: 'black', margin: 0 }}>Generating company profile…</DialogTitle>
          </div>
          <DialogDescription style={{ color: '#6b7280', fontSize: 14, marginTop: 0 }}>
            We're building a comprehensive profile from your website, uploaded documents, and public sources. This may take a few minutes.
          </DialogDescription>
        </DialogHeader>
        <div style={{ marginTop: 24 }}>
          <GeneratingStep
            label="Google search in progress"
            detail="Researching company across 10 topic areas"
            status={getStepStatus(data, 'research')}
          />
          <GeneratingStep
            label="Extracting uploaded documents"
            detail="Converting PDF, PPTX, Excel with OCR where needed"
            status={getStepStatus(data, 'documents')}
          />
          <GeneratingStep
            label="Consolidating evidence"
            detail="Merging web research with document data"
            status={getStepStatus(data, 'consolidating')}
          />
          <GeneratingStep
            label="Synthesizing company profile"
            detail="AI generating structured 17-section profile"
            status={getStepStatus(data, 'synthesizing')}
          />
          <GeneratingStep
            label="Saving profile"
            detail="Finalizing and storing results"
            status={getStepStatus(data, 'saving')}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 24, padding: '12px', background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, color: '#4b5563' }}>
          <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #ccc', borderTopColor: 'black', animation: 'spin 1s linear infinite' }} />
          This page will update automatically when ready
        </div>
      </DialogContent>
    </Dialog>
  );
}
