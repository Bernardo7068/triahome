<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TriagemController;
use App\Http\Controllers\HospitalController;
use App\Http\Controllers\AdminController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');


Route::post('/login', [AuthController::class, 'login']);
Route::post('/triagem', [TriagemController::class, 'store']);
Route::get('/medico/fila', [HospitalController::class, 'getPainelMedico']);
Route::get('/hospitais/lotacao', [HospitalController::class, 'getLotacao']);
// Rota para o utente ver se tem uma triagem ativa
Route::get('/triagens/estado/{utente_id}', [TriagemController::class, 'estadoAtual']);

// Rota para a Secretaria/Médico chamar o utente
Route::post('/checkin/{triagem_id}/chamar', [HospitalController::class, 'chamarUtente']);
Route::post('/checkin/nome/{nome_utente}/chamar', [TriagemController::class, 'chamarUtentePorNome']);
Route::get('/medico/proximo', [TriagemController::class, 'proximoPaciente']);
Route::post('/consultas/finalizar', [TriagemController::class, 'finalizarConsulta']);

// Rota para o histórico (GET)
// O {id} é o ID do user e o {role} é 'utente' ou 'medico'
Route::get('/historico/{id}/{role}', [TriagemController::class, 'historico']);
Route::get('/secretaria/fila', [TriagemController::class, 'filaSecretaria']);
// Rotas exclusivas para o Admin
Route::get('/admin/utilizadores', [AdminController::class, 'listarUtilizadores']);
Route::get('/admin/hospitais', [AdminController::class, 'listarHospitais']);
Route::post('/admin/utilizadores/novo', [AdminController::class, 'criarUtilizador']);