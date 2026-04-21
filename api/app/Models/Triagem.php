<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Triagem extends Model {
    protected $table = 'triagens';
    public $timestamps = false;
    protected $fillable = ['utente_id', 'hospital_id', 'cor_manchester', 'nivel_prioridade', 'resumo_ia', 'estado'];
}