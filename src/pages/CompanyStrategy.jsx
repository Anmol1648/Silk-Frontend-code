import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DealProvider } from '../context/DealContext';
import { profile as profileApi } from '../api/endpoints';
import { useToast } from '../context/AppContext';
import { AiMark } from '../components/ai-mark';
import SilkStrategyPage from './fundraising/silkStrategy/page';

export default function CompanyStrategy() {
  const { companyId } = useParams();
  const { error: toastError } = useToast();
  const [dealId, setDealId] = useState(null);
  const [failed, setFailed] = useState(null);

  useEffect(() => {
    let alive = true;
    setDealId(null);
    setFailed(null);
    profileApi.defaultDeal(companyId)
      .then((r) => { if (alive) setDealId(r.dealId); })
      .catch((e) => {
        if (!alive) return;
        setFailed(e);
        toastError(e);
      });
    return () => { alive = false; };
  }, [companyId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (failed) {
    return (
      <div className="card">
        <h2>We couldn't open your fundraising strategy</h2>
        <p className="hint">
          {failed.detail || failed.message
            || 'Something went wrong loading this company.'}
        </p>
        <button className="btn btn-secondary" onClick={() => window.location.reload()}>
          Try again
        </button>
      </div>
    );
  }

  if (!dealId) {
    return (
      <div className="flex h-[calc(100vh-120px)] w-full items-center justify-center bg-white">
        <div className="flex items-center gap-2.5 px-1">
          <div className="w-[18px] h-[18px] rounded-[4px] bg-[#030712]/[0.08] flex items-center justify-center text-[10px] font-semibold text-[#030712] silk-think-mark shrink-0 leading-none">
            ✳
          </div>
          <p className="silk-think-text text-[13px] font-normal leading-none">
            Reading company data…
          </p>
        </div>
      </div>
    );
  }

  return (
    <DealProvider dealId={dealId}>
      <SilkStrategyPage companyId={companyId} />
    </DealProvider>
  );
}
