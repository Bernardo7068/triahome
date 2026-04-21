<?php

namespace App\Http\Controllers;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller {
    public function login(Request $request) {
        $user = User::where('email', $request->email)->first();

        // Nota: Em produção usarias Hash::check, para o protótipo comparamos a pass
        if (!$user || $request->password !== "123456") { // Ajusta para a tua lógica de teste
            return response()->json(['message' => 'Credenciais inválidas'], 401);
        }

        return response()->json([
            'user' => $user,
            'token' => 'token-simulado-' . $user->id // Para o React guardar no localStorage
        ]);
    }
}