.PHONY: help dev start stop db/push db/seed lint test worker clean

help:
	@echo "Available targets:"
	@echo "  make dev       - Start development environment"
	@echo "  make start     - Start production environment"
	@echo "  make stop      - Stop all services"
	@echo "  make db/push   - Push database schema changes"
	@echo "  make db/seed   - Seed database with demo data"
	@echo "  make lint      - Run linter"
	@echo "  make test      - Run tests"
	@echo "  make worker    - Start background worker"
	@echo "  make clean     - Clean generated files"

dev:
	docker compose -f docker/compose.yaml up -d
	@echo "Development environment started. App will be available at http://localhost:8000"

start:
	NODE_ENV=production docker compose -f docker/compose.yaml up -d
	@echo "Production environment started."

stop:
	docker compose -f docker/compose.yaml down

db/push:
	pnpm db:push

db/seed:
	pnpm tsx src/server/scripts/seed.ts

lint:
	pnpm lint

test:
	@echo "Tests not yet implemented"

worker:
	pnpm tsx src/server/workers/agent-worker.ts

clean:
	rm -rf node_modules .next dist
	pnpm install
