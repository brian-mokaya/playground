"""
MQTT Client for MicroPython
Lightweight MQTT wrapper for ESP32.
"""

try:
    from umqtt.simple import MQTTClient as _MQTTClient
except ImportError:
    print("[MQTT] Warning: umqtt not available, using stub")
    _MQTTClient = None


class MQTTClient:
    def __init__(self, broker, port=1883, client_id=None):
        self.broker = broker
        self.port = port
        self.client_id = client_id or "esp32-robot"
        self.client = None
        self.subscriptions = {}
        self.connected = False

    def connect(self):
        """Connect to MQTT broker."""
        try:
            if _MQTTClient is None:
                print("[MQTT] MQTT not available, skipping connection")
                return

            self.client = _MQTTClient(self.client_id, self.broker, self.port)
            self.client.set_callback(self._on_message)
            self.client.connect()
            self.connected = True
            print(f"[MQTT] Connected to {self.broker}:{self.port}")
        except Exception as e:
            print(f"[MQTT] Connection error: {e}")

    def subscribe(self, topic, callback):
        """Subscribe to a topic."""
        try:
            if not self.connected or self.client is None:
                print(f"[MQTT] Not connected, cannot subscribe to {topic}")
                return

            self.subscriptions[topic] = callback
            self.client.subscribe(topic)
            print(f"[MQTT] Subscribed to {topic}")
        except Exception as e:
            print(f"[MQTT] Subscribe error: {e}")

    def publish(self, topic, message):
        """Publish a message."""
        try:
            if not self.connected or self.client is None:
                print(f"[MQTT] Not connected, cannot publish to {topic}")
                return

            if isinstance(message, str):
                message = message.encode()

            self.client.publish(topic, message)
            print(f"[MQTT] Published to {topic}")
        except Exception as e:
            print(f"[MQTT] Publish error: {e}")

    def check_messages(self):
        """Check for incoming messages."""
        try:
            if self.connected and self.client:
                self.client.check_msg()
        except Exception as e:
            print(f"[MQTT] Error checking messages: {e}")

    def _on_message(self, topic, message):
        """Internal message handler."""
        topic_str = topic.decode() if isinstance(topic, bytes) else topic
        message_str = message.decode() if isinstance(message, bytes) else message

        if topic_str in self.subscriptions:
            callback = self.subscriptions[topic_str]
            try:
                callback(topic_str, message_str)
            except Exception as e:
                print(f"[MQTT] Callback error for {topic_str}: {e}")

    def disconnect(self):
        """Disconnect from broker."""
        try:
            if self.client:
                self.client.disconnect()
            self.connected = False
            print("[MQTT] Disconnected")
        except Exception as e:
            print(f"[MQTT] Disconnect error: {e}")
