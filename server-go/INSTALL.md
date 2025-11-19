# Установка Go на Windows

## Шаг 1: Скачать Go

1. Перейдите на https://go.dev/dl/
2. Скачайте последнюю версию для Windows (например, `go1.21.x.windows-amd64.msi`)

## Шаг 2: Установить Go

1. Запустите скачанный `.msi` файл
2. Следуйте инструкциям установщика
3. Go будет установлен в `C:\Program Files\Go` по умолчанию

## Шаг 3: Проверить установку

Откройте новый терминал PowerShell и выполните:

```powershell
go version
```

Должна отобразиться версия Go, например: `go version go1.21.5 windows/amd64`

## Шаг 4: Установить зависимости проекта

После установки Go, перейдите в директорию проекта и установите зависимости:

```powershell
cd D:\С\work\skryabin-ink\server-go
go mod download
```

## Шаг 5: Настроить переменные окружения

Создайте файл `.env` в директории `server-go` на основе `env.example`:

```env
BOT_TOKEN=your_telegram_bot_token_here
DATABASE_URL=postgres://user:password@localhost:5432/skryabin_ink?sslmode=disable
PORT=3000
CORS_ORIGIN=http://localhost:5173
```

## Шаг 6: Запустить сервер

```powershell
go run main.go
```

## Альтернатива: Использовать Chocolatey

Если у вас установлен Chocolatey, можно установить Go одной командой:

```powershell
choco install golang
```


