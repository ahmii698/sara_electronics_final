<?php
// routes/api.php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BranchController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\AccountController;
use App\Http\Controllers\Api\InstallmentController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\GuarantorController;
use App\Http\Controllers\Api\SalaryController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\RecoveryController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\OtpController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// ============================================
// ✅ PUBLIC ROUTES (NO TOKEN REQUIRED)
// ============================================
Route::post('/auth/login', [AuthController::class, 'login']);

// Forgot Password - Public Routes
Route::get('/users/check', [UserController::class, 'checkUser']);
Route::post('/users/update-password-public', [UserController::class, 'updatePasswordPublic']);

// OTP Routes (Public)
Route::post('/otp/send', [OtpController::class, 'sendOtp']);
Route::post('/otp/verify', [OtpController::class, 'verifyOtp']);

// ============================================
// ✅ PROTECTED ROUTES (TOKEN REQUIRED)
// ============================================
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

    // Branches
    Route::get('/branches', [BranchController::class, 'index']);
    Route::get('/branches/{id}', [BranchController::class, 'show']);

    // Users
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);

    // Customers
    Route::get('/customers', [CustomerController::class, 'index']);
    Route::get('/customers/{id}', [CustomerController::class, 'show']);
    Route::post('/customers', [CustomerController::class, 'store']);
    Route::put('/customers/{id}', [CustomerController::class, 'update']);
    Route::delete('/customers/{id}', [CustomerController::class, 'destroy']);
    Route::post('/customers/search-cnic', [CustomerController::class, 'searchByCNIC']);
    Route::post('/customers/check-cnic', [CustomerController::class, 'checkCnic']); // ✅ NEW

    // Products
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{id}', [ProductController::class, 'show']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);

    // Accounts
    Route::get('/accounts', [AccountController::class, 'index']);
    Route::get('/accounts/{id}', [AccountController::class, 'show']);
    Route::post('/accounts', [AccountController::class, 'store']);
    Route::put('/accounts/{id}', [AccountController::class, 'update']);
    Route::delete('/accounts/{id}', [AccountController::class, 'destroy']);

    // Installments
    Route::get('/installments', [InstallmentController::class, 'index']);
    Route::post('/installments/pay', [InstallmentController::class, 'payInstallment']);
    Route::get('/installments/overdue', [InstallmentController::class, 'overdue']);
    Route::get('/installments/aging-report', [InstallmentController::class, 'agingReport']);

    // Guarantors
    Route::get('/guarantors', [GuarantorController::class, 'index']);
    Route::get('/guarantors/{id}', [GuarantorController::class, 'show']);
    Route::post('/guarantors', [GuarantorController::class, 'store']);
    Route::put('/guarantors/{id}', [GuarantorController::class, 'update']);
    Route::delete('/guarantors/{id}', [GuarantorController::class, 'destroy']);

    // Expenses
    Route::get('/expenses/fixed', [ExpenseController::class, 'fixedExpenses']);
    Route::post('/expenses/fixed', [ExpenseController::class, 'storeFixed']);
    Route::put('/expenses/fixed/{id}', [ExpenseController::class, 'updateFixed']);
    Route::post('/expenses/fixed/{id}/pay', [ExpenseController::class, 'payFixed']);
    Route::delete('/expenses/fixed/{id}', [ExpenseController::class, 'deleteFixed']);

    Route::get('/expenses/extra', [ExpenseController::class, 'extraExpenses']);
    Route::post('/expenses/extra', [ExpenseController::class, 'storeExtra']);
    Route::delete('/expenses/extra/{id}', [ExpenseController::class, 'deleteExtra']);

    // Salary
    Route::get('/salary', [SalaryController::class, 'index']);
    Route::post('/salary', [SalaryController::class, 'store']);
    Route::put('/salary/{id}', [SalaryController::class, 'update']);
    Route::post('/salary/{id}/pay', [SalaryController::class, 'paySalary']);

    Route::get('/salary/advances', [SalaryController::class, 'advances']);
    Route::post('/salary/advances', [SalaryController::class, 'storeAdvance']);
    Route::post('/salary/advances/{id}/deduct', [SalaryController::class, 'deductAdvance']);

    // Recovery
    Route::get('/recovery', [RecoveryController::class, 'index']);
    Route::post('/recovery', [RecoveryController::class, 'store']);
    Route::delete('/recovery/{id}', [RecoveryController::class, 'destroy']);

    // ============================================
    // ✅ REPORTS - UPDATED WITH NEW ROUTES
    // ============================================
    
    // Existing report routes
    Route::get('/reports/dashboard', [ReportController::class, 'dashboard']);
    Route::get('/reports/branch-recovery', [ReportController::class, 'branchWiseRecovery']);
    Route::get('/reports/monthly-installments', [ReportController::class, 'monthlyInstallmentStatus']);
    Route::get('/reports/top-performers', [ReportController::class, 'topPerformers']);
    Route::get('/reports/employee-performance', [ReportController::class, 'employeePerformance']);
    Route::get('/reports/account-status', [ReportController::class, 'accountStatusSummary']);
    
    // ✅ NEW Employee Account Report Routes
    Route::get('/reports/employee-stats', [ReportController::class, 'getEmployeeStats']);
    Route::get('/reports/employee-detail/{id}', [ReportController::class, 'getEmployeeDetail']);
    Route::get('/reports/branch-performance', [ReportController::class, 'getBranchPerformance']);
    Route::get('/reports/monthly-report', [ReportController::class, 'getMonthlyReport']);
});