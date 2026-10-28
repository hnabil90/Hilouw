import { sql, type PostgresAdapter } from '@payloadcms/db-postgres'

export async function consumeContactRate(db: PostgresAdapter['drizzle'], key: string, now = Date.now()): Promise<boolean> {
  const increment = async (bucket: string, window: number) => {
    const result = await db.execute(sql`
      INSERT INTO payload_kv ("key", "data") VALUES (${`contact:${bucket}`}, jsonb_build_object('count', 1, 'expires', ${now + window}::bigint))
      ON CONFLICT ("key") DO UPDATE SET "data" = CASE
        WHEN COALESCE((payload_kv.data->>'expires')::bigint, 0) <= ${now}
          THEN jsonb_build_object('count', 1, 'expires', ${now + window}::bigint)
        ELSE jsonb_set(payload_kv.data, '{count}', to_jsonb(COALESCE((payload_kv.data->>'count')::int, 0) + 1)) END
      RETURNING (data->>'count')::int AS count`)
    return Number((result.rows[0] as { count: number }).count)
  }
  await db.execute(sql`DELETE FROM payload_kv WHERE "key" LIKE 'contact:%' AND (data->>'expires')::bigint < ${now - 86400000}`)
  if (await increment(key, 900000) > 5) return false
  return await increment('global', 3600000) <= 50
}
