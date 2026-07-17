-- Analytics RPC: aggregate daily stats and user performance in SQL
-- Returns both result sets in a single round-trip
CREATE OR REPLACE FUNCTION get_analytics_summary()
RETURNS JSON AS $$
DECLARE
 daily_stats JSON;
 user_stats JSON;
BEGIN
 SELECT json_agg(row_to_json(d)) INTO daily_stats
 FROM (
 SELECT
 assigned_date AS date,
 COUNT(*)::int AS uploaded,
 COUNT(*) FILTER (WHERE status = 'done')::int AS completed
 FROM leads
 WHERE assigned_date IS NOT NULL
 GROUP BY assigned_date
 ORDER BY assigned_date
 ) d;

 SELECT json_agg(row_to_json(u)) INTO user_stats
 FROM (
 SELECT
 u.username,
 COUNT(l.id)::int AS assigned,
 COUNT(l.id) FILTER (WHERE l.status = 'done')::int AS completed
 FROM leads l
 JOIN users u ON u.id = l.assigned_to
 WHERE l.assigned_to IS NOT NULL
 GROUP BY u.username
 ORDER BY assigned DESC
 ) u;

 RETURN json_build_object('daily', COALESCE(daily_stats, '[]'::json), 'userPerformance', COALESCE(user_stats, '[]'::json));
END;
$$ LANGUAGE plpgsql STABLE;
