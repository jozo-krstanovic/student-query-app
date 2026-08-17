<?php

namespace App\Http\Controllers;

use App\Models\Inquiry;
use App\Models\InquiryComment;
use App\Models\InquiryStepHistory;
use App\Models\Subject;
use App\Services\SupabaseStorage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InquiryController extends Controller
{
    public function index(Request $request)
    {
        $inquiries = $request->user()->inquiries()
            ->with(['subject', 'currentStep.role'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['status' => 'ok', 'inquiries' => $inquiries]);
    }

    public function show(Request $request, Inquiry $inquiry)
    {
        if ($inquiry->student_id !== $request->user()->id) {
            return response()->json(['status' => 'error', 'message' => 'Forbidden.'], 403);
        }

        $inquiry->load([
            'subject',
            'chain',
            'currentStep.role',
            'comments.author',
            'documents.uploader',
            'stepHistory.actor',
            'stepHistory.chainStep.role',
        ]);

        return response()->json([
            'status' => 'ok',
            'inquiry' => $inquiry,
            'can_edit' => $this->canEdit($inquiry),
        ]);
    }

    public function update(Request $request, Inquiry $inquiry)
    {
        if ($inquiry->student_id !== $request->user()->id) {
            return response()->json(['status' => 'error', 'message' => 'Forbidden.'], 403);
        }

        if (! $this->canEdit($inquiry)) {
            return response()->json(['status' => 'error', 'message' => 'This inquiry can no longer be edited.'], 422);
        }

        $data = $request->validate(['body' => 'required|string']);

        $inquiry->update([
            'body' => $data['body'],
            'body_edited_at' => now(),
        ]);

        return response()->json(['status' => 'ok', 'inquiry' => $inquiry]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'subject_id' => 'required|integer|exists:subjects,id',
            'body' => 'required|string',
        ]);

        $subject = Subject::findOrFail($data['subject_id']);

        if (! $subject->is_active) {
            return response()->json(['status' => 'error', 'message' => 'This subject is not currently accepting inquiries.'], 422);
        }

        if (! $subject->chain_id) {
            return response()->json(['status' => 'error', 'message' => 'This subject has no approval chain configured yet.'], 422);
        }

        $firstStep = $subject->chain->steps()->orderBy('step_order')->first();

        if (! $firstStep) {
            return response()->json(['status' => 'error', 'message' => 'This subject\'s approval chain has no steps configured.'], 422);
        }

        $inquiry = DB::transaction(function () use ($request, $data, $subject, $firstStep) {
            $inquiry = Inquiry::create([
                'student_id' => $request->user()->id,
                'subject_id' => $subject->id,
                'chain_id' => $subject->chain_id,
                'current_chain_step_id' => $firstStep->id,
                'cycle_number' => 1,
                'status' => 'in_progress',
                'body' => $data['body'],
            ]);

            InquiryStepHistory::create([
                'inquiry_id' => $inquiry->id,
                'chain_step_id' => null,
                'cycle_number' => 1,
                'action' => 'submit',
                'actor_id' => $request->user()->id,
                'note' => null,
            ]);

            return $inquiry;
        });

        $inquiry->load(['subject', 'currentStep.role']);

        return response()->json(['status' => 'ok', 'inquiry' => $inquiry], 201);
    }

    public function comment(Request $request, Inquiry $inquiry)
    {
        if ($inquiry->student_id !== $request->user()->id) {
            return response()->json(['status' => 'error', 'message' => 'Forbidden.'], 403);
        }

        $data = $request->validate([
            'body' => 'required|string',
        ]);

        $comment = $inquiry->comments()->create([
            'author_id' => $request->user()->id,
            'body' => $data['body'],
        ]);

        $comment->load('author');

        return response()->json(['status' => 'ok', 'comment' => $comment], 201);
    }

    public function uploadDocument(Request $request, Inquiry $inquiry, SupabaseStorage $storage)
    {
        if ($inquiry->student_id !== $request->user()->id) {
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
     * The body is only editable before faculty has taken any action on it --
     * once approve/resolve/reset happens, the original wording is what that
     * decision was made against, so it's locked to keep the audit trail
     * meaningful. Adding more information afterward happens via comments.
     */
    private function canEdit(Inquiry $inquiry): bool
    {
        return static::bodyIsEditable($inquiry->stepHistory->pluck('action'));
    }

    /**
     * Pure form of the same rule, kept separate from the Eloquent-querying
     * canEdit() so it's testable without a database.
     */
    public static function bodyIsEditable(iterable $actions): bool
    {
        foreach ($actions as $action) {
            if ($action !== 'submit') {
                return false;
            }
        }

        return true;
    }
}
