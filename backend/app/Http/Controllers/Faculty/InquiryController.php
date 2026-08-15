<?php

namespace App\Http\Controllers\Faculty;

use App\Http\Controllers\Controller;
use App\Models\ChainStep;
use App\Models\Inquiry;
use App\Models\InquiryStepHistory;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InquiryController extends Controller
{
    public function index(Request $request)
    {
        $roleId = $request->user()->role_id;

        $inquiries = Inquiry::where('status', 'in_progress')
            ->whereHas('currentStep', fn ($q) => $q->where('role_id', $roleId))
            ->with(['student', 'subject', 'currentStep.role'])
            ->orderBy('created_at')
            ->get();

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

    /**
     * Visible if this role is currently assigned, or was ever assigned in
     * this inquiry's history (past or current step) -- not just anyone.
     */
    private function hasVisibility(Inquiry $inquiry, User $user): bool
    {
        if (! $user->role_id) {
            return false;
        }

        if ($inquiry->currentStep && $inquiry->currentStep->role_id === $user->role_id) {
            return true;
        }

        return $inquiry->stepHistory()
            ->whereHas('chainStep', fn ($q) => $q->where('role_id', $user->role_id))
            ->exists();
    }

    /**
     * Step actions (approve/resolve/reset) require the role to be the one
     * *currently* assigned, not just previously involved, plus the
     * corresponding permission.
     */
    private function canActOnCurrentStep(Inquiry $inquiry, User $user, string $permission): bool
    {
        if ($inquiry->status !== 'in_progress' || ! $inquiry->currentStep) {
            return false;
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
        if (! $user->role_id) {
            return false;
        }

        return $user->role->permissions()->where('key', $permission)->exists();
    }
}
