#!/bin/bash
# ============================================================
# deploy.sh — Script de despliegue en servidor Ubuntu
# Ubicación: sistema-cursos-fhce/deploy.sh
#
# Uso: bash deploy.sh
# ============================================================

set -e  # Detiene el script si cualquier comando falla

echo "========================================"
echo "  Desplegando Sistema Cursos FHCE"
echo "========================================"

# 1. Verificar que existe el archivo .env
if [ ! -f ".env" ]; then
    echo "❌ ERROR: No existe el archivo .env"
    echo "   Copiá .env.example a .env y completá los valores reales"
    exit 1
fi

# 2. Crear directorios de datos si no existen
echo "📁 Creando directorios de datos..."
mkdir -p data/certificados data/uploads

# 3. Bajar los contenedores anteriores (sin borrar los datos)
echo "🛑 Deteniendo contenedores anteriores..."
docker compose down

# 4. Construir las imágenes y levantar todo
echo "🔨 Construyendo imágenes y levantando servicios..."
docker compose up -d --build

# 5. Esperar y verificar
echo "⏳ Esperando que los servicios levanten..."
sleep 15

echo ""
echo "📊 Estado de los servicios:"
docker compose ps

echo ""
echo "✅ Despliegue completado"
echo "   Frontend: http://$(hostname -I | awk '{print $1}')"
echo "   Logs:     docker compose logs -f"