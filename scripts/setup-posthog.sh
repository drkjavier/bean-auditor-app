#!/bin/bash
# Setup de PostHog local con Docker

set -e

echo "=== PostHog Local Setup ==="
echo ""

# Verificar Docker
if ! command -v docker &> /dev/null; then
  echo "Error: Docker no está instalado"
  echo "Instala Docker Desktop: https://docs.docker.com/get-docker/"
  exit 1
fi

if ! docker info &> /dev/null; then
  echo "Error: Docker no está corriendo"
  echo "Inicia Docker Desktop y vuelve a intentar"
  exit 1
fi

# Detectar comando Docker Compose
if docker compose version &> /dev/null; then
  DOCKER_COMPOSE="docker compose"
else
  DOCKER_COMPOSE="docker-compose"
fi

# Verificar si PostHog ya está corriendo
if curl -f http://localhost:8000/health &> /dev/null; then
  echo "PostHog ya está corriendo en http://localhost:8000"
  echo ""
  echo "Si necesitas reiniciar, ejecuta:"
  echo "  $DOCKER_COMPOSE -f docker-compose.posthog.yml down"
  echo "  $DOCKER_COMPOSE -f docker-compose.posthog.yml up -d"
  exit 0
fi

# Levantar contenedores
echo "Levantando contenedores Docker..."
$DOCKER_COMPOSE -f docker-compose.posthog.yml up -d

echo ""
echo "Esperando a que PostHog esté listo..."
sleep 15

# Verificar salud
echo "Verificando salud de PostHog..."
for i in {1..12}; do
  if curl -f http://localhost:8000/health &> /dev/null; then
    echo ""
    echo "=== PostHog está corriendo en http://localhost:8000 ==="
    echo ""
    echo "Próximos pasos:"
    echo "1. Abre http://localhost:8000 en tu navegador"
    echo "2. Crea una cuenta de administrador"
    echo "3. Ve a Settings → Project API Keys"
    echo "4. Copia el API key"
    echo "5. Actualiza POSTHOG_API_KEY y VITE_POSTHOG_API_KEY en .env"
    echo "6. Reinicia el servidor de desarrollo"
    echo ""
echo "Comandos útiles:"
echo "  Ver logs:           $DOCKER_COMPOSE -f docker-compose.posthog.yml logs -f"
echo "  Detener:            $DOCKER_COMPOSE -f docker-compose.posthog.yml down"
echo "  Eliminar datos:     $DOCKER_COMPOSE -f docker-compose.posthog.yml down -v"
    exit 0
  fi
  echo -n "."
  sleep 5
done

echo ""
echo "Error: PostHog no respondió después de 60 segundos"
echo "Revisa los logs: $DOCKER_COMPOSE -f docker-compose.posthog.yml logs"
exit 1
