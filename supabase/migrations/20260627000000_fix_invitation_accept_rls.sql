-- Fix invitation accept RLS: exporters now need WITH CHECK (status='accepted') to transition
DROP POLICY IF EXISTS "exporters accept invitations" ON public.invitations;

CREATE POLICY "exporters accept invitations"
  ON public.invitations FOR UPDATE
  USING (
    lower(email) = public.auth_user_email()
    AND status = 'pending'
  )
  WITH CHECK (
    lower(email) = public.auth_user_email()
    AND status = 'accepted'
  );

-- Fix exporter submit on shipment_requests: add WITH CHECK so pending_exporter→submitted works
DROP POLICY IF EXISTS "exporters update shipment_requests" ON public.shipment_requests;

CREATE POLICY "exporters update shipment_requests"
  ON public.shipment_requests FOR UPDATE
  USING (
    exporter_org_id IN (SELECT public.user_exporter_org_ids())
    OR (
      lower(exporter_email) = public.auth_user_email()
      AND status IN ('pending_exporter', 'submitted')
    )
  )
  WITH CHECK (
    exporter_org_id IN (SELECT public.user_exporter_org_ids())
    OR lower(exporter_email) = public.auth_user_email()
  );
