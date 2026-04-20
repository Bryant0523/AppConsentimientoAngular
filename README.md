# ConsentimientosApp
GUIA INSTALACION ANGULAR DESDE CERO

1. INSTALAR NODE.JS

* Ir a: https://nodejs.org
* Descargar version LTS (recomendada)
* Durante la instalacion marcar: Add to PATH

2. VERIFICAR INSTALACION
   Abrir terminal (CMD o PowerShell) y ejecutar:
   node -v
   npm -v

3. (SOLO SI HAY ERROR EN POWERSHELL)
   Ejecutar en PowerShell como administrador:
   Set-ExecutionPolicy RemoteSigned
   Escribir: Y

4. INSTALAR ANGULAR CLI
   npm install -g @angular/cli

Verificar:
ng version

EJECUTAR PROYECTO EXISTENTE

5. IR A LA CARPETA DEL PROYECTO
   cd ruta/de/tu/proyecto

6. INSTALAR DEPENDENCIAS
   npm install

7. LEVANTAR PROYECTO
   ng serve

Abrir en navegador:
http://localhost:4200

PROBLEMAS COMUNES

* npm no funciona en VS Code:
  Reiniciar VS Code o usar CMD

* Error en PowerShell:
  Ejecutar Set-ExecutionPolicy RemoteSigned

* Error instalando paquetes:
  npm install --legacy-peer-deps

CREAR NUEVO PROYECTO

ng new mi-proyecto
cd mi-proyecto
ng serve

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.1.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
