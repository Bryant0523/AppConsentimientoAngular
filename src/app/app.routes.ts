import { Routes } from '@angular/router';

import { PacientesComponent } from './pages/pacientes/pacientes';
import { ConsentimientosComponent } from './pages/consentimientos/consentimientos';
import { PlantillasComponent } from './pages/plantillas/plantillas';
import { MedicosComponent } from './pages/medicos/medicos';
import { EnfermerosComponent } from './pages/enfermeros/enfermeros';
import { AjustesComponent } from './pages/ajustes/ajustes';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [

  { path: 'pacientes', component: PacientesComponent },

  { path: 'consentimientos/:documento', component: ConsentimientosComponent },

 
  { path: 'medicos', component: MedicosComponent, canActivate: [adminGuard] },
  { path: 'enfermeros', component: EnfermerosComponent, canActivate: [adminGuard] },
  { path: 'plantillas', component: PlantillasComponent, canActivate: [adminGuard] },

  { path: 'ajustes', component: AjustesComponent },

  { path: '', redirectTo: 'pacientes', pathMatch: 'full' }

];