CREATE TABLE IF NOT EXISTS data (
    -- customer uuid NOT NULL DEFAULT gen_random_uuid (),
    "customer" integer NOT NULL,
    -- created_at timestamptz NOT NULL DEFAULT now(),
    "date" date NOT NULL,
    "order_id" serial,
    "item_id" integer,
    "data" json,
    PRIMARY KEY ("customer", "date", "order_id", "item_id")
);

