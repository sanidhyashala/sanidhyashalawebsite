
CREATE TABLE IF NOT EXISTS public.razorpay_payment_reconciliations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    purchase_id uuid NOT NULL
        REFERENCES public.purchases(id) ON DELETE RESTRICT,

    provider_order_id text NOT NULL,
    provider_payment_id text NOT NULL UNIQUE,

    amount_paise bigint NOT NULL
        CHECK (amount_paise > 0),

    currency text NOT NULL
        CHECK (currency = 'INR'),

    reason text NOT NULL
        DEFAULT 'PAYMENT_CAPTURED_FOR_CANCELLED_PURCHASE',

    status text NOT NULL
        DEFAULT 'REFUND_REQUIRED'
        CHECK (
            status IN (
                'REFUND_REQUIRED',
                'REFUND_PENDING',
                'REFUNDED',
                'REFUND_FAILED',
                'REVIEW_REQUIRED'
            )
        ),

    provider_refund_id text UNIQUE,
    refund_idempotency_key text NOT NULL UNIQUE,
    refund_error text,

    payment_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    refund_payload jsonb NOT NULL DEFAULT '{}'::jsonb,

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    refunded_at timestamptz
);

CREATE INDEX IF NOT EXISTS
    idx_razorpay_reconciliations_purchase_id
ON public.razorpay_payment_reconciliations (purchase_id);

CREATE INDEX IF NOT EXISTS
    idx_razorpay_reconciliations_refund_status
ON public.razorpay_payment_reconciliations (status);
