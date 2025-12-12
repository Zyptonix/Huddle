import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import Layout from '../../../components/ui/Layout';
import MatchStatsForm from '../../../components/tournaments/MatchStatsForm';
import { ChevronLeft } from 'lucide-react';

export default function MatchStatsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchMatch = async () => {
      const { data } = await supabase.from('matches').select(`*, teams_a:team_a_id(name), teams_b:team_b_id(name)`).eq('id', id).single();
      setMatch(data);
      setLoading(false);
    };
    fetchMatch();
  }, [id]);

  if (loading) return <Layout dark={true}><div className="p-10 text-white">Loading...</div></Layout>;
  if (!match) return <Layout dark={true}><div className="p-10 text-white">Match not found</div></Layout>;

  return (
    <Layout dark={true}>
      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto mb-6">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold"><ChevronLeft size={16} /> Back</button>
        </div>
        <MatchStatsForm match={match} />
      </div>
    </Layout>
  );
}