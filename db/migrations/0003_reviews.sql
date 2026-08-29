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

-- A frozen Review is immutable. The only permitted update is the one-way
-- invalidation stamp written when the applicant returns to Draft.
CREATE FUNCTION reviews_reject_mutation() RETURNS trigger AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.short_id IS DISTINCT FROM OLD.short_id
     OR NEW.application_id IS DISTINCT FROM OLD.application_id
     OR NEW.source_application_revision IS DISTINCT FROM OLD.source_application_revision
     OR NEW.source_requirements_version IS DISTINCT FROM OLD.source_requirements_version
     OR NEW.content_hash IS DISTINCT FROM OLD.content_hash
     OR NEW.review_snapshot IS DISTINCT FROM OLD.review_snapshot
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'A frozen Review cannot be modified.';
  END IF;
  IF OLD.invalidated_at IS NOT NULL AND NEW.invalidated_at IS DISTINCT FROM OLD.invalidated_at THEN
    RAISE EXCEPTION 'A Review invalidation cannot be changed.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reviews_immutable
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION reviews_reject_mutation();
