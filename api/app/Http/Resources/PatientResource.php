<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PatientResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'resourceType' => 'Patient',
            'id' => (string)$this->id,
            'identifier' => [
                [
                    'system' => 'http://hospital.pt/identificadores/utente',
                    'value' => (string)$this->nr_utente,
                ]
            ],
            'active' => (bool)$this->ativo,
            'name' => [
                [
                    'use' => 'official',
                    'text' => $this->nome,
                ]
            ],
            'telecom' => [
                [
                    'system' => 'email',
                    'value' => $this->email,
                    'use' => 'home',
                ]
            ],
            'address' => [
                [
                    'text' => $this->morada,
                    'type' => 'both',
                ]
            ],
            // Extensão customizada para os campos que o FHIR não tem por padrão de forma simples
            'extension' => [
                [
                    'url' => 'http://hospital.pt/fhir/StructureDefinition/altura',
                    'valueDecimal' => $this->altura,
                ]
            ]
        ];
    }

    public function withResponse(Request $request, $response)
    {
        $response->header('Content-Type', 'application/fhir+json');
    }
}
