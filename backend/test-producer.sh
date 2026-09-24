#!/bin/bash

# Script para probar el endpoint de creación de productor
# Uso: ./test-producer.sh o bash test-producer.sh

BASE_URL="http://localhost:3000/api/producers"

echo "📤 Enviando solicitud POST a $BASE_URL..."
echo ""

curl -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d @test-producer.json \
  -v

echo ""
echo ""
echo "✅ Test completado"
