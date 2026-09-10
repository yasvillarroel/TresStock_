# ProyectoCapstone

<!-- Requerimientos -->

Este proyecto utiliza:
-Nodejs
-Python 3.12
-PostgreSQL

<!-- EJECUCION -->


    <!-- Creacion de entorno -->
    - abrir terminal
    - terminal: py install 3.12 (version de python a trabajar)
    - terminal: cd TresStock
    - terminal: cd python
    - terminal: py -3.12 -m venv venv
    - terminal: venv/Scripts/activate.ps1
    - terminal: pip install -r requirements.txt
    - terminal: python -c "import pandas, psycopg2, sklearn; print('OK')" (revisar importaciones)

    <!-- Instalar dependencias de node (Estan definidas en packa-lock.json) -->
    - terminal: cd TresStock
    - terminal: npm ci

    ####### NO USAR: NPM UPDATE, SOLO MANTENER VERSIONES ACTUALES DEFINIDAS EN PACKAGE-LOCK.JSON ###################

    <!-- Configurar nodejs (Esto es solo la primera vez, no hacer si ya existe)-->
    - Instalar nodejs
    - terminal: cd TresStock
    - Eliminar package.json
    - npm init -y
    - npm install express pg cors dotenv
    - npm install --save-dev nodemon


    <!-- PROBAR CONEXION BASE DE DATOS -->

    - Desde TresStock
    - terminal: node backend/probar_conexion.js (revisar credenciales en .env)