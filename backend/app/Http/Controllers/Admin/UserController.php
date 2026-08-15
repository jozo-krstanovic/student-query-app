<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index()
    {
        return response()->json([
            'status' => 'ok',
            'users' => User::with('role')->orderBy('full_name')->get(),
        ]);
    }

    /**
     * Changes user_type/role_id together, mirroring the DB's
     * role_only_for_faculty constraint (role_id set iff user_type=faculty).
     */
    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'user_type' => 'required|in:student,faculty,superuser',
            'role_id' => 'nullable|integer|exists:roles,id',
        ]);

        $roleId = $data['role_id'] ?? null;

        if ($data['user_type'] === 'faculty' && ! $roleId) {
            return response()->json(['status' => 'error', 'message' => 'A role is required for faculty.'], 422);
        }

        if ($data['user_type'] !== 'faculty' && $roleId) {
            return response()->json(['status' => 'error', 'message' => 'Only faculty can have a role.'], 422);
        }

        if ($user->id === $request->user()->id && $data['user_type'] !== 'superuser') {
            return response()->json(['status' => 'error', 'message' => 'You cannot change your own role.'], 422);
        }

        $user->update([
            'user_type' => $data['user_type'],
            'role_id' => $data['user_type'] === 'faculty' ? $roleId : null,
        ]);

        return response()->json(['status' => 'ok', 'user' => $user->load('role')]);
    }
}
