-- CiteApply product table 3/5: immutable Review snapshots and invalidation time.
CREATE TABLE reviews (
  id uuid PRIMARY KEY,
  short_id text NOT NULL UNIQUE,
  application_id uuid NOT NULL,
  source_application_revision bigint NOT NULL,
  source_requirements_version bigint NOT NULL,
  content_hash bytea NOT NULL,
  review_snapshot jsonb NOT NULL,
  created_at timestamptz NOT NULL,
  invalidated_at timestamptz,

  CONSTRAINT reviews_application_fk
    FOREIGN KEY (application_id) REFERENCES applications (id) ON DELETE CASCADE,
  CONSTRAINT reviews_id_application_unique UNIQUE (id, application_id),
  CONSTRAINT reviews_short_id_format
    CHECK (short_id ~ '^[0-9A-HJKMNP-TV-Z]{10}$'),
  CONSTRAINT reviews_source_application_revision_nonnegative
    CHECK (source_application_revision >= 0),
  CONSTRAINT reviews_source_requirements_version_positive
    CHECK (source_requirements_version >= 1),
  CONSTRAINT reviews_content_hash_size
    CHECK (octet_length(content_hash) = 32),
  CONSTRAINT reviews_snapshot_object
    CHECK (jsonb_typeof(review_snapshot) = 'object'),
  CONSTRAINT reviews_snapshot_size
    CHECK (octet_length(review_snapshot::text) <= 49152),
  CONSTRAINT reviews_invalidation_order
    CHECK (invalidated_at IS NULL OR invalidated_at >= created_at)
);

CREATE UNIQUE INDEX reviews_one_current_per_application_idx
  ON reviews (application_id)
  WHERE invalidated_at IS NULL;

CREATE INDEX reviews_application_history_idx
  ON reviews (application_id, created_at, id);
