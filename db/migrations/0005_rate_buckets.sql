-- CiteApply product table 5/5: fixed public counters and two timeless mutex rows.
CREATE TABLE rate_buckets (
  family text NOT NULL,
  bucket_key text NOT NULL,
  window_start timestamptz NOT NULL,
  request_count integer NOT NULL,
  expires_at timestamptz NOT NULL,

  CONSTRAINT rate_buckets_pk PRIMARY KEY (family, bucket_key, window_start),
  CONSTRAINT rate_buckets_family CHECK (family IN ('counter', 'sentinel')),
  CONSTRAINT rate_buckets_key_closed CHECK (
    (family = 'sentinel' AND bucket_key IN ('rate_capacity_mutex', 'start_parser_mutex'))
    OR
    (family = 'counter' AND bucket_key IN (
      'demo_get',
      'demo_start',
      'application',
      'actions',
      'webmcp',
      'submission',
      'receipt',
      'all_api'
    ))
  ),
  CONSTRAINT rate_buckets_count_range CHECK (request_count BETWEEN 0 AND 600),
  CONSTRAINT rate_buckets_sentinel_shape CHECK (
    family <> 'sentinel'
    OR (window_start = 'epoch'::timestamptz AND expires_at = 'infinity'::timestamptz AND request_count = 0)
  ),
  CONSTRAINT rate_buckets_counter_shape CHECK (
    family <> 'counter'
    OR (expires_at > window_start AND expires_at <> 'infinity'::timestamptz)
  )
);

INSERT INTO rate_buckets (family, bucket_key, window_start, request_count, expires_at)
VALUES
  ('sentinel', 'rate_capacity_mutex', 'epoch', 0, 'infinity'),
  ('sentinel', 'start_parser_mutex', 'epoch', 0, 'infinity');

DO $$
BEGIN
  IF (
    SELECT count(*)
    FROM rate_buckets
    WHERE family = 'sentinel'
      AND bucket_key IN ('rate_capacity_mutex', 'start_parser_mutex')
  ) <> 2 THEN
    RAISE EXCEPTION 'CiteApply rate sentinels were not created exactly once';
  END IF;
END
$$;

CREATE INDEX rate_buckets_expiry_idx
  ON rate_buckets (expires_at, family, bucket_key, window_start)
  WHERE family = 'counter';
