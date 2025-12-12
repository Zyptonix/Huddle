import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient'; 
import Layout from '../../../components/ui/Layout';
import LiveOperatorConsole from '../../../components/tournaments/LiveOperatorConsole'; 

export default function OperatorPage() {
  const router = useRouter();
  const { id } = router.query;
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!router.isReady || !id) return;
    const fetchMatch = async () => {
      try {
        const { data, error } = await supabase
          .from('matches')
          .select(`*, tournaments(sport), teams_a:team_a_id(name, logo_url), teams_b:team_b_id(name, logo_url)`)
          .eq('id', id).single();
        if (error) throw error;
        setMatch(data);
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    };
    fetchMatch();
  }, [router.isReady, id]);

  if (loading) return <Layout dark={true}><div className="p-10 text-white">Loading...</div></Layout>;
  if (!match) return <Layout dark={true}><div className="p-10 text-white">Match not found</div></Layout>;

  return (
    <Layout dark={true}>
      <LiveOperatorConsole match={match} sport={match.tournaments?.sport || 'football'} />
    </Layout>
  );
}