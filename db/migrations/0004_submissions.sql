-- CiteApply product table 4/5: one accepted submission and canonical Receipt.
CREATE TABLE submissions (
  id uuid PRIMARY KEY,
  application_id uuid NOT NULL UNIQUE,
  review_id uuid NOT NULL UNIQUE,
  receipt_id uuid NOT NULL UNIQUE,
  accepted_application_revision bigint NOT NULL,
  receipt_record jsonb NOT NULL,
  submitted_at timestamptz NOT NULL,

  CONSTRAINT submissions_application_fk
    FOREIGN KEY (application_id) REFERENCES applications (id) ON DELETE CASCADE,
  CONSTRAINT submissions_review_application_fk
    FOREIGN KEY (review_id, application_id)
    REFERENCES reviews (id, application_id) ON DELETE CASCADE,
  CONSTRAINT submissions_accepted_revision_nonnegative
    CHECK (accepted_application_revision >= 0),
  CONSTRAINT submissions_receipt_object
    CHECK (jsonb_typeof(receipt_record) = 'object'),
  CONSTRAINT submissions_receipt_schema
    CHECK (
      receipt_record ? 'schema'
      AND receipt_record ->> 'schema' = 'citeapply-receipt-v1'
    ),
  CONSTRAINT submissions_receipt_size
    CHECK (octet_length(receipt_record::text) <= 49152)
);
