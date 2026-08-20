import { NextResponse } from 'next/server';
import { createClient } from '@/src/infrastructure/db/server/supabase';
import { hashContent, isAuthFailure, requireWorkspaceAccess } from '@/src/infrastructure/db/server/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: runId } = await params;
    const supabase = await createClient();
    const auth = await requireWorkspaceAccess(supabase, ['owner', 'editor']);

    if (isAuthFailure(auth)) {
      return auth.response;
    }

    if (!runId) {
      return NextResponse.json({ error: 'Missing run ID' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const expectedVersion = body.expectedVersion ?? body.version;
    const expectedContentHash = body.contentHash ?? body.expectedContentHash;

    if (expectedVersion === undefined && expectedContentHash === undefined) {
      return NextResponse.json(
        { error: 'Approval requires expectedVersion or contentHash' },
        { status: 400 }
      );
    }

    const { data: run, error: runError } = await supabase
      .from('workflow_runs')
      .select('id,workspace_id,status')
      .eq('id', runId)
      .eq('workspace_id', auth.workspaceId)
      .single();

    if (runError || !run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    const { data: artifact, error: artifactError } = await supabase
      .from('content_artifacts')
      .select('id,workspace_id,workflow_run_id,current_version,content')
      .eq('workspace_id', auth.workspaceId)
      .eq('workflow_run_id', runId)
      .order('current_version', { ascending: false })
      .limit(1)
      .single();

    if (artifactError || !artifact) {
      return NextResponse.json({ error: 'Artifact not found' }, { status: 404 });
    }

    const { data: draftVersion } = await supabase
      .from('draft_versions')
      .select('id,version,content_hash')
      .eq('workspace_id', auth.workspaceId)
      .eq('artifact_id', artifact.id)
      .eq('version', artifact.current_version)
      .maybeSingle();

    const currentVersion = draftVersion?.version ?? artifact.current_version;
    const currentContentHash = draftVersion?.content_hash ?? hashContent(artifact.content);

    if (expectedVersion !== undefined && Number(expectedVersion) !== currentVersion) {
      return NextResponse.json({ error: 'Draft version is stale' }, { status: 409 });
    }

    if (expectedContentHash !== undefined && expectedContentHash !== currentContentHash) {
      return NextResponse.json({ error: 'Draft content is stale' }, { status: 409 });
    }

    if (!draftVersion) {
      return NextResponse.json({ error: 'Draft version is required for approval' }, { status: 409 });
    }

    const { error: approvalError } = await supabase
      .from('human_approvals')
      .insert({
        workspace_id: auth.workspaceId,
        workflow_run_id: runId,
        draft_version_id: draftVersion.id,
        draft_version: currentVersion,
        actor_id: auth.appUser.id,
        decision: 'approve'
      });

    if (approvalError) {
      console.error('Error recording approval:', approvalError);
      return NextResponse.json({ error: 'Failed to record approval' }, { status: 500 });
    }

    // Update the run status to APPROVED
    const { error: updateError } = await supabase
      .from('workflow_runs')
      .update({ status: 'APPROVED' })
      .eq('id', runId)
      .eq('workspace_id', auth.workspaceId);

    if (updateError) {
      console.error('Error approving run:', updateError);
      return NextResponse.json({ error: 'Failed to approve run' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        runId,
        version: currentVersion,
        contentHash: currentContentHash
      }
    });

  } catch (error) {
    console.error('Error approving draft:', error);
    return NextResponse.json(
      { error: 'Failed to approve draft' },
      { status: 500 }
    );
  }
}
