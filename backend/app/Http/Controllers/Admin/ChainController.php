<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Chain;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ChainController extends Controller
{
    public function index()
    {
        return response()->json(['status' => 'ok', 'chains' => Chain::with('steps.role')->get()]);
    }

    public function show(Chain $chain)
    {
        return response()->json(['status' => 'ok', 'chain' => $chain->load('steps.role')]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'steps' => 'required|array|min:1',
            'steps.*.role_id' => 'required|integer|exists:roles,id',
            'steps.*.label' => 'nullable|string|max:255',
        ]);

        $chain = DB::transaction(function () use ($data) {
            $chain = Chain::create([
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
            ]);

            foreach ($data['steps'] as $index => $step) {
                $chain->steps()->create([
                    'step_order' => $index + 1,
                    'role_id' => $step['role_id'],
                    'label' => $step['label'] ?? null,
                ]);
            }

            return $chain;
        });

        return response()->json(['status' => 'ok', 'chain' => $chain->load('steps.role')], 201);
    }
}
