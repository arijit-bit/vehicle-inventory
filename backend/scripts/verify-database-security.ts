import 'dotenv/config';
import { Pool } from 'pg';

const databaseUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DIRECT_URL or DATABASE_URL is required');
}

const pool = new Pool({
  connectionString: databaseUrl,
  max: 1,
});

try {
  const { rows } = await pool.query<{
    authenticated_select: boolean;
    anon_select: boolean;
    rls_enabled: boolean;
    vehicle_count: number;
  }>(`
    SELECT
      relation.relrowsecurity AS rls_enabled,
      has_table_privilege('anon', 'public.vehicles', 'select') AS anon_select,
      has_table_privilege('authenticated', 'public.vehicles', 'select') AS authenticated_select,
      (SELECT COUNT(*)::int FROM public.vehicles) AS vehicle_count
    FROM pg_class relation
    JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
    WHERE namespace.nspname = 'public'
      AND relation.relname = 'vehicles'
  `);

  const [verification] = rows;

  if (!verification) {
    throw new Error('public.vehicles was not found');
  }

  console.log(JSON.stringify(verification, null, 2));

  if (!verification.rls_enabled || verification.anon_select || verification.authenticated_select) {
    throw new Error('Vehicle table security invariants are not satisfied');
  }
} finally {
  await pool.end();
}
