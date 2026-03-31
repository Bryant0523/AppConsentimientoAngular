import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-ajustes',
  standalone: true,
  imports: [
    FormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './ajustes.html'
})
export class AjustesComponent {

  password = "";
  autorizado = false;
  constructor(){

if(localStorage.getItem("admin")){
  this.autorizado = true
}

}
  validar(){

  if(this.password === "admin123"){
    this.autorizado = true

    localStorage.setItem('admin', 'true') 

  }else{
    alert("Contraseña incorrecta")
  }

}
logout(){
  localStorage.removeItem('admin')
  this.autorizado = false
}

}