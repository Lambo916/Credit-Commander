-- Enable Row Level Security (RLS)
ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;

-- Clean existing policies
DROP POLICY IF EXISTS "Users can view their own reports" ON compliance_reports;
DROP POLICY IF EXISTS "Users can create their own reports" ON compliance_reports;
DROP POLICY IF EXISTS "Users can update their own reports" ON compliance_reports;
DROP POLICY IF EXISTS "Users can delete their own reports" ON compliance_reports;
DROP POLICY IF EXISTS "Legacy ownerId access" ON compliance_reports;

-- Policy 1: View
CREATE POLICY "Users can view their own reports"
ON compliance_reports
FOR SELECT
TO authenticated
USING (
  user_id = NULLIF(auth.uid()::text, '')::uuid
);

-- Policy 2: Create
CREATE POLICY "Users can create their own reports"
ON compliance_reports
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = NULLIF(auth.uid()::text, '')::uuid
);

-- Policy 3: Update
CREATE POLICY "Users can update their own reports"
ON compliance_reports
FOR UPDATE
TO authenticated
USING (
  user_id = NULLIF(auth.uid()::text, '')::uuid
)
WITH CHECK (
  user_id = NULLIF(auth.uid()::text, '')::uuid
);

-- Policy 4: Delete
CREATE POLICY "Users can delete their own reports"
ON compliance_reports
FOR DELETE
TO authenticated
USING (
  user_id = NULLIF(auth.uid()::text, '')::uuid
);

-- Revoke all existing grants to ensure clean slate
REVOKE ALL ON compliance_reports FROM anon;
REVOKE ALL ON compliance_reports FROM authenticated;
REVOKE ALL ON compliance_reports FROM public;

-- Grant minimal necessary permissions to authenticated users only
GRANT SELECT, INSERT, UPDATE, DELETE ON compliance_reports TO authenticated;

-- Verification queries
-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'compliance_reports';

-- Test query: should only show reports for the current authenticated user
SELECT id, name, entity_name, user_id, created_at 
FROM compliance_reports 
LIMIT 5;
