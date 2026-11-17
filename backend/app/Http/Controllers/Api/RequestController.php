<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LeadRequest;
use Carbon\Carbon;
use DateTimeZone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class RequestController extends Controller
{
    /**
     * Submit a new booking or contact inquiry.
     */
    public function store(Request $request): JsonResponse
    {
        $throttleKey = 'leads:' . $request->ip();
        if (RateLimiter::tooManyAttempts($throttleKey, 10)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return response()->json([
                'error' => "Submission limit reached. Try again in {$seconds} seconds.",
            ], 429)->header('Retry-After', (string) $seconds);
        }

        $input = $request->all();

        // Honeypot check: website field must be strictly empty
        if (!empty($input['website'])) {
            return response()->json(['error' => 'Invalid request'], 400);
        }

        $validated = $request->validate([
            'kind' => 'required|in:booking,contact',
            'name' => 'required|string|min:1|max:150',
            'email' => 'required|email|max:254',
            'phone' => 'nullable|string|max:50',
            'service' => 'nullable|string|max:255',
            'message' => 'required|string|min:1|max:5000',
            'requested_at' => 'nullable|date',
            'timezone' => 'nullable|string|max:100',
            'dedup_key' => 'required|uuid',
        ]);

        $kind = $validated['kind'];
        $timezone = $validated['timezone'] ?? 'Asia/Dhaka';

        if (!in_array($timezone, DateTimeZone::listIdentifiers(), true)) {
            $timezone = 'Asia/Dhaka';
        }

        $requestedAt = null;
        if (!empty($validated['requested_at'])) {
            $requestedAt = Carbon::parse($validated['requested_at']);
            if ($kind === 'booking' && $requestedAt->isPast()) {
                return response()->json(['error' => 'Choose a future requested time'], 400);
            }
        }

        try {
            LeadRequest::create([
                'id' => (string) Str::uuid(),
                'kind' => $kind,
                'name' => trim($validated['name']),
                'email' => strtolower(trim($validated['email'])),
                'phone' => trim($validated['phone'] ?? ''),
                'service' => trim($validated['service'] ?? ''),
                'message' => trim($validated['message']),
                'requested_at' => $requestedAt,
                'timezone' => $timezone,
                'notes' => '',
                'dedup_key' => $validated['dedup_key'],
                'status' => 'new',
                'version' => 1,
            ]);
            RateLimiter::hit($throttleKey, 3600);
        } catch (\Illuminate\Database\UniqueConstraintViolationException $e) {
            // Idempotent duplicate: silently accept without double insert
        }

        return response()->json([
            'message' => $kind === 'booking'
                ? 'Request received. This is not a confirmed appointment.'
                : 'Message received. Thank you.',
        ], 202);
    }
}
