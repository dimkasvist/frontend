# Production Environment Variables для Frontend

Создайте файл `.env.production` в корне frontend репозитория со следующим содержимым:

```env
# API Domain
NEXT_PUBLIC_API_URL=https://апи.шагиахметов.рф

# Environment
NODE_ENV=production
```

**Важно:** Этот файл используется при сборке Docker образа для production.

## Punycode форма (если нужна)

```env
NEXT_PUBLIC_API_URL=https://xn--80a1acn3a.xn--80adhg3alboh.xn--p1ai
NODE_ENV=production
```

## Локальное создание файла

```bash
# В папке frontend
echo "NEXT_PUBLIC_API_URL=https://апи.шагиахметов.рф" > .env.production
echo "NODE_ENV=production" >> .env.production
```
