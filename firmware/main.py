"""
ESP32 Main Entry Point
Subscribes to MQTT topics, dispatches commands, and manages telemetry.
"""

import machine
import utime
from config import BROKER_IP, BROKER_PORT, LISTEN_TOPIC, PUBLISH_TOPIC
from mqtt_client import MQTTClient
from motor_control import MotorController
import json


class ESP32Application:
    def __init__(self):
        self.mqtt = None
        self.motor = MotorController()
        self.last_telemetry = utime.time()
        self.telemetry_interval = 5  # seconds
        self.running = True

    async def initialize(self):
        """Initialize MQTT and motor controllers."""
        print("[ESP32] Initializing...")

        # Initialize motors
        self.motor.initialize()

        # Connect to MQTT broker
        self.mqtt = MQTTClient(BROKER_IP, BROKER_PORT)
        self.mqtt.connect()
        self.mqtt.subscribe(LISTEN_TOPIC, self.on_command)

        print("[ESP32] Initialization complete")

    async def run(self):
        """Main event loop."""
        print("[ESP32] Starting main loop")
        try:
            while self.running:
                # Check for incoming MQTT messages
                self.mqtt.check_messages()

                # Send telemetry periodically
                now = utime.time()
                if now - self.last_telemetry > self.telemetry_interval:
                    self.send_telemetry()
                    self.last_telemetry = now

                # Brief sleep to allow other tasks
                utime.sleep_ms(100)
        except KeyboardInterrupt:
            print("[ESP32] Shutting down")
            self.shutdown()

    def on_command(self, topic, message):
        """Handle incoming MQTT command."""
        try:
            print(f"[ESP32] Received message on {topic}: {message}")

            # Parse JSON command
            cmd_data = json.loads(message)
            command = cmd_data.get("command")
            parameters = cmd_data.get("parameters", {})

            self.execute_command(command, parameters)
        except json.JSONDecodeError:
            print(f"[ESP32] JSON decode error: {message}")
            self.send_error("json_decode_error")
        except Exception as e:
            print(f"[ESP32] Error processing command: {e}")
            self.send_error(str(e))

    def execute_command(self, command, parameters):
        """Execute a command."""
        try:
            if command == "move_forward":
                distance = parameters.get("distance", 100)
                self.motor.move_forward(distance)
                status = f"Moved forward {distance} units"

            elif command == "move_backward":
                distance = parameters.get("distance", 100)
                self.motor.move_backward(distance)
                status = f"Moved backward {distance} units"

            elif command == "spin_left":
                degrees = parameters.get("degrees", 90)
                self.motor.spin_left(degrees)
                status = f"Spun left {degrees} degrees"

            elif command == "spin_right":
                degrees = parameters.get("degrees", 90)
                self.motor.spin_right(degrees)
                status = f"Spun right {degrees} degrees"

            elif command == "stop":
                self.motor.stop()
                status = "Motor stopped"

            elif command == "execute_python":
                code = parameters.get("python_code", "")
                exec(code)
                status = "Python code executed"

            else:
                status = f"Unknown command: {command}"

            print(f"[ESP32] {status}")
            self.send_status(status)

        except Exception as e:
            print(f"[ESP32] Command execution error: {e}")
            self.send_error(str(e))

    def send_telemetry(self):
        """Send device telemetry."""
        try:
            telemetry = {
                "type": "status",
                "state": "running",
                "battery": 85,
                "temperature": self.get_temperature(),
                "uptime": utime.time(),
                "timestamp": utime.time(),
            }
            message = json.dumps(telemetry)
            self.mqtt.publish(PUBLISH_TOPIC, message)
        except Exception as e:
            print(f"[ESP32] Telemetry error: {e}")

    def send_status(self, message):
        """Send status message."""
        try:
            status = {
                "type": "status",
                "message": message,
                "timestamp": utime.time(),
            }
            self.mqtt.publish(PUBLISH_TOPIC, json.dumps(status))
        except Exception as e:
            print(f"[ESP32] Status send error: {e}")

    def send_error(self, error_message):
        """Send error message."""
        try:
            error = {
                "type": "error",
                "error_code": 1,
                "message": error_message,
                "timestamp": utime.time(),
            }
            self.mqtt.publish(PUBLISH_TOPIC, json.dumps(error))
        except Exception as e:
            print(f"[ESP32] Error send error: {e}")

    def get_temperature(self):
        """Get internal temperature."""
        try:
            import esp32
            return (esp32.raw_temperature() - 32) / 1.8
        except Exception:
            return 0

    def shutdown(self):
        """Cleanup and shutdown."""
        print("[ESP32] Shutting down")
        self.running = False
        if self.motor:
            self.motor.stop()
        if self.mqtt:
            self.mqtt.disconnect()


async def main():
    """Application entry point."""
    app = ESP32Application()
    await app.initialize()
    await app.run()


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
