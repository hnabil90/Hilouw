import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Ne modifier que les textes éditoriaux : les adresses, liens, fichiers et identifiants
// restent stables. Inclure les versions évite de réintroduire les anciens textes.
const tables = ['site_settings', 'site_settings_navigation', 'site_settings_social_links',
  'home', '_home_v', 'products', '_products_v', 'posts', '_posts_v',
  'posts_gallery', '_posts_v_version_gallery', 'team', '_team_v', 'team_page', '_team_page_v',
  'contact_page', '_contact_page_v', 'contact_page_subjects', '_contact_page_v_version_subjects',
  'terms', '_terms_v', 'legal_notice', '_legal_notice_v', 'media']

function rewriteText(value: string): string {
  return value
    .replaceAll('Le bniouen, tout simplement irrésistible.', 'Des douceurs, tout simplement irrésistibles.')
    .replaceAll('Un univers de douceurs, imaginé autour du bniouen.', 'Un univers de douceurs, imaginé pour vos moments de partage.')
    .replace(/artisanale algérienne/gi, 'artisanale')
    .replace(/\bLe bniouen\b/g, 'La douceur').replace(/\ble bniouen\b/gi, 'la douceur')
    .replace(/\bdu bniouen\b/gi, 'de la douceur').replace(/\bau bniouen\b/gi, 'à la douceur')
    .replace(/\bBniouens?\b/g, (word) => word.endsWith('s') ? 'Douceurs' : 'Douceur')
    .replace(/\bbniouens?\b/gi, (word) => word.toLowerCase().endsWith('s') ? 'douceurs' : 'douceur')
    .replace(/algériennes/gi, 'artisanales').replace(/algérienne/gi, 'artisanale')
    .replace(/algériens/gi, 'artisanaux').replace(/algérien/gi, 'artisanal')
}

function rewriteRichText(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(rewriteRichText)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(value).map(([key, child]) =>
    [key, key === 'text' && typeof child === 'string' ? rewriteText(child) : rewriteRichText(child)]))
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ALTER COLUMN "tagline" SET DEFAULT 'Des douceurs, tout simplement irrésistibles.';`)

  for (const table of tables) {
    const schema = await db.execute(sql`SELECT column_name, data_type FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ${table}`)
    const columns = (schema.rows as { column_name: string; data_type: string }[]).filter(({ column_name, data_type }) =>
      data_type === 'jsonb' || (data_type === 'character varying' && (
        /(^|_)(title|text|description|label|summary|excerpt|alt|caption|tagline|subtitle|message)$/.test(column_name)
        || (['products', '_products_v'].includes(table) && /^(version_)?(name|allergen_information)$/.test(column_name)))))
    if (!columns.length) continue
    const records = await db.execute(sql`SELECT ${sql.join(['id', ...columns.map((column) => column.column_name)].map((name) => sql.identifier(name)), sql`, `)} FROM ${sql.identifier(table)}`)
    for (const row of records.rows as Record<string, unknown>[]) {
      const changes = columns.flatMap(({ column_name, data_type }) => {
        const original = row[column_name]
        const updated = data_type === 'jsonb' ? rewriteRichText(original) : typeof original === 'string' ? rewriteText(original) : original
        if (JSON.stringify(original) === JSON.stringify(updated)) return []
        return [data_type === 'jsonb'
          ? sql`${sql.identifier(column_name)} = ${JSON.stringify(updated)}::jsonb`
          : sql`${sql.identifier(column_name)} = ${updated}`]
      })
      if (changes.length) await db.execute(sql`UPDATE ${sql.identifier(table)} SET ${sql.join(changes, sql`, `)} WHERE id = ${row.id}`)
    }
  }
}

// Les textes rédigés ne sont pas restaurés automatiquement : plusieurs formulations
// anciennes peuvent aboutir au même texte. Utiliser la sauvegarde pour les récupérer.
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ALTER COLUMN "tagline" SET DEFAULT 'Le bniouen, tout simplement irrésistible.';`)
}
