/** PCT2075 temperature sensor operation sample
 *  
 *  This sample code is showing PCT2075 temperature sensor operation with interrupt.
 *  "Tos" and "Thyst" are set to generate interrupt.
 *
 *  NOTE: This sample code is intended to use on the evaluation board:PCT2075DP-ARD. 
 *        The board has interrupt pin on D2 and heater control on D3 of Arduino Shield connector. 
 *
 *  @author  Tedd OKANO
 *
 *  Released under the MIT license License
 *
 *  About PCT2075:
 *    https://www.nxp.com/products/sensors/ic-digital-temperature-sensors/ic-bus-fm-plus-1-degree-c-accuracy-digital-temperature-sensor-and-thermal-watchdog:PCT2075
 */

#include <PCT2075.h>

PCT2075 sensor;

const uint8_t interruptPin = 2;
const uint8_t heaterPin = 3;
bool heater = true;
bool int_flag = false;

void setup() {
  Serial.begin(9600);
  while (!Serial)
    ;

  Wire.begin();

  pinMode(heaterPin, OUTPUT);

  pinMode(interruptPin, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(interruptPin), callback, FALLING);

  float temp = sensor.temp();

  sensor.thresholds(temp + 1, temp + 2);
  sensor.os_mode(PCT2075::INTERRUPT);

  Serial.println("\n***** Hello, PCT2075! *****");
  Serial.print("Temperature at start: ");
  Serial.println(temp);

  Serial.print("Setting: Tos = ");
  Serial.print(temp + 2, 3);
  Serial.print(" / Thyst = ");
  Serial.println(temp + 1, 3);

  digitalWrite(heaterPin, heater);
}

void callback() {
  int_flag = true;
}

void loop() {
  Serial.print("heater: ");
  Serial.print(heater ? "ON   " : "OFF  ");
  Serial.println(sensor.temp(), 3);

  if (int_flag) {
    int_flag = false;
    heater = !heater;
    digitalWrite(heaterPin, heater);
  }
  delay(1000);
}
