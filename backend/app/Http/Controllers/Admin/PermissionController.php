<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Permission;

class PermissionController extends Controller
{
    public function index()
    {
        return response()->json(['status' => 'ok', 'permissions' => Permission::all()]);
    }
}
