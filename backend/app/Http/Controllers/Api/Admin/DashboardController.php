<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Content;
use App\Models\LeadRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Dashboard summary metrics.
     */
    public function index(): JsonResponse
    {
        $counts = DB::table('content')
            ->select('collection', 'status', DB::raw('count(*) as count'))
            ->whereNull('deleted_at')
            ->groupBy('collection', 'status')
            ->get();

        $requests = DB::table('requests')
            ->select('kind', 'status', DB::raw('count(*) as count'))
            ->groupBy('kind', 'status')
            ->get();

        $recent = LeadRequest::select('id', 'kind', 'name', 'status', 'created_at')
            ->orderBy('created_at', 'desc')
            ->limit(8)
            ->get();

        return response()->json([
            'counts' => $counts,
            'requests' => $requests,
            'recent' => $recent,
        ]);
    }
}
