# Local LLM Personal Assistant

A simple terminal-based personal assistant powered by OpenAI's API.

## Features

- Interactive chat interface in your terminal
- Conversation history maintained throughout the session
- Simple and lightweight
- Easy to extend with new capabilities

## Getting Started

### Prerequisites

- Python 3.8 or higher
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Installation

1. Clone this repository or download the files

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file in the project root:
```bash
cp .env.example .env
```

4. Edit `.env` and add your OpenAI API key:
```
OPENAI_API_KEY=your-actual-api-key-here
```

### Usage

Run the assistant:
```bash
python assistant.py
```

To exit the assistant, type `exit`, `quit`, or press `Ctrl+C`.

## Example Interaction

```
Personal Assistant (type 'exit' or 'quit' to end)

--------------------------------------------------

You: What's the capital of France?