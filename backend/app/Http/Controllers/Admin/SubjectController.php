<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use Illuminate\Http\Request;

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

        $subject->update($data);

        return response()->json(['status' => 'ok', 'subject' => $subject->load('chain.steps.role')]);
    }
}
