# Developer Makefile
.PHONY: install test lint format run

install:
	python -m pip install --upgrade pip
	pip install -r requirements.txt || true
	pip install -r requirements-dev.txt || true

test:
	python -m pytest --maxfail=1 -q

lint:
	ruff check .
	black --check .
	isort --check .

format:
	black .
	isort .

run:
	python app.py
