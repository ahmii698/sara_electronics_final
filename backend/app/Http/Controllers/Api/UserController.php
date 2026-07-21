<?php
// app/Http/Controllers/Api/UserController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with('branch');

        if ($request->email) {
            $query->where('email', $request->email);
        }

        if ($request->role) {
            $query->where('role', $request->role);
        }

        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->search) {
            $search = $request->search;
            $query->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('email', 'LIKE', "%{$search}%")
                  ->orWhere('phone', 'LIKE', "%{$search}%");
        }

        $users = $query->orderBy('id', 'desc')->paginate(20);
        
        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }

    public function show($id)
    {
        $user = User::with(['branch', 'customers', 'accounts', 'employeeAccounts'])->find($id);
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }
        return response()->json([
            'success' => true,
            'data' => $user
        ]);
    }

    // ============================================
    // ✅ PUBLIC - CHECK USER BY EMAIL
    // ============================================
    public function checkUser(Request $request)
    {
        try {
            $request->validate([
                'email' => 'required|email',
                'role' => 'nullable|string'
            ]);

            $query = User::where('email', $request->email);

            if ($request->role) {
                $query->where('role', $request->role);
            }

            $user = $query->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $user
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // ✅ PUBLIC - UPDATE PASSWORD
    // ============================================
    public function updatePasswordPublic(Request $request)
    {
        try {
            $request->validate([
                'email' => 'required|email',
                'password' => 'required|min:6',
            ]);

            $user = User::where('email', $request->email)->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            $user->password = Hash::make($request->password);
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Password updated successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // ✅ STORE - WITH VOICE CONSENT
    // ============================================
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'phone' => 'nullable|string|max:20',
            'role' => 'nullable|in:admin,manager,employee',
            'branch_id' => 'nullable|exists:branches,id',
            'salary' => 'nullable|numeric|min:0',
            'cnic_front' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            'cnic_back' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            'agreement_form' => 'nullable|file|mimes:pdf,jpg,jpeg,png,doc,docx|max:5120',
            'voice_consent' => 'nullable|file|mimes:mp3,wav,m4a|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $request->all();
        $data['password'] = Hash::make($request->password);

        // Upload CNIC Front
        if ($request->hasFile('cnic_front')) {
            $file = $request->file('cnic_front');
            $filename = time() . '_front_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('employees/cnic/front', $filename, 'public');
            $data['cnic_front'] = $path;
        }

        // Upload CNIC Back
        if ($request->hasFile('cnic_back')) {
            $file = $request->file('cnic_back');
            $filename = time() . '_back_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('employees/cnic/back', $filename, 'public');
            $data['cnic_back'] = $path;
        }

        // Upload Agreement
        if ($request->hasFile('agreement_form')) {
            $file = $request->file('agreement_form');
            $filename = time() . '_agreement_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('employees/agreement', $filename, 'public');
            $data['agreement_form'] = $path;
        }

        // Upload Voice Consent
        if ($request->hasFile('voice_consent')) {
            $file = $request->file('voice_consent');
            $filename = time() . '_voice_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('employees/voice', $filename, 'public');
            $data['voice_consent'] = $path;
        }

        $user = User::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Employee created successfully',
            'data' => $user
        ], 201);
    }

    // ============================================
    // ✅ UPDATE - WITH VOICE CONSENT
    // ============================================
    public function update(Request $request, $id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:100',
            'phone' => 'nullable|string|max:20',
            'role' => 'nullable|in:admin,manager,employee',
            'branch_id' => 'nullable|exists:branches,id',
            'salary' => 'nullable|numeric|min:0',
            'is_active' => 'nullable|boolean',
            'password' => 'nullable|min:6',
            'cnic_front' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            'cnic_back' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            'agreement_form' => 'nullable|file|mimes:pdf,jpg,jpeg,png,doc,docx|max:5120',
            'voice_consent' => 'nullable|file|mimes:mp3,wav,m4a|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $request->except(['password', 'cnic_front', 'cnic_back', 'agreement_form', 'voice_consent']);

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        // Upload CNIC Front
        if ($request->hasFile('cnic_front')) {
            if ($user->cnic_front && Storage::disk('public')->exists($user->cnic_front)) {
                Storage::disk('public')->delete($user->cnic_front);
            }
            $file = $request->file('cnic_front');
            $filename = time() . '_front_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('employees/cnic/front', $filename, 'public');
            $data['cnic_front'] = $path;
        }

        // Upload CNIC Back
        if ($request->hasFile('cnic_back')) {
            if ($user->cnic_back && Storage::disk('public')->exists($user->cnic_back)) {
                Storage::disk('public')->delete($user->cnic_back);
            }
            $file = $request->file('cnic_back');
            $filename = time() . '_back_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('employees/cnic/back', $filename, 'public');
            $data['cnic_back'] = $path;
        }

        // Upload Agreement
        if ($request->hasFile('agreement_form')) {
            if ($user->agreement_form && Storage::disk('public')->exists($user->agreement_form)) {
                Storage::disk('public')->delete($user->agreement_form);
            }
            $file = $request->file('agreement_form');
            $filename = time() . '_agreement_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('employees/agreement', $filename, 'public');
            $data['agreement_form'] = $path;
        }

        // Upload Voice Consent
        if ($request->hasFile('voice_consent')) {
            if ($user->voice_consent && Storage::disk('public')->exists($user->voice_consent)) {
                Storage::disk('public')->delete($user->voice_consent);
            }
            $file = $request->file('voice_consent');
            $filename = time() . '_voice_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('employees/voice', $filename, 'public');
            $data['voice_consent'] = $path;
        }

        $user->update($data);

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully',
            'data' => $user
        ]);
    }

    // ============================================
    // ✅ DESTROY - WITH VOICE CONSENT
    // ============================================
    public function destroy($id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }

        // Delete files from storage
        $files = [
            $user->cnic_front,
            $user->cnic_back,
            $user->agreement_form,
            $user->voice_consent
        ];

        foreach ($files as $file) {
            if ($file && Storage::disk('public')->exists($file)) {
                Storage::disk('public')->delete($file);
            }
        }

        $user->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully'
        ]);
    }

    // ============================================
    // ✅ HELPER METHODS
    // ============================================
    public function sendResponse($data, $message = 'Success', $statusCode = 200)
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data
        ], $statusCode);
    }

    public function sendError($message, $statusCode = 400)
    {
        return response()->json([
            'success' => false,
            'message' => $message
        ], $statusCode);
    }
}