-- Align new Launch Trial venue applications with the advertised 7-day trial.
-- Existing venue expiry dates are intentionally preserved.
CREATE OR REPLACE FUNCTION public.smv_set_trial_dates()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
BEGIN
  IF NEW.partner_plan = 'launch_trial'
     AND COALESCE(NEW.plan_status, 'trialing') = 'trialing' THEN
    IF NEW.plan_started_at IS NULL THEN
      NEW.plan_started_at := now();
    END IF;
    IF NEW.plan_expires_at IS NULL THEN
      NEW.plan_expires_at := NEW.plan_started_at + interval '7 days';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
