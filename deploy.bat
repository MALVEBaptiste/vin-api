@echo off
REM Script de déploiement Docker pour la wine-api sur Windows

echo ========================================
echo Déploiement Wine API avec Docker
echo ========================================

REM Vérifier Docker
docker --version > nul 2>&1
if errorlevel 1 (
    echo ERREUR: Docker n'est pas installé ou n'est pas dans le PATH
    echo Téléchargez Docker Desktop: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Vérifier docker-compose
docker-compose --version > nul 2>&1
if errorlevel 1 (
    echo ERREUR: docker-compose n'est pas disponible
    pause
    exit /b 1
)

echo.
echo [1] Construction des images Docker...
docker-compose build

if errorlevel 1 (
    echo ERREUR: La construction a échoué
    pause
    exit /b 1
)

echo.
echo [2] Démarrage des conteneurs...
docker-compose up -d

if errorlevel 1 (
    echo ERREUR: Le démarrage a échoué
    pause
    exit /b 1
)

echo.
echo [3] Attente du démarrage de la base de données (10 secondes)...
timeout /t 10 /nobreak

echo.
echo [4] Exécution des migrations...
docker-compose exec -T api npm run migration:run

echo.
echo ========================================
echo Déploiement terminé avec succès !
echo ========================================
echo.
echo API URL: http://localhost:3000
echo Swagger UI: http://localhost:3000/api/docs
echo PostgreSQL: localhost:5432
echo.
echo Commandes utiles:
echo  - Voir les logs: docker-compose logs -f api
echo  - Arrêter: docker-compose down
echo  - Redémarrer: docker-compose restart
echo.
pause
