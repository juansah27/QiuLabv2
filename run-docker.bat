@echo off
setlocal enabledelayedexpansion

:: Script untuk menjalankan aplikasi dengan Docker di Windows
:: Penggunaan: run-docker.bat [up|down|build|logs|restart|prune|status|help]

:: Warna untuk output
set "GREEN=[32m"
set "YELLOW=[33m"
set "RED=[31m"
set "BLUE=[34m"
set "CYAN=[36m"
set "NC=[0m"

:: Fungsi untuk menampilkan pesan dengan warna (Windows 10+)
echo off > nul
for /F %%a in ('echo prompt $E ^| cmd') do (
  set "ESC=%%a"
)

:: Fungsi bantuan
:show_help
echo %ESC%%CYAN%=== QiuLab Docker Helper ===%ESC%%NC%
echo Penggunaan: run-docker.bat [COMMAND]
echo.
echo Commands:
echo   up        Menjalankan container
echo   down      Menghentikan container
echo   build     Membangun image
echo   logs      Menampilkan log
echo   restart   Me-restart container
echo   prune     Membersihkan resource Docker yang tidak digunakan
echo   status    Melihat status container
echo   help      Menampilkan bantuan ini
goto :eof

:: Verifikasi argumen
if "%~1"=="" (
    echo %ESC%%RED%[ERROR]%ESC%%NC% Tidak ada argumen yang diberikan
    call :show_help
    exit /b 1
)

set COMMAND=%1

:: Verifikasi Docker
where docker >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo %ESC%%RED%[ERROR]%ESC%%NC% Docker tidak ditemukan. Pastikan Docker terinstal dan dapat dijalankan.
    exit /b 1
)

:: Verifikasi Docker Compose
set COMPOSE_CMD=
where docker-compose >nul 2>nul
if %ERRORLEVEL% equ 0 (
    set "COMPOSE_CMD=docker-compose"
) else (
    docker compose version >nul 2>nul
    if %ERRORLEVEL% equ 0 (
        set "COMPOSE_CMD=docker compose"
    ) else (
        echo %ESC%%RED%[ERROR]%ESC%%NC% Docker Compose tidak ditemukan. Pastikan Docker Compose terinstal.
        exit /b 1
    )
)

:: Jalankan perintah sesuai argumen
if "%COMMAND%"=="up" (
    echo %ESC%%BLUE%[INFO]%ESC%%NC% Menjalankan container...
    %COMPOSE_CMD% up -d
    if %ERRORLEVEL% equ 0 (
        echo %ESC%%GREEN%[SUCCESS]%ESC%%NC% Container berhasil dijalankan
        echo %ESC%%BLUE%[INFO]%ESC%%NC% Aplikasi dapat diakses di: http://localhost
        echo %ESC%%BLUE%[INFO]%ESC%%NC% Untuk melihat log, jalankan: run-docker.bat logs
        echo %ESC%%BLUE%[INFO]%ESC%%NC% Untuk melihat status, jalankan: run-docker.bat status
    ) else (
        echo %ESC%%RED%[ERROR]%ESC%%NC% Gagal menjalankan container
    )
) else if "%COMMAND%"=="down" (
    echo %ESC%%BLUE%[INFO]%ESC%%NC% Menghentikan container...
    %COMPOSE_CMD% down
    if %ERRORLEVEL% equ 0 (
        echo %ESC%%GREEN%[SUCCESS]%ESC%%NC% Container berhasil dihentikan
    ) else (
        echo %ESC%%RED%[ERROR]%ESC%%NC% Gagal menghentikan container
    )
) else if "%COMMAND%"=="build" (
    echo %ESC%%BLUE%[INFO]%ESC%%NC% Membangun image...
    %COMPOSE_CMD% build --no-cache
    if %ERRORLEVEL% equ 0 (
        echo %ESC%%GREEN%[SUCCESS]%ESC%%NC% Image berhasil dibangun
        echo %ESC%%BLUE%[INFO]%ESC%%NC% Untuk menjalankan container, jalankan: run-docker.bat up
    ) else (
        echo %ESC%%RED%[ERROR]%ESC%%NC% Gagal membangun image
    )
) else if "%COMMAND%"=="logs" (
    if "%~2"=="" (
        echo %ESC%%BLUE%[INFO]%ESC%%NC% Menampilkan log untuk semua service...
        %COMPOSE_CMD% logs -f
    ) else (
        set SERVICE=%2
        echo %ESC%%BLUE%[INFO]%ESC%%NC% Menampilkan log untuk service %SERVICE%...
        %COMPOSE_CMD% logs -f %SERVICE%
    )
) else if "%COMMAND%"=="restart" (
    if "%~2"=="" (
        echo %ESC%%BLUE%[INFO]%ESC%%NC% Me-restart semua container...
        %COMPOSE_CMD% restart
        if %ERRORLEVEL% equ 0 (
            echo %ESC%%GREEN%[SUCCESS]%ESC%%NC% Container berhasil di-restart
        ) else (
            echo %ESC%%RED%[ERROR]%ESC%%NC% Gagal me-restart container
        )
    ) else (
        set SERVICE=%2
        echo %ESC%%BLUE%[INFO]%ESC%%NC% Me-restart service %SERVICE%...
        %COMPOSE_CMD% restart %SERVICE%
        if %ERRORLEVEL% equ 0 (
            echo %ESC%%GREEN%[SUCCESS]%ESC%%NC% Service %SERVICE% berhasil di-restart
        ) else (
            echo %ESC%%RED%[ERROR]%ESC%%NC% Gagal me-restart service %SERVICE%
        )
    )
) else if "%COMMAND%"=="prune" (
    echo %ESC%%YELLOW%[WARNING]%ESC%%NC% Membersihkan resource Docker yang tidak digunakan...
    set /p CONFIRM=Lanjutkan? [y/N] 
    if /i "%CONFIRM%"=="y" (
        docker system prune --volumes -f
        echo %ESC%%GREEN%[SUCCESS]%ESC%%NC% Pembersihan selesai
    ) else (
        echo %ESC%%BLUE%[INFO]%ESC%%NC% Pembersihan dibatalkan
    )
) else if "%COMMAND%"=="status" (
    echo %ESC%%CYAN%=== Status Container ===%ESC%%NC%
    %COMPOSE_CMD% ps

    echo %ESC%%CYAN%=== Health Check ===%ESC%%NC%
    for %%s in (backend frontend) do (
        for /f "tokens=*" %%i in ('docker ps -q -f "name=qiulab-%%s"') do (
            set CONTAINER_ID=%%i
        )
        if defined CONTAINER_ID (
            for /f "tokens=*" %%h in ('docker inspect --format "{{.State.Health.Status}}" !CONTAINER_ID! 2^>nul') do (
                set HEALTH=%%h
            )
            if defined HEALTH (
                if "!HEALTH!"=="healthy" (
                    echo %%s: %ESC%%GREEN%!HEALTH!%ESC%%NC%
                ) else (
                    echo %%s: %ESC%%YELLOW%!HEALTH!%ESC%%NC%
                )
            ) else (
                echo %%s: %ESC%%YELLOW%no health check%ESC%%NC%
            )
        ) else (
            echo %%s: %ESC%%RED%tidak berjalan%ESC%%NC%
        )
        set "CONTAINER_ID="
        set "HEALTH="
    )
) else if "%COMMAND%"=="help" (
    call :show_help
) else (
    echo %ESC%%RED%[ERROR]%ESC%%NC% Perintah tidak dikenal: %COMMAND%
    call :show_help
    exit /b 1
)

endlocal 