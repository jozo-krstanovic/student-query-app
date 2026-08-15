<?php

namespace App\Http\Controllers;

use App\Models\Inquiry;
use App\Models\InquiryStepHistory;
use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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
            'stepHistory.actor',
            'stepHistory.chainStep.role',
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
}
