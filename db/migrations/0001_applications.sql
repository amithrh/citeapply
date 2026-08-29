-- CiteApply product table 1/5: authoritative synthetic application state.
CREATE TABLE applications (
  id uuid PRIMARY KEY,
  start_nonce_hash bytea NOT NULL UNIQUE,
  start_request_id uuid NOT NULL UNIQUE,
  start_request_digest bytea NOT NULL,
  session_digest bytea NOT NULL UNIQUE,
  created_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  packet_code text NOT NULL,
  parsed_packet jsonb NOT NULL,
  draft jsonb NOT NULL,
  stage text NOT NULL DEFAULT 'draft',
  revision bigint NOT NULL DEFAULT 0,
  requirements_version bigint NOT NULL DEFAULT 1,
  page_epoch bigint NOT NULL DEFAULT 0,
  page_bootstrap_request_id uuid,
  page_bootstrap_request_digest bytea,
  consent_request_id uuid,
  current_review_id uuid,
  updated_at timestamptz NOT NULL,

  CONSTRAINT applications_start_nonce_hash_size
    CHECK (octet_length(start_nonce_hash) = 32),
  CONSTRAINT applications_start_request_digest_size
    CHECK (octet_length(start_request_digest) = 32),
  CONSTRAINT applications_session_digest_size
    CHECK (octet_length(session_digest) = 32),
  CONSTRAINT applications_exact_session_lifetime
    CHECK (expires_at = created_at + interval '60 minutes'),
  CONSTRAINT applications_packet_code
    CHECK (packet_code IN ('supported', 'conflict')),
  CONSTRAINT applications_parsed_packet_object
    CHECK (jsonb_typeof(parsed_packet) = 'object'),
  CONSTRAINT applications_parsed_packet_size
    CHECK (octet_length(parsed_packet::text) <= 32768),
  CONSTRAINT applications_draft_object
    CHECK (jsonb_typeof(draft) = 'object'),
  CONSTRAINT applications_draft_size
    CHECK (octet_length(draft::text) <= 24576),
  CONSTRAINT applications_stage
    CHECK (stage IN ('draft', 'review', 'submitted')),
  CONSTRAINT applications_revision_nonnegative
    CHECK (revision >= 0),
  CONSTRAINT applications_requirements_version_positive
    CHECK (requirements_version >= 1),
  CONSTRAINT applications_page_epoch_nonnegative
    CHECK (page_epoch >= 0),
  CONSTRAINT applications_page_replay_coordinate_complete
    CHECK (
      (page_bootstrap_request_id IS NULL AND page_bootstrap_request_digest IS NULL)
      OR
      (
        page_bootstrap_request_id IS NOT NULL
        AND page_bootstrap_request_digest IS NOT NULL
        AND octet_length(page_bootstrap_request_digest) = 32
      )
    ),
  CONSTRAINT applications_consent_only_in_draft
    CHECK (stage = 'draft' OR consent_request_id IS NULL),
  CONSTRAINT applications_review_link_matches_stage
    CHECK (
      (stage = 'draft' AND current_review_id IS NULL)
      OR
      (stage IN ('review', 'submitted') AND current_review_id IS NOT NULL)
    ),
  CONSTRAINT applications_updated_after_creation
    CHECK (updated_at >= created_at)
);

CREATE INDEX applications_expired_cleanup_idx
  ON applications (expires_at, created_at, id);
