<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

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
            $query->where('name', 'LIKE', "%{$request->search}%")
                  ->orWhere('email', 'LIKE', "%{$request->search}%");
        }

        $users = $query->orderBy('id', 'desc')->paginate(20);
        
        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }

    public function show($id)
    {
        $user = User::with(['branch', 'customers', 'accounts'])->find($id);
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
    // ✅ PUBLIC - CHECK USER BY EMAIL (NO TOKEN REQUIRED)
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
    // ✅ PUBLIC - UPDATE PASSWORD (NO TOKEN REQUIRED)
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

    public function store(Request $request)
    {
        $request->validate([
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
        ]);

        $data = $request->all();
        $data['password'] = Hash::make($request->password);

        // Upload CNIC Front
        if ($request->hasFile('cnic_front')) {
            $file = $request->file('cnic_front');
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $file->storeAs('public/employees/cnic/front', $filename);
            $data['cnic_front'] = 'storage/employees/cnic/front/' . $filename;
        }

        // Upload CNIC Back
        if ($request->hasFile('cnic_back')) {
            $file = $request->file('cnic_back');
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $file->storeAs('public/employees/cnic/back', $filename);
            $data['cnic_back'] = 'storage/employees/cnic/back/' . $filename;
        }

        // Upload Agreement
        if ($request->hasFile('agreement_form')) {
            $file = $request->file('agreement_form');
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $file->storeAs('public/employees/agreements', $filename);
            $data['agreement_form'] = 'storage/employees/agreements/' . $filename;
        }

        $user = User::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Employee created successfully',
            'data' => $user
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }

        $request->validate([
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
        ]);

        if ($request->has('password') && $request->password) {
            $request->merge(['password' => Hash::make($request->password)]);
        }

        // Upload new images if provided
        if ($request->hasFile('cnic_front')) {
            if ($user->cnic_front) {
                $oldPath = str_replace('storage/', 'public/', $user->cnic_front);
                if (Storage::exists($oldPath)) {
                    Storage::delete($oldPath);
                }
            }
            $file = $request->file('cnic_front');
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $file->storeAs('public/employees/cnic/front', $filename);
            $request->merge(['cnic_front' => 'storage/employees/cnic/front/' . $filename]);
        }

        if ($request->hasFile('cnic_back')) {
            if ($user->cnic_back) {
                $oldPath = str_replace('storage/', 'public/', $user->cnic_back);
                if (Storage::exists($oldPath)) {
                    Storage::delete($oldPath);
                }
            }
            $file = $request->file('cnic_back');
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $file->storeAs('public/employees/cnic/back', $filename);
            $request->merge(['cnic_back' => 'storage/employees/cnic/back/' . $filename]);
        }

        if ($request->hasFile('agreement_form')) {
            if ($user->agreement_form) {
                $oldPath = str_replace('storage/', 'public/', $user->agreement_form);
                if (Storage::exists($oldPath)) {
                    Storage::delete($oldPath);
                }
            }
            $file = $request->file('agreement_form');
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $file->storeAs('public/employees/agreements', $filename);
            $request->merge(['agreement_form' => 'storage/employees/agreements/' . $filename]);
        }

        $user->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully',
            'data' => $user
        ]);
    }

    public function destroy($id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }

        // Delete images from storage
        if ($user->cnic_front) {
            $path = str_replace('storage/', 'public/', $user->cnic_front);
            if (Storage::exists($path)) {
                Storage::delete($path);
            }
        }
        if ($user->cnic_back) {
            $path = str_replace('storage/', 'public/', $user->cnic_back);
            if (Storage::exists($path)) {
                Storage::delete($path);
            }
        }
        if ($user->agreement_form) {
            $path = str_replace('storage/', 'public/', $user->agreement_form);
            if (Storage::exists($path)) {
                Storage::delete($path);
            }
        }

        $user->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully'
        ]);
    }
}