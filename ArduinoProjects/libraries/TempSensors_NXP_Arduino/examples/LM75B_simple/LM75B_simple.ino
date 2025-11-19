/** LM75B temperature sensor operation sample
 *  
 *  This sample code is showing LM75B temperature sensor operation. 
 *
 *  @author  Tedd OKANO
 *
 *  Released under the MIT license License
 *
 *  About LM75B:
 *    https://www.nxp.com/products/sensors/i3c-ic-digital-temp-sensors/digital-temperature-sensor-and-thermal-watchdog:LM75B
 */


#include <LM75B.h>

LM75B sensor;

void setup() {
  Serial.begin(9600);
  while (!Serial)
    ;

  Wire.begin();

  Serial.println("\r***** Hello, LM75B! *****");
}

void loop() {
  float t = sensor.temp();

  Serial.println(t, 3);
  delay(1000);
}
