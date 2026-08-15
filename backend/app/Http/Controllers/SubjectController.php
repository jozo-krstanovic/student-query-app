<?php

namespace App\Http\Controllers;

use App\Models\Subject;

class SubjectController extends Controller
{
    /**
     * Subjects a student can actually submit an inquiry for -- active and
     * with a chain configured. Distinct from Admin\SubjectController, which
     * manages the full set (including inactive/chain-less ones).
     */
    public function index()
    {
        // ->where('is_active', true) binds as integer 1 under
        // PDO::ATTR_EMULATE_PREPARES (see config/database.php), and Postgres
        // rejects "boolean = integer" -- cast the column instead of relying
        // on the bound parameter's type.
        $subjects = Subject::whereRaw('is_active::int = 1')
            ->whereNotNull('chain_id')
            ->orderBy('name')
            ->get();

        return response()->json(['status' => 'ok', 'subjects' => $subjects]);
    }
}
