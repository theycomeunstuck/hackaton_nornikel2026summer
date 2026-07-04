"""Точка входа для локального запуска «Научного клубка».

    py run.py                          # http://127.0.0.1:8000
    py run.py --reload                 # автоперезагрузка при изменениях
    py run.py --host 0.0.0.0 --port 8080
    py run.py --db D:/data/index.sqlite  # внешний RAG-индекс (иначе rag/data/index.sqlite)

Переменные окружения (альтернатива флагам):
    HOST, PORT, RAG_DB_PATH
"""
import argparse
import os

import uvicorn


def main() -> None:
    ap = argparse.ArgumentParser(description="Научный клубок — Evidence Engine")
    ap.add_argument("--host", default=os.environ.get("HOST", "127.0.0.1"),
                    help="Адрес прослушивания (по умолчанию 127.0.0.1)")
    ap.add_argument("--port", type=int, default=int(os.environ.get("PORT", "8000")),
                    help="Порт (по умолчанию 8000)")
    ap.add_argument("--reload", action="store_true",
                    help="Автоперезагрузка при изменении кода")
    ap.add_argument("--db", default=None,
                    help="Путь к RAG-индексу (index.sqlite). "
                         "По умолчанию rag/data/index.sqlite; без индекса — demo-режим.")
    args = ap.parse_args()

    # Путь к индексу читается мостом из RAG_DB_PATH на старте приложения.
    if args.db:
        os.environ["RAG_DB_PATH"] = args.db

    uvicorn.run("app.main:app", host=args.host, port=args.port, reload=args.reload)


if __name__ == "__main__":
    main()
