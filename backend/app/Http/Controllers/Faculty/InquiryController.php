<?php

namespace App\Http\Controllers\Faculty;

use App\Http\Controllers\Controller;
use App\Models\ChainStep;
use App\Models\Inquiry;
use App\Models\InquiryComment;
use App\Models\InquiryStepHistory;
use App\Models\User;
use App\Services\SupabaseStorage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InquiryController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Inquiry::with(['student', 'subject', 'currentStep.role']);

        // Superuser gets full oversight (every inquiry, any status). Faculty
        // only ever see inquiries whose chain includes their role at all --
        // otherwise sliced into three queues, since "assigned" alone used to
        // mean an inquiry vanished from faculty view the moment they acted on
        // it, with no way back to something they were previously involved in.
        if ($user->user_type !== 'superuser') {
            $data = $request->validate(['queue' => 'nullable|in:assigned,watching,completed']);
            $queue = $data['queue'] ?? 'assigned';

            $query->whereHas('chain.steps', fn ($q) => $q->where('role_id', $user->role_id));

            match ($queue) {
                'completed' => $query->where('status', 'completed'),
                'watching' => $query->where('status', 'in_progress')
                    ->whereHas('currentStep', fn ($q) => $q->where('role_id', '!=', $user->role_id)),
                default => $query->where('status', 'in_progress')
                    ->whereHas('currentStep', fn ($q) => $q->where('role_id', $user->role_id)),
            };
        }

        $inquiries = $query->orderBy('created_at')->get();

        return response()->json(['status' => 'ok', 'inquiries' => $inquiries]);
    }

    public function show(Request $request, Inquiry $inquiry)
    {
        if (! $this->hasVisibility($inquiry, $request->user())) {
            return response()->json(['status' => 'error', 'message' => 'Forbidden.'], 403);
        }

        $inquiry->load([
            'student',
            'subject',
            'chain',
            'currentStep.role',
            'comments.author',
            'documents.uploader',
            'stepHistory.actor',
            'stepHistory.chainStep.role',
        ]);

        $user = $request->user();

        return response()->json([
            'status' => 'ok',
            'inquiry' => $inquiry,
            'can' => [
                'approve' => $this->canActOnCurrentStep($inquiry, $user, 'inquiry.approve'),
                'resolve' => $this->canActOnCurrentStep($inquiry, $user, 'inquiry.resolve'),
                'reset' => $this->canReset($inquiry, $user),
                'comment' => $this->hasPermission($user, 'inquiry.comment'),
            ],
        ]);
    }

    public function approve(Request $request, Inquiry $inquiry)
    {
        if (! $this->canActOnCurrentStep($inquiry, $request->user(), 'inquiry.approve')) {
            return response()->json(['status' => 'error', 'message' => 'Forbidden.'], 403);
        }

        $data = $request->validate(['note' => 'nullable|string']);

        DB::transaction(function () use ($request, $inquiry, $data) {
            $currentStep = $inquiry->currentStep;
            $nextStep = ChainStep::where('chain_id', $inquiry->chain_id)
                ->where('step_order', $currentStep->step_order + 1)
                ->first();

            $inquiry->update([
                'current_chain_step_id' => $nextStep?->id,
                'status' => $nextStep ? 'in_progress' : 'completed',
            ]);

            InquiryStepHistory::create([
                'inquiry_id' => $inquiry->id,
                'chain_step_id' => $currentStep->id,
                'cycle_number' => $inquiry->cycle_number,
                'action' => 'approve',
                'actor_id' => $request->user()->id,
                'note' => $data['note'] ?? null,
            ]);
        });

        $inquiry->refresh()->load(['currentStep.role']);

        return response()->json(['status' => 'ok', 'inquiry' => $inquiry]);
    }

    public function resolve(Request $request, Inquiry $inquiry)
    {
        if (! $this->canActOnCurrentStep($inquiry, $request->user(), 'inquiry.resolve')) {
            return response()->json(['status' => 'error', 'message' => 'Forbidden.'], 403);
        }

        $data = $request->validate(['note' => 'nullable|string']);

        DB::transaction(function () use ($request, $inquiry, $data) {
            $currentStep = $inquiry->currentStep;

            $inquiry->update([
                'current_chain_step_id' => null,
                'status' => 'completed',
            ]);

            InquiryStepHistory::create([
                'inquiry_id' => $inquiry->id,
                'chain_step_id' => $currentStep->id,
                'cycle_number' => $inquiry->cycle_number,
                'action' => 'resolve',
                'actor_id' => $request->user()->id,
                'note' => $data['note'] ?? null,
            ]);
        });

        $inquiry->refresh();

        return response()->json(['status' => 'ok', 'inquiry' => $inquiry]);
    }

    public function reset(Request $request, Inquiry $inquiry)
    {
        if (! $this->canReset($inquiry, $request->user())) {
            return response()->json(['status' => 'error', 'message' => 'Forbidden.'], 403);
        }

        $data = $request->validate(['note' => 'nullable|string']);

        DB::transaction(function () use ($request, $inquiry, $data) {
            $currentStep = $inquiry->currentStep;
            $firstStep = ChainStep::where('chain_id', $inquiry->chain_id)
                ->orderBy('step_order')
                ->first();

            InquiryStepHistory::create([
                'inquiry_id' => $inquiry->id,
                'chain_step_id' => $currentStep->id,
                'cycle_number' => $inquiry->cycle_number,
                'action' => 'reset',
                'actor_id' => $request->user()->id,
                'note' => $data['note'] ?? null,
            ]);

            $inquiry->update([
                'current_chain_step_id' => $firstStep->id,
                'cycle_number' => $inquiry->cycle_number + 1,
                'status' => 'in_progress',
            ]);
        });

        $inquiry->refresh()->load(['currentStep.role']);

        return response()->json(['status' => 'ok', 'inquiry' => $inquiry]);
    }

    public function comment(Request $request, Inquiry $inquiry)
    {
        if (! $this->hasVisibility($inquiry, $request->user()) || ! $this->hasPermission($request->user(), 'inquiry.comment')) {
            return response()->json(['status' => 'error', 'message' => 'Forbidden.'], 403);
        }

        $data = $request->validate(['body' => 'required|string']);

        $comment = $inquiry->comments()->create([
            'author_id' => $request->user()->id,
            'body' => $data['body'],
        ]);

        $comment->load('author');

        return response()->json(['status' => 'ok', 'comment' => $comment], 201);
    }

    public function uploadDocument(Request $request, Inquiry $inquiry, SupabaseStorage $storage)
    {
        if (! $this->hasVisibility($inquiry, $request->user()) || ! $this->hasPermission($request->user(), 'inquiry.comment')) {
            return response()->json(['status' => 'error', 'message' => 'Forbidden.'], 403);
        }

        $data = $request->validate([
            'file' => 'required|file|max:10240|mimes:pdf,doc,docx,xls,xlsx,txt,jpg,jpeg,png,gif,webp',
            'comment_id' => 'nullable|integer|exists:inquiry_comments,id',
        ]);

        if (isset($data['comment_id'])) {
            $comment = InquiryComment::find($data['comment_id']);

            if ($comment->inquiry_id !== $inquiry->id || $comment->author_id !== $request->user()->id) {
                return response()->json(['status' => 'error', 'message' => 'You can only attach documents to your own comment.'], 422);
            }
        }

        $file = $data['file'];
        $storagePath = "inquiries/{$inquiry->id}/".Str::uuid().'.'.$file->getClientOriginalExtension();

        $storage->upload($storagePath, $file->get(), $file->getMimeType());

        $document = $inquiry->documents()->create([
            'comment_id' => $data['comment_id'] ?? null,
            'uploaded_by' => $request->user()->id,
            'storage_path' => $storagePath,
            'file_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
        ]);

        $document->load('uploader');

        return response()->json(['status' => 'ok', 'document' => $document], 201);
    }

    /**
     * Visible if this role appears anywhere in the inquiry's chain -- current
     * step, a past step, or a step not reached yet -- matching the "assigned
     * / watching / completed" queues in index(). Being in the chain at all is
     * what matters, not whether this role has acted (or ever will act) yet.
     * Superuser has unrestricted oversight of every inquiry.
     */
    private function hasVisibility(Inquiry $inquiry, User $user): bool
    {
        if ($user->user_type === 'superuser') {
            return true;
        }

        if (! $user->role_id) {
            return false;
        }

        return $inquiry->chain->steps()->where('role_id', $user->role_id)->exists();
    }

    /**
     * Step actions (approve/resolve/reset) require the role to be the one
     * *currently* assigned, not just previously involved, plus the
     * corresponding permission. Superuser can act on any in-progress
     * inquiry's current step regardless of role or permission.
     */
    private function canActOnCurrentStep(Inquiry $inquiry, User $user, string $permission): bool
    {
        if ($inquiry->status !== 'in_progress' || ! $inquiry->currentStep) {
            return false;
        }

        if ($user->user_type === 'superuser') {
            return true;
        }

        if ($inquiry->currentStep->role_id !== $user->role_id) {
            return false;
        }

        return $this->hasPermission($user, $permission);
    }

    /**
     * Resetting back to the first step is a no-op when already there, so
     * it's excluded even if the role otherwise holds inquiry.reset.
     */
    private function canReset(Inquiry $inquiry, User $user): bool
    {
        if ($inquiry->currentStep && $inquiry->currentStep->step_order === 1) {
            return false;
        }

        return $this->canActOnCurrentStep($inquiry, $user, 'inquiry.reset');
    }

    private function hasPermission(User $user, string $permission): bool
    {
        if ($user->user_type === 'superuser') {
            return true;
        }

        if (! $user->role_id) {
            return false;
        }

        return $user->role->permissions()->where('key', $permission)->exists();
    }
}
