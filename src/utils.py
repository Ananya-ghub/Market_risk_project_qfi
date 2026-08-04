"""
Utility Functions
"""

import os

def create_directories():
    folders = [
        "data",
        "data/raw",
        "data/processed",
        "outputs",
        "outputs/plots"
    ]

    for folder in folders:
        os.makedirs(folder, exist_ok=True)

    print("Project folders are ready!")
    