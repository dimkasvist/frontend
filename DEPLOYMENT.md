# Frontend Deployment Guide

Этот репозиторий содержит фронтенд приложения на Next.js 16.

## 📋 Предварительные требования

### GitHub Secrets

В настройках репозитория (Settings → Secrets and variables → Actions) добавьте:

- **SSH_HOST** - IP адрес или домен вашего Ubuntu сервера
- **SSH_USERNAME** - имя пользователя на сервере (обычно root или ubuntu)
- **SSH_PRIVATE_KEY** - приватный SSH ключ для доступа к серверу
- **SSH_PORT** - порт SSH (по умолчанию 22, опционально)

## 🚀 Автоматический деплой (CI/CD)

Создан GitHub Actions workflow в `.github/workflows/deploy.yml`.

### Когда запускается:
- Автоматически при push в ветки `main` или `master`
- Вручную через GitHub Actions → Deploy Frontend → Run workflow

### Процесс деплоя:
1. ✅ Собирает Docker образ фронтенда
2. ✅ Публикует образ в GitHub Container Registry (ghcr.io)
3. ✅ Подключается к серверу по SSH
4. ✅ Скачивает новый образ
5. ✅ Перезапускает контейнер фронтенда
6. ✅ Очищает старые образы

## 🛠️ Локальная разработка

```bash
# Установка зависимостей
npm install

# Запуск dev сервера
npm run dev

# Сборка
npm run build

# Запуск production
npm start
```

## 🐳 Docker сборка локально

```bash
# Сборка образа
docker build -t dimkasvist-frontend .

# Запуск контейнера
docker run -p 3000:3000 dimkasvist-frontend
```

## 📦 Структура проекта

```
frontend/
├── src/                  # Исходный код
│   ├── app/             # Next.js App Router
│   ├── components/      # React компоненты
│   ├── lib/            # Утилиты и API клиент
│   └── types/          # TypeScript типы
├── public/             # Статические файлы
├── Dockerfile          # Docker конфигурация
├── .dockerignore       # Исключения для Docker
├── next.config.ts      # Конфигурация Next.js
├── package.json        # Зависимости
└── .github/workflows/  # CI/CD workflows
```

## 🔧 Переменные окружения

### Для разработки (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Для production (на сервере)
```env
NEXT_PUBLIC_API_URL=http://backend:8080
NODE_ENV=production
```

## 📡 API Integration

Фронтенд обращается к бэкенду через переменную `NEXT_PUBLIC_API_URL`.

В `src/lib/api.ts`:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
```

## 🔍 Мониторинг на сервере

```bash
# Статус контейнера
docker compose ps frontend

# Логи фронтенда
docker compose logs -f frontend

# Перезапуск
docker compose restart frontend
```

## 🆘 Troubleshooting

### Образ не обновляется
```bash
ssh user@server
cd /opt/dimkasvist
docker compose pull frontend
docker compose up -d frontend
```

### Ошибки сборки
Проверьте логи в GitHub Actions → вкладка Actions → последний запуск

### Порт занят
```bash
# Проверьте что запущено на порту 3000
sudo lsof -i :3000
```

## 📚 Дополнительные ресурсы

- [Next.js Documentation](https://nextjs.org/docs)
- [Docker Documentation](https://docs.docker.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
