<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ObservationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $colors = [
            'vermelho' => ['code' => 'RED', 'display' => 'Emergente'],
            'laranja'  => ['code' => 'ORANGE', 'display' => 'Muito Urgente'],
            'amarelo'  => ['code' => 'YELLOW', 'display' => 'Urgente'],
            'verde'    => ['code' => 'GREEN', 'display' => 'Pouco Urgente'],
            'azul'     => ['code' => 'BLUE', 'display' => 'Não Urgente'],
        ];

        $corData = $colors[$this->cor_manchester] ?? ['code' => 'UNKNOWN', 'display' => 'Desconhecido'];

        return [
            'resourceType' => 'Observation',
            'id' => (string)$this->id,
            'status' => 'final',
            'category' => [
                [
                    'coding' => [
                        [
                            'system' => 'http://terminology.hl7.org/CodeSystem/observation-category',
                            'code' => 'exam',
                            'display' => 'Exam'
                        ]
                    ]
                ]
            ],
            'code' => [
                'coding' => [
                    [
                        'system' => 'http://loinc.org',
                        'code' => '11450-4',
                        'display' => 'Manchester Triage'
                    ]
                ]
            ],
            'subject' => [
                'reference' => 'Patient/' . $this->utente_id
            ],
            'effectiveDateTime' => now()->toIso8601String(), // Simplificado para demonstração
            'valueCodeableConcept' => [
                'coding' => [
                    [
                        'system' => 'http://hospital.pt/fhir/CodeSystem/manchester-color',
                        'code' => $corData['code'],
                        'display' => $corData['display']
                    ]
                ],
                'text' => $this->resumo_ia
            ],
            'note' => [
                ['text' => 'Especialidade recomendada: ' . $this->especialidade]
            ]
        ];
    }

    public function withResponse(Request $request, $response)
    {
        $response->header('Content-Type', 'application/fhir+json');
    }
}
