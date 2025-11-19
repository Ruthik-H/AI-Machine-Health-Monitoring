
/** P3T1755 temperature sensor operation sample
 *  
 *  This sample code is showing P3T1755 temperature sensor operation with interrupt.
 *  "T_HIGH" and "T_LOW" are set to generate interrupt.
 *  
 *  
 *  NOTE: To run this sample code, a timer library "MsTimer2" is needed to be installed
 *  NOTE: For use of evaluation board:P3T1755DP-ARD, short D9 and D2 pins on Arduino Shield connector
 *
 *  @author  Tedd OKANO
 *
 *  Released under the MIT license License
 *
 *  About P3T1085:
 *    https://www.nxp.com/products/sensors/ic-digital-temperature-sensors/i3c-ic-bus-0-5-c-accurate-digital-temperature-sensor:P3T1085UK
 */

#include <P3T1755.h>
#include <MsTimer2.h>

P3T1755 sensor;

const uint8_t interruptPin = 2;
bool int_flag = false;
bool tim_flag = false;

void setup() {
  Serial.begin(9600);
  while (!Serial)
    ;

  Wire.begin();

  pinMode(interruptPin, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(interruptPin), pin_int_callback, FALLING);

  float temp = sensor.temp();

  sensor.thresholds(temp + 1, temp + 2);
  sensor.os_mode(P3T1755::INTERRUPT);

  Serial.println("");
  Serial.println("*  NOTE: To run this sample code, a timer library \"MsTimer2\" is needed to be installed");
  Serial.println("*  NOTE: For use of evaluation board:P3T1755DP-ARD, short D9 and D2 pins on Arduino Shield connector");

  Serial.println("\n***** Hello, P3T1755! *****");
  Serial.print("Temperature at start: ");
  Serial.println(temp);

  Serial.print("Setting: Tos = ");
  Serial.print(temp + 2, 4);
  Serial.print(" / Thyst = ");
  Serial.println(temp + 1, 4);

  MsTimer2::set(1000, timer_callback);
  MsTimer2::start();
}

void pin_int_callback() {
  int_flag = true;
  //  sensor.clear();
}

void timer_callback() {
  tim_flag = true;
}

void loop() {
  if (tim_flag) {
    tim_flag = false;
    Serial.println(sensor.temp(), 4);
  }

  if (int_flag) {
    int_flag = false;
    Serial.println("Interrupt happened");
  }
}
