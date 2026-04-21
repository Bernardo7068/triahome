<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable {
    protected $table = 'utilizadores'; // Nome da tua tabela
    public $timestamps = false;
    protected $fillable = ['nome', 'email', 'password_hash', 'role', 'nr_utente', 'hospital_id'];
    protected $hidden = ['password_hash'];

    // Para o Laravel saber que a password não se chama 'password'
    public function getAuthPassword()
{
    return $this->password_hash;
}
}
