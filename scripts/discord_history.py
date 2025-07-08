import discord
import json
import os
import time

try:
    with open("discord_token.txt", "r") as f:
        TOKEN = f.read().strip()
except FileNotFoundError:
    print("Error: discord_token.txt not found. Please create this file and paste your token in it.")
    TOKEN = None

CHANNEL_ID = 1007459944993406986
PER_MESSAGE_SLEEP = 0.1

class MyClient(discord.Client):
    async def on_ready(self):
        print(f'Logged on as {self.user}!')

        channel = self.get_channel(CHANNEL_ID)
        if not channel:
            print(f"Error: Channel with ID {CHANNEL_ID} not found.")
            await self.close()
            return

        history = []
        message_count = 0
        async for message in channel.history(limit=None):
            message_count += 1
            if message_count % 20 == 0:
                print(f"Processed {message_count} messages...")

            message_data = {
                "timestamp": message.created_at.isoformat(),
                "author": {
                    "name": message.author.name,
                    "discriminator": message.author.discriminator,
                    "id": message.author.id
                },
                "content": message.content,
                "reactions": []
            }
            for reaction in message.reactions:
                message_data["reactions"].append({
                    "emoji": str(reaction.emoji),
                    "count": reaction.count,
                })
            history.append(message_data)
            time.sleep(PER_MESSAGE_SLEEP)  # Sleep to avoid hitting rate limits

        with open("channel_history.json", "w") as f:
            json.dump(history, f, indent=4)

        print("Message history saved to channel_history.json")
        await self.close()

client = MyClient()

if TOKEN is None:
    print("Error: DISCORD_TOKEN environment variable not set.")
else:
    try:
        client.run(TOKEN)
    except discord.errors.LoginFailure:
        print("Error: Invalid Discord token.")
