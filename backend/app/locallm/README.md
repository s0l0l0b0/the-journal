# locallm
This directory will have local language model implementations

## Requirements

- Make sure you have `ollama` installed in your system.
- Make sure you already pulled `qwen3:0.6b` model in ollama using `ollama pull qwen3:0.6b` command
- Make sure you have ollama up and running with `ollama serve` command.

## Todo
- [x] Integrate with `LiteLM` and `ollama` to create a simple summarizer
- [x] Spawn ollama as subprocess `ollama serve` from fastapi lifespan to start with backend application
- [ ] After ollama serve start with subprocess check if our requried model qwen3:0.6b is preset or not in local ollama if not pull it
- [ ] Cloud LLM Provider integration (use can choose his own provider api key and model to use instead of default localLM) 