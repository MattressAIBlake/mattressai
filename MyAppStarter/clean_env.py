#!/usr/bin/env python3

import re

# Read the original .env file
with open('.env', 'r') as file:
    content = file.read()

# Function to clean up a multi-line value
def clean_value(match):
    key = match.group(1)
    value = match.group(2).replace('\n', '').strip()
    # Remove the trailing % sign if it exists
    if value.endswith('%'):
        value = value[:-1]
    return f"{key}={value}"

# Pattern to match env variables that might span multiple lines
pattern = r'(^[A-Za-z0-9_]+=)([^#\n].*?)(?=^[A-Za-z0-9_]+=|\Z)'

# Clean up the content using regex with DOTALL flag to match across lines
cleaned_content = re.sub(pattern, clean_value, content, flags=re.MULTILINE | re.DOTALL)

# Special case for variables at the end of the file
if cleaned_content.endswith('%'):
    cleaned_content = cleaned_content[:-1]

# Write the cleaned content back to the file
with open('.env', 'w') as file:
    file.write(cleaned_content)

print("Environment file has been cleaned up successfully!") 