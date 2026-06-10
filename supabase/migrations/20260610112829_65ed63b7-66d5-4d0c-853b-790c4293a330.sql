
-- Frameworks
ALTER TABLE public.audit_frameworks
  ADD COLUMN IF NOT EXISTS criteria jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS zero_tolerance text,
  ADD COLUMN IF NOT EXISTS kind text;

-- Audits
ALTER TABLE public.audits
  ADD COLUMN IF NOT EXISTS ai_result jsonb,
  ADD COLUMN IF NOT EXISTS guidance text,
  ADD COLUMN IF NOT EXISTS locked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS edited_by_expert boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS challenge_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS re_edit_allowed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS call_transcript_id uuid REFERENCES public.call_transcripts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS zero_tolerance_hit boolean NOT NULL DEFAULT false;

-- Audit scores
ALTER TABLE public.audit_scores
  ADD COLUMN IF NOT EXISTS criterion_no integer,
  ADD COLUMN IF NOT EXISTS expert_note text,
  ADD COLUMN IF NOT EXISTS reasoning text,
  ADD COLUMN IF NOT EXISTS evidence_quote text;

-- Allow experts to insert audits they create themselves (for AI auto-save flow)
DROP POLICY IF EXISTS "audits_expert_insert" ON public.audits;
CREATE POLICY "audits_expert_insert" ON public.audits
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (
      expert_id IS NULL
      OR EXISTS (SELECT 1 FROM public.experts e WHERE e.id = audits.expert_id AND e.profile_id = auth.uid())
    )
  );

-- Allow expert to insert their own audit_scores rows for audits they own
DROP POLICY IF EXISTS "audit_scores_expert_insert" ON public.audit_scores;
CREATE POLICY "audit_scores_expert_insert" ON public.audit_scores
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.audits a
      WHERE a.id = audit_scores.audit_id
        AND (a.created_by = auth.uid()
             OR EXISTS (SELECT 1 FROM public.experts e WHERE e.id = a.expert_id AND e.profile_id = auth.uid()))
    )
  );

-- Seed NHS frameworks (delete prior seeded ones with same names then re-insert for idempotency)
DELETE FROM public.audit_frameworks WHERE name IN ('NHS Call Audit', 'NHS Chat Audit');

INSERT INTO public.audit_frameworks (name, description, total_max_score, kind, zero_tolerance, criteria) VALUES
('NHS Call Audit',
 'NHS coaching call audit framework. 15 parameters scored 0/1/2.',
 30,
 'call',
 'Pitching irrelevant programs, making false medical/health claims, or guaranteeing cures.',
 '[
   {"no":1,"name":"Opening & Greeting","max":2,"guidance":"Warm, professional opening. Coach greets the player by name and introduces themselves and NHS."},
   {"no":2,"name":"Verification of Identity","max":2,"guidance":"Coach verifies player identity (name/DOB/registered details) before sharing health info."},
   {"no":3,"name":"Purpose of Call","max":2,"guidance":"Coach clearly states the purpose of the call up-front."},
   {"no":4,"name":"Active Listening","max":2,"guidance":"Coach listens without interrupting, paraphrases, and acknowledges what the player shares."},
   {"no":5,"name":"Empathy & Tone","max":2,"guidance":"Empathetic, non-judgmental tone. Validates feelings and concerns."},
   {"no":6,"name":"Probing & Needs Assessment","max":2,"guidance":"Asks open-ended questions to understand the player''s health goals, history, and barriers."},
   {"no":7,"name":"Program & Product Knowledge","max":2,"guidance":"Demonstrates accurate knowledge of NHS programs, services, and processes."},
   {"no":8,"name":"Relevant Recommendation","max":2,"guidance":"Recommends programs/actions relevant to the player''s assessed needs. No irrelevant pitching."},
   {"no":9,"name":"Clarity of Communication","max":2,"guidance":"Speaks clearly, avoids jargon, checks understanding."},
   {"no":10,"name":"Objection Handling","max":2,"guidance":"Addresses player concerns or objections with patience and accurate information."},
   {"no":11,"name":"Personalization","max":2,"guidance":"Tailors the conversation to the player''s context, history, and preferences."},
   {"no":12,"name":"Compliance & Accuracy","max":2,"guidance":"No false promises, no medical diagnosis beyond scope, follows NHS guidelines."},
   {"no":13,"name":"Action Plan / Next Steps","max":2,"guidance":"Sets a clear action plan and next steps with the player."},
   {"no":14,"name":"Summarization & Confirmation","max":2,"guidance":"Summarizes key points and confirms player agreement before closing."},
   {"no":15,"name":"Closing","max":2,"guidance":"Professional close, thanks the player, confirms follow-up channel."}
 ]'::jsonb
),
('NHS Chat Audit',
 'NHS coaching chat audit framework. Parameters scored 0/1/2.',
 24,
 'chat',
 'Pitching irrelevant programs, false medical claims, or sharing sensitive info without verification.',
 '[
   {"no":1,"name":"Greeting & Acknowledgement","max":2,"guidance":"Warm, prompt greeting acknowledging the player by name."},
   {"no":2,"name":"Response Time","max":2,"guidance":"Timely first response and consistent reply cadence."},
   {"no":3,"name":"Grammar & Spelling","max":2,"guidance":"Correct grammar, spelling, punctuation. Professional written tone."},
   {"no":4,"name":"Empathy & Tone","max":2,"guidance":"Warm, empathetic, non-judgmental written tone."},
   {"no":5,"name":"Understanding the Query","max":2,"guidance":"Demonstrates clear understanding of what the player is asking."},
   {"no":6,"name":"Probing","max":2,"guidance":"Asks clarifying questions when the query is incomplete or ambiguous."},
   {"no":7,"name":"Accurate Information","max":2,"guidance":"Shares accurate, NHS-aligned information. No misinformation."},
   {"no":8,"name":"Personalization","max":2,"guidance":"Tailors responses to the player''s context and history."},
   {"no":9,"name":"Relevant Recommendation","max":2,"guidance":"Recommends only programs/actions relevant to the query."},
   {"no":10,"name":"Compliance","max":2,"guidance":"No false promises, no out-of-scope medical advice."},
   {"no":11,"name":"Summary & Next Steps","max":2,"guidance":"Summarizes resolution and provides clear next steps."},
   {"no":12,"name":"Closing","max":2,"guidance":"Polite, professional closure inviting further questions."}
 ]'::jsonb
);
