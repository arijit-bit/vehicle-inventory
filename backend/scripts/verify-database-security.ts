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
    table_name: string;
    row_count: number;
  }>(`
    SELECT
      relation.relname AS table_name,
      relation.relrowsecurity AS rls_enabled,
      has_table_privilege('anon', format('public.%I', relation.relname), 'select') AS anon_select,
      has_table_privilege(
        'authenticated',
        format('public.%I', relation.relname),
        'select'
      ) AS authenticated_select,
      CASE relation.relname
        WHEN 'users' THEN (SELECT COUNT(*)::int FROM public.users)
        WHEN 'vehicles' THEN (SELECT COUNT(*)::int FROM public.vehicles)
        WHEN 'media_assets' THEN (SELECT COUNT(*)::int FROM public.media_assets)
        WHEN 'orders' THEN (SELECT COUNT(*)::int FROM public.orders)
      END AS row_count
    FROM pg_class relation
    JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
    WHERE namespace.nspname = 'public'
      AND relation.relname IN ('users', 'vehicles', 'media_assets', 'orders')
    ORDER BY relation.relname
  `);

  if (rows.length !== 4) {
    throw new Error('One or more application tables were not found');
  }

  console.log(JSON.stringify(rows, null, 2));

  if (
    rows.some(
      (verification) =>
        !verification.rls_enabled || verification.anon_select || verification.authenticated_select,
    )
  ) {
    throw new Error('Application table security invariants are not satisfied');
  }
} finally {
  await pool.end();
}
