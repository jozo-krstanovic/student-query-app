<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\Request;

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

        $role->update($data);

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
