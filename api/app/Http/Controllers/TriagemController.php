<?php

namespace App\Http\Controllers;
use Illuminate\Http\Request;
use App\Models\Triagem;
use Illuminate\Support\Facades\Http;

class TriagemController extends Controller {
    public function store(Request $request) {
        // 1. Criar registo na BD
        $triagem = Triagem::create([
            'utente_id' => $request->utente_id,
            'hospital_id' => $request->hospital_id,
            'estado' => 'pendente'
        ]);

        // 2. Chamar a 2ª API (Ollama)
        try {
            $prompt = "Avalia estes sintomas e dá apenas a cor de Manchester: " . $request->sintomas;
            
            $response = Http::post('http://localhost:11434/api/generate', [
                'model' => 'llama3',
                'prompt' => $prompt,
                'stream' => false
            ]);

            $cor = strtolower(trim($response->json('response'))); // ex: "amarelo"

            // 3. Atualizar BD com a decisão da IA
            $triagem->update([
                'cor_manchester' => $cor,
                'resumo_ia' => $response->json('response'),
                'estado' => 'em_espera'
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => 'IA Indisponível'], 500);
        }

        return response()->json($triagem);
    }
}