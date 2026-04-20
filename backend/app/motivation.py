import random

# ─── Quotes ───────────────────────────────────────────────────────────────────
QUOTES = [
    "The secret of getting ahead is getting started. — Mark Twain",
    "It always seems impossible until it's done. — Nelson Mandela",
    "Don't watch the clock; do what it does. Keep going. — Sam Levenson",
    "The future depends on what you do today. — Mahatma Gandhi",
    "Believe you can and you're halfway there. — Theodore Roosevelt",
    "You don't have to be great to start, but you have to start to be great. — Zig Ziglar",
    "Focus on being productive instead of busy. — Tim Ferriss",
    "Push yourself, because no one else is going to do it for you.",
    "Great things never come from comfort zones.",
    "Do something today that your future self will thank you for.",
    "Wake up with determination. Go to bed with satisfaction.",
    "Either you run the day or the day runs you. — Jim Rohn",
    "The way to get started is to quit talking and begin doing. — Walt Disney",
    "Energy and persistence conquer all things. — Benjamin Franklin",
    "Start where you are. Use what you have. Do what you can. — Arthur Ashe",
]

# ─── Greeting messages ────────────────────────────────────────────────────────
GREETINGS = [
    "Hey {name}! Ready to crush your tasks today? 💪",
    "Welcome back, {name}! Let's make today productive! 🚀",
    "Hi {name}! You've got this — one task at a time! ✨",
    "Good to see you, {name}! Your goals are waiting! 🎯",
    "Hello {name}! Every great day starts with a plan! 📋",
    "Hey {name}! Small steps lead to big achievements! 🌟",
    "Welcome {name}! Today is a great day to be productive! ⚡",
]

# ─── Completion reward messages ───────────────────────────────────────────────
REWARDS = [
    "🎉 Amazing work, {name}! Task completed like a champion!",
    "🏆 You crushed it, {name}! Keep up the great work!",
    "⭐ Brilliant, {name}! One more task down, keep going!",
    "🔥 On fire, {name}! That's how winners get things done!",
    "💪 Incredible, {name}! You're unstoppable today!",
    "🌟 Superstar move, {name}! Task complete — you rock!",
    "✅ Well done, {name}! Your hard work is paying off!",
    "🚀 Outstanding, {name}! Nothing can stop you now!",
    "🎯 Bullseye, {name}! You hit your target perfectly!",
    "💎 Excellent, {name}! You're a productivity gem!",
]

# ─── Helper functions ─────────────────────────────────────────────────────────

def get_greeting(name: str) -> str:
    """Personalized greeting with user's name."""
    template = random.choice(GREETINGS)
    return template.format(name=name or "there")


def get_reward(name: str) -> str:
    """Personalized reward message on task completion."""
    template = random.choice(REWARDS)
    return template.format(name=name or "Champion")


def get_random_quote() -> str:
    """Return a random motivational quote."""
    return random.choice(QUOTES)


def get_motivation(name: str) -> dict:
    """Full motivation response with greeting and quote."""
    return {
        "message": get_greeting(name),
        "quote":   get_random_quote(),
    }