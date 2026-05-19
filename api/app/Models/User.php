<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable {
    use HasFactory, Notifiable;

    protected $table = 'utilizadores';

    // ESTA É A LINHA MÁGICA QUE DESLIGA O ERRO DAS DATAS!
    public $timestamps = false; 

    protected $fillable = [
        'nome',
        'email',
        'password_hash',
        'role',
        'nr_utente',
        'nr_funcionario',
        'especialidade',
        'hospital_id',
        'ativo',
        // ADICIONA ESTES NOVOS CAMPOS AQUI:
        'idade',
        'altura',
        'morada',
        'descricao'
    ];

    protected $hidden = [
        'password_hash',
    ];
}