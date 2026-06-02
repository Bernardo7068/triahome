<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Triagem;
use App\Http\Resources\PatientResource;
use App\Http\Resources\ObservationResource;
use Illuminate\Http\Request;

class FhirController extends Controller
{
    /**
     * Retorna um Utente no formato FHIR Patient
     */
    public function getPatient($id)
    {
        $user = User::where('id', $id)->where('role', 'utente')->firstOrFail();
        return new PatientResource($user);
    }

    /**
     * Retorna uma Triagem no formato FHIR Observation
     */
    public function getObservation($id)
    {
        $triagem = Triagem::findOrFail($id);
        return new ObservationResource($triagem);
    }

    /**
     * Lista todos os pacientes em formato FHIR (Bundle)
     */
    public function listPatients()
    {
        $users = User::where('role', 'utente')->get();
        return [
            'resourceType' => 'Bundle',
            'type' => 'searchset',
            'total' => $users->count(),
            'entry' => PatientResource::collection($users)
        ];
    }
}
