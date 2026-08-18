<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RoleController extends Controller
{
    public function index()
    {
        return response()->json(['status' => 'ok', 'roles' => Role::with('permissions')->get()]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'description' => 'nullable|string',
        ]);

        $role = Role::create($data);

        return response()->json(['status' => 'ok', 'role' => $role->load('permissions')], 201);
    }

    public function update(Request $request, Role $role)
    {
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255|unique:roles,name,'.$role->id,
            'description' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
        ]);

        $isActive = $data['is_active'] ?? null;
        unset($data['is_active']);

        $role->update($data);

        // Can't fold this into the update() above: a bound PHP boolean hits
        // the same boolean/integer binding mismatch as SubjectController's
        // is_active query, but wrapping it in DB::raw() to work around that
        // breaks *differently* on a single already-loaded instance --
        // Model::update() casts old and new values through the boolean cast
        // before deciding if anything changed, and any object (including a
        // raw SQL expression) casts truthy in PHP, so "already true" looks
        // unchanged even when actually flipping to false, and the write is
        // silently dropped. Role::whereKey()->update() is a query-builder
        // mass update with no such per-instance dirty-tracking to fool.
        if ($isActive !== null) {
            Role::whereKey($role->id)->update(['is_active' => DB::raw($isActive ? 'true' : 'false')]);
        }

        $role->refresh();

        return response()->json(['status' => 'ok', 'role' => $role->load('permissions')]);
    }

    public function syncPermissions(Request $request, Role $role)
    {
        $data = $request->validate([
            'permission_ids' => 'present|array',
            'permission_ids.*' => 'integer|exists:permissions,id',
        ]);

        $role->permissions()->sync($data['permission_ids']);

        return response()->json(['status' => 'ok', 'role' => $role->load('permissions')]);
    }
}
