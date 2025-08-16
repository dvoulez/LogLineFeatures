# LogLine Monorepo - Unified Build System

.PHONY: dev build clean test install lint format help
.PHONY: dev-frontend dev-backend dev-contracts
.PHONY: build-frontend build-backend build-contracts
.PHONY: start-frontend start-backend

# Default target
help:
	@echo "LogLine Monorepo Build System"
	@echo ""
	@echo "Development Commands:"
	@echo "  dev              - Start all services in development mode"
	@echo "  dev-frontend     - Start only frontend (browser18)"
	@echo "  dev-backend      - Start only backend (base)"
	@echo "  dev-contracts    - Watch contracts for changes"
	@echo ""
	@echo "Build Commands:"
	@echo "  build            - Build all applications"
	@echo "  build-frontend   - Build frontend only"
	@echo "  build-backend    - Build backend only"
	@echo "  build-contracts  - Build contracts only"
	@echo ""
	@echo "Production Commands:"
	@echo "  start            - Start all services in production mode"
	@echo "  start-frontend   - Start frontend in production"
	@echo "  start-backend    - Start backend in production"
	@echo ""
	@echo "Utility Commands:"
	@echo "  install          - Install all dependencies"
	@echo "  clean            - Clean all build artifacts"
	@echo "  test             - Run all tests"
	@echo "  lint             - Run linting"
	@echo "  format           - Format all code"

# Development - runs all services
dev:
	@echo "🚀 Starting LogLine development environment..."
	pnpm run dev

# Individual development services
dev-frontend:
	@echo "🌐 Starting frontend development..."
	pnpm run dev:frontend

dev-backend:
	@echo "⚙️  Starting backend development..."
	cd apps/base && cargo run

dev-contracts:
	@echo "📋 Watching contracts for changes..."
	pnpm run dev:contracts

# Build everything
build:
	@echo "🔨 Building all applications..."
	pnpm run build

# Individual builds
build-frontend:
	@echo "🌐 Building frontend..."
	pnpm run build:frontend

build-backend:
	@echo "⚙️  Building backend..."
	cd apps/base && cargo build --release

build-contracts:
	@echo "📋 Building contracts..."
	pnpm run build:contracts

# Production start
start:
	@echo "🚀 Starting LogLine in production mode..."
	pnpm run start

start-frontend:
	@echo "🌐 Starting frontend in production..."
	pnpm run start:frontend

start-backend:
	@echo "⚙️  Starting backend in production..."
	cd apps/base && ./target/release/logline-base

# Install dependencies
install:
	@echo "📦 Installing dependencies..."
	pnpm install

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	pnpm run clean
	cd apps/base && cargo clean

# Run tests
test:
	@echo "🧪 Running tests..."
	pnpm run test

# Linting
lint:
	@echo "🔍 Running linters..."
	pnpm run lint

# Format code
format:
	@echo "✨ Formatting code..."
	pnpm run format

# Type checking
type-check:
	@echo "🔍 Type checking..."
	pnpm run type-check

# Development setup (first time)
setup: install build
	@echo "✅ LogLine monorepo setup complete!"
	@echo ""
	@echo "To start development:"
	@echo "  make dev"
	@echo ""
	@echo "To see all commands:"
	@echo "  make help"

# Quick development restart
restart: clean install dev

# Production deployment preparation
deploy-prep: clean install build test
	@echo "🚀 Ready for deployment!"
