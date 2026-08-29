-- CiteApply product table 2/5: bounded idempotency and safe activity coordinates.
CREATE TABLE operations (
  application_id uuid NOT NULL,
  request_id uuid NOT NULL,
  action text NOT NULL,
  keyed_intent_digest bytea NOT NULL,
  outcome jsonb NOT NULL,
  created_at timestamptz NOT NULL,

  CONSTRAINT operations_pk PRIMARY KEY (application_id, request_id),
  CONSTRAINT operations_application_fk
    FOREIGN KEY (application_id) REFERENCES applications (id) ON DELETE CASCADE,
  CONSTRAINT operations_action_closed
    CHECK (action IN (
      'bind_evidence',
      'clear_evidence',
      'clear_dependency',
      'save_email',
      'declare_email',
      'resolve_income',
      'clear_income_resolution',
      'allow_assisted_access',
      'revoke_assisted_access',
      'prepare_review',
      'return_to_draft',
      'apply_evidence_answers',
      'prepare_submission_review',
      'submit'
    )),
  CONSTRAINT operations_keyed_intent_digest_size
    CHECK (octet_length(keyed_intent_digest) = 32),
  CONSTRAINT operations_outcome_object
    CHECK (jsonb_typeof(outcome) = 'object'),
  CONSTRAINT operations_outcome_size
    CHECK (octet_length(outcome::text) <= 8192)
);

CREATE INDEX operations_activity_order_idx
  ON operations (application_id, created_at, request_id);
