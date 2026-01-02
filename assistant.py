#!/usr/bin/env python3
"""
Simple Personal Assistant using OpenAI API
"""
import os
import sys
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def main():
    # Initialize OpenAI client
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("Error: OPENAI_API_KEY not found in environment variables.")
        print("Please create a .env file with your OpenAI API key:")
        print("OPENAI_API_KEY=your-api-key-here")
        sys.exit(1)

    client = OpenAI(api_key=api_key)

    # Conversation history
    messages = [
        {"role": "system", "content": "You are a helpful personal assistant. Be concise and friendly."}
    ]

    print("Personal Assistant (type 'exit' or 'quit' to end)\n")
    print("-" * 50)

    while True:
        # Get user input
        try:
            user_input = input("\nYou: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\n\nGoodbye!")
            break

        if not user_input:
            continue

        # Check for exit commands
        if user_input.lower() in ['exit', 'quit', 'bye']:
            print("\nGoodbye!")
            break

        # Add user message to history
        messages.append({"role": "user", "content": user_input})

        try:
            # Get response from OpenAI
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=messages,
                temperature=0.7,
                max_tokens=500
            )

            # Extract assistant's reply
            assistant_reply = response.choices[0].message.content

            # Add assistant's reply to history
            messages.append({"role": "assistant", "content": assistant_reply})

            # Display response
            print(f"\nAssistant: {assistant_reply}")

        except Exception as e:
            print(f"\nError: {e}")
            # Remove the user message if request failed
            messages.pop()

if __name__ == "__main__":
    main()
