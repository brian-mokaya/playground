"""
Motor Control Module for ESP32
Handles motor kinematics and command execution.
"""

import machine
import utime


class MotorController:
    def __init__(self):
        # GPIO pin configuration
        self.left_forward_pin = 5
        self.left_backward_pin = 18
        self.right_forward_pin = 19
        self.right_backward_pin = 21
        self.left_pwm_pin = 12
        self.right_pwm_pin = 13

        # Initialize pins
        self.left_forward = None
        self.left_backward = None
        self.right_forward = None
        self.right_backward = None
        self.left_pwm = None
        self.right_pwm = None

    def initialize(self):
        """Initialize motor GPIO pins and PWM."""
        try:
            self.left_forward = machine.Pin(self.left_forward_pin, machine.Pin.OUT)
            self.left_backward = machine.Pin(
                self.left_backward_pin, machine.Pin.OUT
            )
            self.right_forward = machine.Pin(
                self.right_forward_pin, machine.Pin.OUT
            )
            self.right_backward = machine.Pin(
                self.right_backward_pin, machine.Pin.OUT
            )

            self.left_pwm = machine.PWM(
                machine.Pin(self.left_pwm_pin), freq=1000, duty=512
            )
            self.right_pwm = machine.PWM(
                machine.Pin(self.right_pwm_pin), freq=1000, duty=512
            )

            print("[Motor] Initialized")
        except Exception as e:
            print(f"[Motor] Initialization error: {e}")
            raise

    def move_forward(self, distance):
        """Move forward by distance units."""
        try:
            print(f"[Motor] Moving forward {distance} units")
            self.left_forward.on()
            self.right_forward.on()
            self.left_backward.off()
            self.right_backward.off()

            # Simple timing-based movement
            duration = (distance / 100) * 0.5  # Scale factor
            utime.sleep(duration)
            self.stop()
        except Exception as e:
            print(f"[Motor] move_forward error: {e}")

    def move_backward(self, distance):
        """Move backward by distance units."""
        try:
            print(f"[Motor] Moving backward {distance} units")
            self.left_backward.on()
            self.right_backward.on()
            self.left_forward.off()
            self.right_forward.off()

            duration = (distance / 100) * 0.5
            utime.sleep(duration)
            self.stop()
        except Exception as e:
            print(f"[Motor] move_backward error: {e}")

    def spin_left(self, degrees):
        """Spin left by degrees."""
        try:
            print(f"[Motor] Spinning left {degrees} degrees")
            self.left_backward.on()
            self.right_forward.on()
            self.left_forward.off()
            self.right_backward.off()

            duration = (degrees / 360) * 1.0  # Scale factor
            utime.sleep(duration)
            self.stop()
        except Exception as e:
            print(f"[Motor] spin_left error: {e}")

    def spin_right(self, degrees):
        """Spin right by degrees."""
        try:
            print(f"[Motor] Spinning right {degrees} degrees")
            self.left_forward.on()
            self.right_backward.on()
            self.left_backward.off()
            self.right_forward.off()

            duration = (degrees / 360) * 1.0
            utime.sleep(duration)
            self.stop()
        except Exception as e:
            print(f"[Motor] spin_right error: {e}")

    def set_speed(self, left_speed, right_speed):
        """Set motor speeds (0-1023)."""
        try:
            self.left_pwm.duty(left_speed)
            self.right_pwm.duty(right_speed)
            print(f"[Motor] Speed set: L={left_speed}, R={right_speed}")
        except Exception as e:
            print(f"[Motor] set_speed error: {e}")

    def stop(self):
        """Stop all motors."""
        try:
            self.left_forward.off()
            self.left_backward.off()
            self.right_forward.off()
            self.right_backward.off()
            print("[Motor] Stopped")
        except Exception as e:
            print(f"[Motor] stop error: {e}")

    def cleanup(self):
        """Cleanup motor resources."""
        self.stop()
        if self.left_pwm:
            self.left_pwm.deinit()
        if self.right_pwm:
            self.right_pwm.deinit()
