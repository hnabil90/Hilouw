import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_products_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__products_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_posts_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__posts_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_team_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__team_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_media_scope" AS ENUM('catalog', 'editorial');
  CREATE TYPE "public"."enum_home_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__home_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_team_page_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__team_page_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_contact_page_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__contact_page_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_terms_validation_status" AS ENUM('provisional', 'validated');
  CREATE TYPE "public"."enum_terms_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__terms_v_version_validation_status" AS ENUM('provisional', 'validated');
  CREATE TYPE "public"."enum__terms_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_legal_notice_validation_status" AS ENUM('provisional', 'validated');
  CREATE TYPE "public"."enum_legal_notice_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__legal_notice_v_version_validation_status" AS ENUM('provisional', 'validated');
  CREATE TYPE "public"."enum__legal_notice_v_version_status" AS ENUM('draft', 'published');
  ALTER TYPE "public"."enum_users_role" ADD VALUE 'catalog-manager' BEFORE 'editor';
  CREATE TABLE "products_gallery" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "image_id" integer
  );

  CREATE TABLE "products" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar,
    "slug" varchar,
    "summary" varchar,
    "description" jsonb,
    "price_amount" numeric,
    "price_currency" varchar DEFAULT 'EUR',
    "allergen_information" varchar,
    "useful_information" jsonb,
    "cta_label" varchar,
    "cta_href" varchar,
    "featured" boolean DEFAULT false,
    "order" numeric DEFAULT 0,
    "archived" boolean DEFAULT false,
    "seo_title" varchar,
    "seo_description" varchar,
    "seo_image_id" integer,
    "seo_no_index" boolean DEFAULT false,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "_status" "enum_products_status" DEFAULT 'draft'
  );

  CREATE TABLE "_products_v_version_gallery" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "image_id" integer,
    "_uuid" varchar
  );

  CREATE TABLE "_products_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version_name" varchar,
    "version_slug" varchar,
    "version_summary" varchar,
    "version_description" jsonb,
    "version_price_amount" numeric,
    "version_price_currency" varchar DEFAULT 'EUR',
    "version_allergen_information" varchar,
    "version_useful_information" jsonb,
    "version_cta_label" varchar,
    "version_cta_href" varchar,
    "version_featured" boolean DEFAULT false,
    "version_order" numeric DEFAULT 0,
    "version_archived" boolean DEFAULT false,
    "version_seo_title" varchar,
    "version_seo_description" varchar,
    "version_seo_image_id" integer,
    "version_seo_no_index" boolean DEFAULT false,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version__status" "enum__products_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "latest" boolean
  );

  CREATE TABLE "posts_gallery" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "asset_id" integer,
    "caption" varchar
  );

  CREATE TABLE "posts" (
    "id" serial PRIMARY KEY NOT NULL,
    "title" varchar,
    "slug" varchar,
    "excerpt" varchar,
    "cover_id" integer,
    "content" jsonb,
    "embed_u_r_l" varchar,
    "published_at" timestamp(3) with time zone,
    "author_id" integer,
    "seo_title" varchar,
    "seo_description" varchar,
    "seo_image_id" integer,
    "seo_no_index" boolean DEFAULT false,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "_status" "enum_posts_status" DEFAULT 'draft'
  );

  CREATE TABLE "_posts_v_version_gallery" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "asset_id" integer,
    "caption" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_posts_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version_title" varchar,
    "version_slug" varchar,
    "version_excerpt" varchar,
    "version_cover_id" integer,
    "version_content" jsonb,
    "version_embed_u_r_l" varchar,
    "version_published_at" timestamp(3) with time zone,
    "version_author_id" integer,
    "version_seo_title" varchar,
    "version_seo_description" varchar,
    "version_seo_image_id" integer,
    "version_seo_no_index" boolean DEFAULT false,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version__status" "enum__posts_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "latest" boolean
  );

  CREATE TABLE "team" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar,
    "position" varchar,
    "portrait_id" integer,
    "biography" jsonb,
    "featured" boolean DEFAULT false,
    "order" numeric DEFAULT 0,
    "seo_title" varchar,
    "seo_description" varchar,
    "seo_image_id" integer,
    "seo_no_index" boolean DEFAULT false,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "_status" "enum_team_status" DEFAULT 'draft'
  );

  CREATE TABLE "_team_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version_name" varchar,
    "version_position" varchar,
    "version_portrait_id" integer,
    "version_biography" jsonb,
    "version_featured" boolean DEFAULT false,
    "version_order" numeric DEFAULT 0,
    "version_seo_title" varchar,
    "version_seo_description" varchar,
    "version_seo_image_id" integer,
    "version_seo_no_index" boolean DEFAULT false,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version__status" "enum__team_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "latest" boolean
  );

  CREATE TABLE "media" (
    "id" serial PRIMARY KEY NOT NULL,
    "alt" varchar NOT NULL,
    "caption" varchar,
    "credit" varchar,
    "scope" "enum_media_scope" NOT NULL,
    "prefix" varchar DEFAULT '',
    "_objectkey" varchar,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "url" varchar,
    "thumbnail_u_r_l" varchar,
    "filename" varchar,
    "mime_type" varchar,
    "filesize" numeric,
    "width" numeric,
    "height" numeric,
    "focal_x" numeric,
    "focal_y" numeric,
    "sizes_thumbnail_url" varchar,
    "sizes_thumbnail_width" numeric,
    "sizes_thumbnail_height" numeric,
    "sizes_thumbnail_mime_type" varchar,
    "sizes_thumbnail_filesize" numeric,
    "sizes_thumbnail_filename" varchar,
    "sizes_card_url" varchar,
    "sizes_card_width" numeric,
    "sizes_card_height" numeric,
    "sizes_card_mime_type" varchar,
    "sizes_card_filesize" numeric,
    "sizes_card_filename" varchar,
    "sizes_large_url" varchar,
    "sizes_large_width" numeric,
    "sizes_large_height" numeric,
    "sizes_large_mime_type" varchar,
    "sizes_large_filesize" numeric,
    "sizes_large_filename" varchar
  );

  CREATE TABLE "site_settings_navigation" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "link_label" varchar,
    "link_href" varchar
  );

  CREATE TABLE "site_settings_social_links" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "link_label" varchar,
    "link_href" varchar
  );

  CREATE TABLE "home" (
    "id" serial PRIMARY KEY NOT NULL,
    "hero_title" varchar,
    "hero_text" varchar,
    "hero_image_id" integer,
    "hero_cta_label" varchar,
    "hero_cta_href" varchar,
    "introduction" jsonb,
    "products_title" varchar,
    "show_products" boolean DEFAULT true,
    "craftsmanship_title" varchar,
    "craftsmanship_text" jsonb,
    "craftsmanship_image_id" integer,
    "posts_title" varchar,
    "show_posts" boolean DEFAULT true,
    "team_title" varchar,
    "show_team" boolean DEFAULT true,
    "contact_text" varchar,
    "contact_c_t_a_label" varchar,
    "contact_c_t_a_href" varchar,
    "seo_title" varchar,
    "seo_description" varchar,
    "seo_image_id" integer,
    "seo_no_index" boolean DEFAULT false,
    "_status" "enum_home_status" DEFAULT 'draft',
    "updated_at" timestamp(3) with time zone,
    "created_at" timestamp(3) with time zone
  );

  CREATE TABLE "_home_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "version_hero_title" varchar,
    "version_hero_text" varchar,
    "version_hero_image_id" integer,
    "version_hero_cta_label" varchar,
    "version_hero_cta_href" varchar,
    "version_introduction" jsonb,
    "version_products_title" varchar,
    "version_show_products" boolean DEFAULT true,
    "version_craftsmanship_title" varchar,
    "version_craftsmanship_text" jsonb,
    "version_craftsmanship_image_id" integer,
    "version_posts_title" varchar,
    "version_show_posts" boolean DEFAULT true,
    "version_team_title" varchar,
    "version_show_team" boolean DEFAULT true,
    "version_contact_text" varchar,
    "version_contact_c_t_a_label" varchar,
    "version_contact_c_t_a_href" varchar,
    "version_seo_title" varchar,
    "version_seo_description" varchar,
    "version_seo_image_id" integer,
    "version_seo_no_index" boolean DEFAULT false,
    "version__status" "enum__home_v_version_status" DEFAULT 'draft',
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "latest" boolean
  );

  CREATE TABLE "team_page" (
    "id" serial PRIMARY KEY NOT NULL,
    "title" varchar,
    "introduction" jsonb,
    "history" jsonb,
    "values" jsonb,
    "image_id" integer,
    "seo_title" varchar,
    "seo_description" varchar,
    "seo_image_id" integer,
    "seo_no_index" boolean DEFAULT false,
    "_status" "enum_team_page_status" DEFAULT 'draft',
    "updated_at" timestamp(3) with time zone,
    "created_at" timestamp(3) with time zone
  );

  CREATE TABLE "_team_page_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "version_title" varchar,
    "version_introduction" jsonb,
    "version_history" jsonb,
    "version_values" jsonb,
    "version_image_id" integer,
    "version_seo_title" varchar,
    "version_seo_description" varchar,
    "version_seo_image_id" integer,
    "version_seo_no_index" boolean DEFAULT false,
    "version__status" "enum__team_page_v_version_status" DEFAULT 'draft',
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "latest" boolean
  );

  CREATE TABLE "contact_page_subjects" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar
  );

  CREATE TABLE "contact_page" (
    "id" serial PRIMARY KEY NOT NULL,
    "title" varchar,
    "introduction" jsonb,
    "privacy_information" jsonb,
    "consent_label" varchar,
    "seo_title" varchar,
    "seo_description" varchar,
    "seo_image_id" integer,
    "seo_no_index" boolean DEFAULT false,
    "_status" "enum_contact_page_status" DEFAULT 'draft',
    "updated_at" timestamp(3) with time zone,
    "created_at" timestamp(3) with time zone
  );

  CREATE TABLE "_contact_page_v_version_subjects" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "label" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_contact_page_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "version_title" varchar,
    "version_introduction" jsonb,
    "version_privacy_information" jsonb,
    "version_consent_label" varchar,
    "version_seo_title" varchar,
    "version_seo_description" varchar,
    "version_seo_image_id" integer,
    "version_seo_no_index" boolean DEFAULT false,
    "version__status" "enum__contact_page_v_version_status" DEFAULT 'draft',
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "latest" boolean
  );

  CREATE TABLE "terms" (
    "id" serial PRIMARY KEY NOT NULL,
    "title" varchar,
    "validation_status" "enum_terms_validation_status" DEFAULT 'provisional',
    "content" jsonb,
    "last_reviewed_at" timestamp(3) with time zone,
    "seo_title" varchar,
    "seo_description" varchar,
    "seo_image_id" integer,
    "seo_no_index" boolean DEFAULT false,
    "_status" "enum_terms_status" DEFAULT 'draft',
    "updated_at" timestamp(3) with time zone,
    "created_at" timestamp(3) with time zone
  );

  CREATE TABLE "_terms_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "version_title" varchar,
    "version_validation_status" "enum__terms_v_version_validation_status" DEFAULT 'provisional',
    "version_content" jsonb,
    "version_last_reviewed_at" timestamp(3) with time zone,
    "version_seo_title" varchar,
    "version_seo_description" varchar,
    "version_seo_image_id" integer,
    "version_seo_no_index" boolean DEFAULT false,
    "version__status" "enum__terms_v_version_status" DEFAULT 'draft',
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "latest" boolean
  );

  CREATE TABLE "legal_notice" (
    "id" serial PRIMARY KEY NOT NULL,
    "title" varchar,
    "validation_status" "enum_legal_notice_validation_status" DEFAULT 'provisional',
    "content" jsonb,
    "last_reviewed_at" timestamp(3) with time zone,
    "publisher" varchar,
    "hosting" varchar,
    "contact_details" varchar,
    "seo_title" varchar,
    "seo_description" varchar,
    "seo_image_id" integer,
    "seo_no_index" boolean DEFAULT false,
    "_status" "enum_legal_notice_status" DEFAULT 'draft',
    "updated_at" timestamp(3) with time zone,
    "created_at" timestamp(3) with time zone
  );

  CREATE TABLE "_legal_notice_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "version_title" varchar,
    "version_validation_status" "enum__legal_notice_v_version_validation_status" DEFAULT 'provisional',
    "version_content" jsonb,
    "version_last_reviewed_at" timestamp(3) with time zone,
    "version_publisher" varchar,
    "version_hosting" varchar,
    "version_contact_details" varchar,
    "version_seo_title" varchar,
    "version_seo_description" varchar,
    "version_seo_image_id" integer,
    "version_seo_no_index" boolean DEFAULT false,
    "version__status" "enum__legal_notice_v_version_status" DEFAULT 'draft',
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "latest" boolean
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "products_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "posts_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "team_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "media_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "logo_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "contact_email" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "phone" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "address" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "footer_text" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "seo_title" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "seo_description" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "seo_image_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "seo_no_index" boolean DEFAULT false;
  ALTER TABLE "products_gallery" ADD CONSTRAINT "products_gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_gallery" ADD CONSTRAINT "products_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v_version_gallery" ADD CONSTRAINT "_products_v_version_gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v_version_gallery" ADD CONSTRAINT "_products_v_version_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_parent_id_products_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts_gallery" ADD CONSTRAINT "posts_gallery_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts_gallery" ADD CONSTRAINT "posts_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_team_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v_version_gallery" ADD CONSTRAINT "_posts_v_version_gallery_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v_version_gallery" ADD CONSTRAINT "_posts_v_version_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_parent_id_posts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_cover_id_media_id_fk" FOREIGN KEY ("version_cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_author_id_team_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "team" ADD CONSTRAINT "team_portrait_id_media_id_fk" FOREIGN KEY ("portrait_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "team" ADD CONSTRAINT "team_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_team_v" ADD CONSTRAINT "_team_v_parent_id_team_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_team_v" ADD CONSTRAINT "_team_v_version_portrait_id_media_id_fk" FOREIGN KEY ("version_portrait_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_team_v" ADD CONSTRAINT "_team_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings_navigation" ADD CONSTRAINT "site_settings_navigation_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_social_links" ADD CONSTRAINT "site_settings_social_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home" ADD CONSTRAINT "home_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home" ADD CONSTRAINT "home_craftsmanship_image_id_media_id_fk" FOREIGN KEY ("craftsmanship_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home" ADD CONSTRAINT "home_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v" ADD CONSTRAINT "_home_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v" ADD CONSTRAINT "_home_v_version_craftsmanship_image_id_media_id_fk" FOREIGN KEY ("version_craftsmanship_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v" ADD CONSTRAINT "_home_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "team_page" ADD CONSTRAINT "team_page_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "team_page" ADD CONSTRAINT "team_page_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_team_page_v" ADD CONSTRAINT "_team_page_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_team_page_v" ADD CONSTRAINT "_team_page_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "contact_page_subjects" ADD CONSTRAINT "contact_page_subjects_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."contact_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "contact_page" ADD CONSTRAINT "contact_page_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_contact_page_v_version_subjects" ADD CONSTRAINT "_contact_page_v_version_subjects_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_contact_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_contact_page_v" ADD CONSTRAINT "_contact_page_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "terms" ADD CONSTRAINT "terms_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_terms_v" ADD CONSTRAINT "_terms_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "legal_notice" ADD CONSTRAINT "legal_notice_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_legal_notice_v" ADD CONSTRAINT "_legal_notice_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "products_gallery_order_idx" ON "products_gallery" USING btree ("_order");
  CREATE INDEX "products_gallery_parent_id_idx" ON "products_gallery" USING btree ("_parent_id");
  CREATE INDEX "products_gallery_image_idx" ON "products_gallery" USING btree ("image_id");
  CREATE UNIQUE INDEX "products_slug_idx" ON "products" USING btree ("slug");
  CREATE INDEX "products_archived_idx" ON "products" USING btree ("archived");
  CREATE INDEX "products_seo_seo_image_idx" ON "products" USING btree ("seo_image_id");
  CREATE INDEX "products_updated_at_idx" ON "products" USING btree ("updated_at");
  CREATE INDEX "products_created_at_idx" ON "products" USING btree ("created_at");
  CREATE INDEX "products__status_idx" ON "products" USING btree ("_status");
  CREATE INDEX "_products_v_version_gallery_order_idx" ON "_products_v_version_gallery" USING btree ("_order");
  CREATE INDEX "_products_v_version_gallery_parent_id_idx" ON "_products_v_version_gallery" USING btree ("_parent_id");
  CREATE INDEX "_products_v_version_gallery_image_idx" ON "_products_v_version_gallery" USING btree ("image_id");
  CREATE INDEX "_products_v_parent_idx" ON "_products_v" USING btree ("parent_id");
  CREATE INDEX "_products_v_version_version_slug_idx" ON "_products_v" USING btree ("version_slug");
  CREATE INDEX "_products_v_version_version_archived_idx" ON "_products_v" USING btree ("version_archived");
  CREATE INDEX "_products_v_version_seo_version_seo_image_idx" ON "_products_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_products_v_version_version_updated_at_idx" ON "_products_v" USING btree ("version_updated_at");
  CREATE INDEX "_products_v_version_version_created_at_idx" ON "_products_v" USING btree ("version_created_at");
  CREATE INDEX "_products_v_version_version__status_idx" ON "_products_v" USING btree ("version__status");
  CREATE INDEX "_products_v_created_at_idx" ON "_products_v" USING btree ("created_at");
  CREATE INDEX "_products_v_updated_at_idx" ON "_products_v" USING btree ("updated_at");
  CREATE INDEX "_products_v_latest_idx" ON "_products_v" USING btree ("latest");
  CREATE INDEX "posts_gallery_order_idx" ON "posts_gallery" USING btree ("_order");
  CREATE INDEX "posts_gallery_parent_id_idx" ON "posts_gallery" USING btree ("_parent_id");
  CREATE INDEX "posts_gallery_asset_idx" ON "posts_gallery" USING btree ("asset_id");
  CREATE UNIQUE INDEX "posts_slug_idx" ON "posts" USING btree ("slug");
  CREATE INDEX "posts_cover_idx" ON "posts" USING btree ("cover_id");
  CREATE INDEX "posts_published_at_idx" ON "posts" USING btree ("published_at");
  CREATE INDEX "posts_author_idx" ON "posts" USING btree ("author_id");
  CREATE INDEX "posts_seo_seo_image_idx" ON "posts" USING btree ("seo_image_id");
  CREATE INDEX "posts_updated_at_idx" ON "posts" USING btree ("updated_at");
  CREATE INDEX "posts_created_at_idx" ON "posts" USING btree ("created_at");
  CREATE INDEX "posts__status_idx" ON "posts" USING btree ("_status");
  CREATE INDEX "_posts_v_version_gallery_order_idx" ON "_posts_v_version_gallery" USING btree ("_order");
  CREATE INDEX "_posts_v_version_gallery_parent_id_idx" ON "_posts_v_version_gallery" USING btree ("_parent_id");
  CREATE INDEX "_posts_v_version_gallery_asset_idx" ON "_posts_v_version_gallery" USING btree ("asset_id");
  CREATE INDEX "_posts_v_parent_idx" ON "_posts_v" USING btree ("parent_id");
  CREATE INDEX "_posts_v_version_version_slug_idx" ON "_posts_v" USING btree ("version_slug");
  CREATE INDEX "_posts_v_version_version_cover_idx" ON "_posts_v" USING btree ("version_cover_id");
  CREATE INDEX "_posts_v_version_version_published_at_idx" ON "_posts_v" USING btree ("version_published_at");
  CREATE INDEX "_posts_v_version_version_author_idx" ON "_posts_v" USING btree ("version_author_id");
  CREATE INDEX "_posts_v_version_seo_version_seo_image_idx" ON "_posts_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_posts_v_version_version_updated_at_idx" ON "_posts_v" USING btree ("version_updated_at");
  CREATE INDEX "_posts_v_version_version_created_at_idx" ON "_posts_v" USING btree ("version_created_at");
  CREATE INDEX "_posts_v_version_version__status_idx" ON "_posts_v" USING btree ("version__status");
  CREATE INDEX "_posts_v_created_at_idx" ON "_posts_v" USING btree ("created_at");
  CREATE INDEX "_posts_v_updated_at_idx" ON "_posts_v" USING btree ("updated_at");
  CREATE INDEX "_posts_v_latest_idx" ON "_posts_v" USING btree ("latest");
  CREATE INDEX "team_portrait_idx" ON "team" USING btree ("portrait_id");
  CREATE INDEX "team_seo_seo_image_idx" ON "team" USING btree ("seo_image_id");
  CREATE INDEX "team_updated_at_idx" ON "team" USING btree ("updated_at");
  CREATE INDEX "team_created_at_idx" ON "team" USING btree ("created_at");
  CREATE INDEX "team__status_idx" ON "team" USING btree ("_status");
  CREATE INDEX "_team_v_parent_idx" ON "_team_v" USING btree ("parent_id");
  CREATE INDEX "_team_v_version_version_portrait_idx" ON "_team_v" USING btree ("version_portrait_id");
  CREATE INDEX "_team_v_version_seo_version_seo_image_idx" ON "_team_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_team_v_version_version_updated_at_idx" ON "_team_v" USING btree ("version_updated_at");
  CREATE INDEX "_team_v_version_version_created_at_idx" ON "_team_v" USING btree ("version_created_at");
  CREATE INDEX "_team_v_version_version__status_idx" ON "_team_v" USING btree ("version__status");
  CREATE INDEX "_team_v_created_at_idx" ON "_team_v" USING btree ("created_at");
  CREATE INDEX "_team_v_updated_at_idx" ON "_team_v" USING btree ("updated_at");
  CREATE INDEX "_team_v_latest_idx" ON "_team_v" USING btree ("latest");
  CREATE INDEX "media_scope_idx" ON "media" USING btree ("scope");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_large_sizes_large_filename_idx" ON "media" USING btree ("sizes_large_filename");
  CREATE INDEX "site_settings_navigation_order_idx" ON "site_settings_navigation" USING btree ("_order");
  CREATE INDEX "site_settings_navigation_parent_id_idx" ON "site_settings_navigation" USING btree ("_parent_id");
  CREATE INDEX "site_settings_social_links_order_idx" ON "site_settings_social_links" USING btree ("_order");
  CREATE INDEX "site_settings_social_links_parent_id_idx" ON "site_settings_social_links" USING btree ("_parent_id");
  CREATE INDEX "home_hero_hero_image_idx" ON "home" USING btree ("hero_image_id");
  CREATE INDEX "home_craftsmanship_craftsmanship_image_idx" ON "home" USING btree ("craftsmanship_image_id");
  CREATE INDEX "home_seo_seo_image_idx" ON "home" USING btree ("seo_image_id");
  CREATE INDEX "home__status_idx" ON "home" USING btree ("_status");
  CREATE INDEX "_home_v_version_hero_version_hero_image_idx" ON "_home_v" USING btree ("version_hero_image_id");
  CREATE INDEX "_home_v_version_craftsmanship_version_craftsmanship_imag_idx" ON "_home_v" USING btree ("version_craftsmanship_image_id");
  CREATE INDEX "_home_v_version_seo_version_seo_image_idx" ON "_home_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_home_v_version_version__status_idx" ON "_home_v" USING btree ("version__status");
  CREATE INDEX "_home_v_created_at_idx" ON "_home_v" USING btree ("created_at");
  CREATE INDEX "_home_v_updated_at_idx" ON "_home_v" USING btree ("updated_at");
  CREATE INDEX "_home_v_latest_idx" ON "_home_v" USING btree ("latest");
  CREATE INDEX "team_page_image_idx" ON "team_page" USING btree ("image_id");
  CREATE INDEX "team_page_seo_seo_image_idx" ON "team_page" USING btree ("seo_image_id");
  CREATE INDEX "team_page__status_idx" ON "team_page" USING btree ("_status");
  CREATE INDEX "_team_page_v_version_version_image_idx" ON "_team_page_v" USING btree ("version_image_id");
  CREATE INDEX "_team_page_v_version_seo_version_seo_image_idx" ON "_team_page_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_team_page_v_version_version__status_idx" ON "_team_page_v" USING btree ("version__status");
  CREATE INDEX "_team_page_v_created_at_idx" ON "_team_page_v" USING btree ("created_at");
  CREATE INDEX "_team_page_v_updated_at_idx" ON "_team_page_v" USING btree ("updated_at");
  CREATE INDEX "_team_page_v_latest_idx" ON "_team_page_v" USING btree ("latest");
  CREATE INDEX "contact_page_subjects_order_idx" ON "contact_page_subjects" USING btree ("_order");
  CREATE INDEX "contact_page_subjects_parent_id_idx" ON "contact_page_subjects" USING btree ("_parent_id");
  CREATE INDEX "contact_page_seo_seo_image_idx" ON "contact_page" USING btree ("seo_image_id");
  CREATE INDEX "contact_page__status_idx" ON "contact_page" USING btree ("_status");
  CREATE INDEX "_contact_page_v_version_subjects_order_idx" ON "_contact_page_v_version_subjects" USING btree ("_order");
  CREATE INDEX "_contact_page_v_version_subjects_parent_id_idx" ON "_contact_page_v_version_subjects" USING btree ("_parent_id");
  CREATE INDEX "_contact_page_v_version_seo_version_seo_image_idx" ON "_contact_page_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_contact_page_v_version_version__status_idx" ON "_contact_page_v" USING btree ("version__status");
  CREATE INDEX "_contact_page_v_created_at_idx" ON "_contact_page_v" USING btree ("created_at");
  CREATE INDEX "_contact_page_v_updated_at_idx" ON "_contact_page_v" USING btree ("updated_at");
  CREATE INDEX "_contact_page_v_latest_idx" ON "_contact_page_v" USING btree ("latest");
  CREATE INDEX "terms_seo_seo_image_idx" ON "terms" USING btree ("seo_image_id");
  CREATE INDEX "terms__status_idx" ON "terms" USING btree ("_status");
  CREATE INDEX "_terms_v_version_seo_version_seo_image_idx" ON "_terms_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_terms_v_version_version__status_idx" ON "_terms_v" USING btree ("version__status");
  CREATE INDEX "_terms_v_created_at_idx" ON "_terms_v" USING btree ("created_at");
  CREATE INDEX "_terms_v_updated_at_idx" ON "_terms_v" USING btree ("updated_at");
  CREATE INDEX "_terms_v_latest_idx" ON "_terms_v" USING btree ("latest");
  CREATE INDEX "legal_notice_seo_seo_image_idx" ON "legal_notice" USING btree ("seo_image_id");
  CREATE INDEX "legal_notice__status_idx" ON "legal_notice" USING btree ("_status");
  CREATE INDEX "_legal_notice_v_version_seo_version_seo_image_idx" ON "_legal_notice_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_legal_notice_v_version_version__status_idx" ON "_legal_notice_v" USING btree ("version__status");
  CREATE INDEX "_legal_notice_v_created_at_idx" ON "_legal_notice_v" USING btree ("created_at");
  CREATE INDEX "_legal_notice_v_updated_at_idx" ON "_legal_notice_v" USING btree ("updated_at");
  CREATE INDEX "_legal_notice_v_latest_idx" ON "_legal_notice_v" USING btree ("latest");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_team_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_products_id_idx" ON "payload_locked_documents_rels" USING btree ("products_id");
  CREATE INDEX "payload_locked_documents_rels_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("posts_id");
  CREATE INDEX "payload_locked_documents_rels_team_id_idx" ON "payload_locked_documents_rels" USING btree ("team_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "site_settings_logo_idx" ON "site_settings" USING btree ("logo_id");
  CREATE INDEX "site_settings_seo_seo_image_idx" ON "site_settings" USING btree ("seo_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "products" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_products_v_version_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_products_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "posts_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "posts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_posts_v_version_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_posts_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "team" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_team_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "media" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_navigation" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_social_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_home_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "team_page" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_team_page_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "contact_page_subjects" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "contact_page" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_contact_page_v_version_subjects" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_contact_page_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "terms" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_terms_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "legal_notice" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_legal_notice_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "products_gallery" CASCADE;
  DROP TABLE "products" CASCADE;
  DROP TABLE "_products_v_version_gallery" CASCADE;
  DROP TABLE "_products_v" CASCADE;
  DROP TABLE "posts_gallery" CASCADE;
  DROP TABLE "posts" CASCADE;
  DROP TABLE "_posts_v_version_gallery" CASCADE;
  DROP TABLE "_posts_v" CASCADE;
  DROP TABLE "team" CASCADE;
  DROP TABLE "_team_v" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "site_settings_navigation" CASCADE;
  DROP TABLE "site_settings_social_links" CASCADE;
  DROP TABLE "home" CASCADE;
  DROP TABLE "_home_v" CASCADE;
  DROP TABLE "team_page" CASCADE;
  DROP TABLE "_team_page_v" CASCADE;
  DROP TABLE "contact_page_subjects" CASCADE;
  DROP TABLE "contact_page" CASCADE;
  DROP TABLE "_contact_page_v_version_subjects" CASCADE;
  DROP TABLE "_contact_page_v" CASCADE;
  DROP TABLE "terms" CASCADE;
  DROP TABLE "_terms_v" CASCADE;
  DROP TABLE "legal_notice" CASCADE;
  DROP TABLE "_legal_notice_v" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_products_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_posts_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_team_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_media_fk";

  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_logo_id_media_id_fk";

  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_seo_image_id_media_id_fk";

  ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'editor'::text;
  DROP TYPE "public"."enum_users_role";
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor');
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'editor'::"public"."enum_users_role";
  ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."enum_users_role" USING "role"::"public"."enum_users_role";
  DROP INDEX "payload_locked_documents_rels_products_id_idx";
  DROP INDEX "payload_locked_documents_rels_posts_id_idx";
  DROP INDEX "payload_locked_documents_rels_team_id_idx";
  DROP INDEX "payload_locked_documents_rels_media_id_idx";
  DROP INDEX "site_settings_logo_idx";
  DROP INDEX "site_settings_seo_seo_image_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "products_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "posts_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "team_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "media_id";
  ALTER TABLE "site_settings" DROP COLUMN "logo_id";
  ALTER TABLE "site_settings" DROP COLUMN "contact_email";
  ALTER TABLE "site_settings" DROP COLUMN "phone";
  ALTER TABLE "site_settings" DROP COLUMN "address";
  ALTER TABLE "site_settings" DROP COLUMN "footer_text";
  ALTER TABLE "site_settings" DROP COLUMN "seo_title";
  ALTER TABLE "site_settings" DROP COLUMN "seo_description";
  ALTER TABLE "site_settings" DROP COLUMN "seo_image_id";
  ALTER TABLE "site_settings" DROP COLUMN "seo_no_index";
  DROP TYPE "public"."enum_products_status";
  DROP TYPE "public"."enum__products_v_version_status";
  DROP TYPE "public"."enum_posts_status";
  DROP TYPE "public"."enum__posts_v_version_status";
  DROP TYPE "public"."enum_team_status";
  DROP TYPE "public"."enum__team_v_version_status";
  DROP TYPE "public"."enum_media_scope";
  DROP TYPE "public"."enum_home_status";
  DROP TYPE "public"."enum__home_v_version_status";
  DROP TYPE "public"."enum_team_page_status";
  DROP TYPE "public"."enum__team_page_v_version_status";
  DROP TYPE "public"."enum_contact_page_status";
  DROP TYPE "public"."enum__contact_page_v_version_status";
  DROP TYPE "public"."enum_terms_validation_status";
  DROP TYPE "public"."enum_terms_status";
  DROP TYPE "public"."enum__terms_v_version_validation_status";
  DROP TYPE "public"."enum__terms_v_version_status";
  DROP TYPE "public"."enum_legal_notice_validation_status";
  DROP TYPE "public"."enum_legal_notice_status";
  DROP TYPE "public"."enum__legal_notice_v_version_validation_status";
  DROP TYPE "public"."enum__legal_notice_v_version_status";`)
}
