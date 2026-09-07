import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DealProvider } from '../context/DealContext';
import { profile as profileApi } from '../api/endpoints';
import { useToast } from '../context/AppContext';
import { SkeletonCard } from '../components/ui';
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

  if (!dealId) return <><SkeletonCard /><SkeletonCard /></>;

  return (
    <DealProvider dealId={dealId}>
      <SilkStrategyPage companyId={companyId} />
    </DealProvider>
  );
}
