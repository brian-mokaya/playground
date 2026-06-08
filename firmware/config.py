"""
ESP32 Configuration File
Central location for broker IP, topics, and pin assignments.
"""

# MQTT Broker Configuration
BROKER_IP = "192.168.1.100"  # Change to your local broker IP
BROKER_PORT = 1883

# MQTT Topic Configuration
LISTEN_TOPIC = "commands/python"  # Topic to listen for commands
PUBLISH_TOPIC = "telemetry/device"  # Topic for publishing telemetry

# Motor GPIO Pin Configuration
LEFT_FORWARD_PIN = 5
LEFT_BACKWARD_PIN = 18
RIGHT_FORWARD_PIN = 19
RIGHT_BACKWARD_PIN = 21

LEFT_PWM_PIN = 12
RIGHT_PWM_PIN = 13

# Motor Speed Configuration (0-1023)
DEFAULT_SPEED = 512  # 50% speed
MAX_SPEED = 1023
MIN_SPEED = 0

# Timing Configuration
MOVE_TIMEOUT = 30  # Maximum command execution time in seconds
TELEMETRY_INTERVAL = 5  # Seconds between telemetry updates

# Device Configuration
DEVICE_ID = "esp32-robot-001"
DEVICE_NAME = "ESP32 Voice-Controlled Robot"

# Debug and Logging
DEBUG = True
LOG_COMMANDS = True
