<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\LeadRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LeadController extends Controller
{
    /**
     * List leads with stage filtering, search, and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $limit = min(100, max(1, (int) $request->query('limit', 20)));
        $page = max(1, (int) $request->query('page', 1));
        $offset = ($page - 1) * $limit;

        $query = LeadRequest::query();

        if (in_array($request->query('kind'), ['booking', 'contact'], true)) {
            $query->where('kind', $request->query('kind'));
        }

        if (in_array($request->query('status'), ['new', 'contacted', 'scheduled', 'completed', 'cancelled'], true)) {
            $query->where('status', $request->query('status'));
        }

        if ($q = $request->query('q')) {
            $query->where(function ($sub) use ($q) {
                $sub->where('name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%");
            });
        }

        $total = $query->count();
        $items = $query->orderBy('created_at', 'desc')
            ->offset($offset)
            ->limit($limit)
            ->get();

        return response()->json([
            'items' => $items,
            'total' => $total,
        ]);
    }

    /**
     * Get a single lead by ID.
     */
    public function show(string $id): JsonResponse
    {
        $lead = LeadRequest::find($id);
        if (!$lead) {
            return response()->json(['error' => 'Lead not found'], 404);
        }

        return response()->json($lead);
    }

    /**
     * Update lead status, notes, or details with version control.
     */
    public function update(string $id, Request $request): JsonResponse
    {
        $lead = LeadRequest::find($id);
        if (!$lead) {
            return response()->json(['error' => 'Lead not found'], 404);
        }

        $status = $request->input('status', $lead->status);
        $notes = $request->input('notes', $lead->notes);
        $version = $request->input('version');

        if (!in_array($status, ['new', 'contacted', 'scheduled', 'completed', 'cancelled'], true)) {
            return response()->json(['error' => 'Invalid status'], 400);
        }

        if (is_string($notes) && strlen($notes) > 10000) {
            return response()->json(['error' => 'Notes exceed maximum length'], 400);
        }

        $details = [];
        $rules = [
            'name' => 150,
            'email' => 254,
            'phone' => 50,
            'service' => 255,
            'message' => 5000,
        ];

        foreach ($rules as $key => $max) {
            if ($request->has($key)) {
                $val = trim((string)$request->input($key));
                if (in_array($key, ['name', 'message'], true) && empty($val)) {
                    return response()->json(['error' => "Invalid {$key}"], 400);
                }
                if ($key === 'email' && !filter_var($val, FILTER_VALIDATE_EMAIL)) {
                    return response()->json(['error' => 'Invalid email address'], 400);
                }
                if (strlen($val) > $max) {
                    return response()->json(['error' => "{$key} exceeds maximum length"], 400);
                }
                $details[$key] = $val;
            }
        }

        $result = DB::transaction(function () use ($id, $lead, $status, $notes, $details, $version) {
            $query = LeadRequest::where('id', $id)->lockForUpdate();
            if ($version !== null) {
                $query->where('version', (int) $version);
            }

            $current = $query->first();
            if (!$current) {
                return false;
            }

            $updateData = array_merge($details, [
                'status' => $status,
                'notes' => (string) $notes,
                'version' => $current->version + 1,
            ]);

            $current->update($updateData);
            return $current->fresh();
        });

        if (!$result) {
            return response()->json(['error' => 'This lead changed in another window. Reload it before saving.'], 409);
        }

        return response()->json($result);
    }
}
