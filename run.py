"""Точка входа для локального запуска «Научного клубка».

    py run.py            — запустить сервер на http://127.0.0.1:8000
    py run.py --reload   — с автоперезагрузкой при изменениях
"""
import sys

import uvicorn

if __name__ == "__main__":
    reload = "--reload" in sys.argv
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=reload)
