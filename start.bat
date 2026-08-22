@echo off
chcp 65001 >nul
color 0A
setlocal

echo ===================================================
echo       MiniMax 多模态 AI 客户端 - 一键启动脚本
echo ===================================================
echo.

:: 检查 Node.js 是否安装
where node >nul 2>nul
if errorlevel 1 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js!
    echo 下载地址: https://nodejs.org/
    pause
    exit /b
)

:: 检查是否安装了依赖
if not exist "node_modules\" (
    echo [提示] 首次运行，正在安装依赖 npm install...
    call npm install
    if errorlevel 1 (
        echo [错误] 依赖安装失败，请检查网络或 npm 配置。
        pause
        exit /b
    )
    echo [成功] 依赖安装完成！
    echo.
)

:: 启动服务
echo [运行] 正在启动 Next.js 本地开发服务器...
echo [提示] 启动成功后，请在浏览器中打开 http://localhost:3000
echo.

:: 尝试在默认浏览器中打开页面（等待3秒让服务器有时间启动）
start "" powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 3; Start-Process 'http://localhost:3000'"

:: 运行开发环境
call npm run dev

pause
