import asyncio
import platform
import signal
import subprocess
from typing import Optional

import psutil
from loguru import logger


def _is_ollama_running_sync() -> bool:
    """Synchronous check if Ollama is already running."""
    for proc in psutil.process_iter(["name", "cmdline"]):
        try:
            name = proc.info["name"] or ""
            cmd = " ".join(proc.info.get("cmdline") or [])
            if "ollama" in name.lower() or "ollama" in cmd.lower():
                return True
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue
    return False


async def is_ollama_running() -> bool:
    """Async wrapper for checking Ollama."""
    return await asyncio.to_thread(_is_ollama_running_sync)


async def start_ollama() -> Optional[subprocess.Popen]:
    """Start Ollama asynchronously if not running."""
    if await is_ollama_running():
        logger.info("Ollama already running — skipping startup.")
        return

    logger.info("Starting Ollama server...")
    creationflags = 0
    preexec_fn = None

    if platform.system() == "Windows":
        creationflags = subprocess.CREATE_NEW_PROCESS_GROUP
    else:
        preexec_fn = lambda: signal.signal(signal.SIGINT, signal.SIG_IGN)

    try:
        # Run Popen in thread to avoid blocking
        ollama_process = await asyncio.to_thread(
            subprocess.Popen,
            ["ollama", "serve"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            creationflags=creationflags,
            preexec_fn=preexec_fn,
        )

        await asyncio.sleep(2)
        logger.info("Ollama started.")

        # TODO: Check if ollama3:0.6b model is available, if not, ollama pull it here
        return ollama_process
    except Exception as e:
        logger.warning(f"Failed to start Ollama: {e}")
        return None


async def stop_ollama(ollama_process: subprocess.Popen):
    """Gracefully stop Ollama."""
    if ollama_process and ollama_process.poll() is None:
        logger("Stopping Ollama gracefully...")
        ollama_process.terminate()
        try:
            await asyncio.to_thread(ollama_process.wait, 5)
        except subprocess.TimeoutExpired:
            ollama_process.kill()
        logger.info("Ollama stopped.")
