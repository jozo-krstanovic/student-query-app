<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SubjectController extends Controller
{
    public function index()
    {
        return response()->json(['status' => 'ok', 'subjects' => Subject::with('chain.steps.role')->get()]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:subjects,name',
            'description' => 'nullable|string',
            'chain_id' => 'nullable|integer|exists:chains,id',
        ]);

        $subject = Subject::create($data);

        return response()->json(['status' => 'ok', 'subject' => $subject->load('chain.steps.role')], 201);
    }

    public function update(Request $request, Subject $subject)
    {
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255|unique:subjects,name,'.$subject->id,
            'description' => 'nullable|string',
            'chain_id' => 'nullable|integer|exists:chains,id',
            'is_active' => 'sometimes|boolean',
        ]);

        $isActive = $data['is_active'] ?? null;
        unset($data['is_active']);

        $subject->update($data);

        // Can't fold this into the update() above: a bound PHP boolean hits
        // the same boolean/integer binding mismatch as the student-facing
        // SubjectController::index query, but wrapping it in DB::raw() to
        // work around that breaks *differently* on a single already-loaded
        // instance -- Model::update() casts old and new values through the
        // boolean cast before deciding if anything changed, and any object
        // (including a raw SQL expression) casts truthy in PHP, so "already
        // true" looks unchanged even when actually flipping to false, and
        // the write is silently dropped. Subject::whereKey()->update() is a
        // query-builder mass update with no such per-instance dirty-tracking
        // to fool.
        if ($isActive !== null) {
            Subject::whereKey($subject->id)->update(['is_active' => DB::raw($isActive ? 'true' : 'false')]);
        }

        $subject->refresh();

        return response()->json(['status' => 'ok', 'subject' => $subject->load('chain.steps.role')]);
    }
}
