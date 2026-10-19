-- Safely finalize a verified full Razorpay refund.
-- This function does NOT initiate a refund.
-- Call only after the webhook validates a refund.processed event.

CREATE OR REPLACE FUNCTION public.finalize_razorpay_full_refund(
    p_purchase_id uuid,
    p_provider_payment_id text,
    p_provider_refund_id text,
    p_refund_amount_paise bigint,
    p_currency text,
    p_refund_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_purchase public.purchases%ROWTYPE;
    v_reconciliation public.razorpay_payment_reconciliations%ROWTYPE;
    v_expected_amount_paise bigint;
    v_entitlement_count integer := 0;
BEGIN
    -- Validate required refund identity and amount.
    IF p_purchase_id IS NULL
       OR NULLIF(trim(p_provider_payment_id), '') IS NULL
       OR NULLIF(trim(p_provider_refund_id), '') IS NULL
       OR p_refund_amount_paise IS NULL
       OR p_refund_amount_paise <= 0
       OR p_currency IS DISTINCT FROM 'INR'
    THEN
        RAISE EXCEPTION 'Invalid refund details';
    END IF;

    -- Lock the purchase to prevent concurrent finalization.
    SELECT *
      INTO v_purchase
      FROM public.purchases
     WHERE id = p_purchase_id
     FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Purchase not found';
    END IF;

    -- Verify the purchase/payment identity.
    IF v_purchase.payment_provider IS DISTINCT FROM 'razorpay'
       OR v_purchase.provider_payment_id
            IS DISTINCT FROM p_provider_payment_id
    THEN
        RAISE EXCEPTION 'Purchase/payment identity mismatch';
    END IF;

    IF v_purchase.currency IS DISTINCT FROM 'INR' THEN
        RAISE EXCEPTION 'Purchase currency mismatch';
    END IF;

    v_expected_amount_paise :=
        round(v_purchase.amount * 100)::bigint;

    -- Only full refunds are automatically finalized.
    IF v_expected_amount_paise <= 0
       OR p_refund_amount_paise <> v_expected_amount_paise
    THEN
        RAISE EXCEPTION 'Partial or invalid refund requires manual review';
    END IF;

    -- Lock and verify the reconciliation record before handling
    -- an already-refunded purchase.
    SELECT *
      INTO v_reconciliation
      FROM public.razorpay_payment_reconciliations
     WHERE provider_payment_id = p_provider_payment_id
     FOR UPDATE;

    IF FOUND THEN
        IF v_reconciliation.purchase_id IS DISTINCT FROM p_purchase_id
           OR v_reconciliation.provider_order_id
                IS DISTINCT FROM v_purchase.provider_order_id
           OR v_reconciliation.amount_paise
                <> v_expected_amount_paise
           OR v_reconciliation.currency IS DISTINCT FROM 'INR'
        THEN
            RAISE EXCEPTION 'Reconciliation identity/amount mismatch';
        END IF;

        -- Never silently accept a different refund ID.
        IF v_reconciliation.provider_refund_id IS NOT NULL
           AND v_reconciliation.provider_refund_id
                IS DISTINCT FROM p_provider_refund_id
        THEN
            RAISE EXCEPTION 'Conflicting refund ID; manual review required';
        END IF;

        -- An already-refunded purchase is idempotent only when
        -- its reconciliation confirms the same refund.
        IF v_purchase.status = 'REFUNDED' THEN
            IF v_reconciliation.status = 'REFUNDED'
               AND v_reconciliation.provider_refund_id
                    = p_provider_refund_id
            THEN
                RETURN jsonb_build_object(
                    'success', true,
                    'already_refunded', true,
                    'purchase_id', p_purchase_id,
                    'refund_id', p_provider_refund_id
                );
            END IF;

            RAISE EXCEPTION
                'Purchase is refunded but reconciliation does not confirm this refund';
        END IF;

        -- Do not automatically finalize records explicitly flagged
        -- for manual review.
        IF v_reconciliation.status = 'REVIEW_REQUIRED' THEN
            RAISE EXCEPTION 'Reconciliation requires manual review';
        END IF;

        IF v_reconciliation.status NOT IN (
            'REFUND_REQUIRED',
            'REFUND_PENDING',
            'REFUND_FAILED'
        ) THEN
            RAISE EXCEPTION
                'Reconciliation status is not eligible for finalization';
        END IF;

    ELSIF v_purchase.status = 'REFUNDED' THEN
        -- Do not treat a purchase as safely refunded when its
        -- reconciliation record is missing.
        RAISE EXCEPTION
            'Refunded purchase has no reconciliation record; manual review required';
    END IF;

    IF v_purchase.status NOT IN ('PAID', 'CANCELLED', 'REFUNDED') THEN
        RAISE EXCEPTION 'Purchase status is not eligible for refund finalization';
    END IF;

    -- Record the verified refund. All changes below are part of
    -- the same PostgreSQL transaction.
    IF v_reconciliation.id IS NOT NULL THEN
        UPDATE public.razorpay_payment_reconciliations
           SET status = 'REFUNDED',
               provider_refund_id = p_provider_refund_id,
               refund_payload = COALESCE(p_refund_payload, '{}'::jsonb),
               refund_error = NULL,
               refunded_at = COALESCE(refunded_at, now()),
               updated_at = now()
         WHERE id = v_reconciliation.id;
    ELSE
        INSERT INTO public.razorpay_payment_reconciliations (
            purchase_id,
            provider_order_id,
            provider_payment_id,
            amount_paise,
            currency,
            reason,
            status,
            provider_refund_id,
            refund_idempotency_key,
            payment_payload,
            refund_payload,
            refunded_at
        )
        VALUES (
            v_purchase.id,
            v_purchase.provider_order_id,
            p_provider_payment_id,
            v_expected_amount_paise,
            'INR',
            'FULL_REFUND_FOR_PURCHASE',
            'REFUNDED',
            p_provider_refund_id,
            'sanidhyashala-refund-' || p_provider_payment_id,
            '{}'::jsonb,
            COALESCE(p_refund_payload, '{}'::jsonb),
            now()
        );
    END IF;

    -- Revoke only active entitlements originating from this purchase.
    IF v_purchase.product_id IS NOT NULL THEN
        UPDATE public.learning_product_entitlements
           SET status = 'REVOKED',
               updated_at = now()
         WHERE source_reference = v_purchase.id::text
           AND status = 'ACTIVE';

        GET DIAGNOSTICS v_entitlement_count = ROW_COUNT;
    END IF;

    -- Flag a paid purchase for review if its expected entitlement
    -- could not be found and revoked.
    UPDATE public.purchases
       SET status = 'REFUNDED',
           fulfillment_status = CASE
               WHEN v_purchase.product_id IS NOT NULL
                    AND v_entitlement_count = 0
                    AND v_purchase.status = 'PAID'
               THEN 'REVIEW_REQUIRED'
               ELSE fulfillment_status
           END,
           updated_at = now()
     WHERE id = p_purchase_id;

    RETURN jsonb_build_object(
        'success', true,
        'purchase_id', p_purchase_id,
        'refund_id', p_provider_refund_id,
        'entitlements_revoked', v_entitlement_count
    );
END;
$$;

-- Restrict execution to the trusted server-side service role.
REVOKE ALL ON FUNCTION public.finalize_razorpay_full_refund(
    uuid, text, text, bigint, text, jsonb
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.finalize_razorpay_full_refund(
    uuid, text, text, bigint, text, jsonb
) TO service_role;