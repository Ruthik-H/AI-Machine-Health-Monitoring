/** P3T1085 temperature sensor operation sample
 *  
 *  This sample code is showing P3T1085 temperature sensor operation with interrupt.
 *  "Tos" and "Thyst" are set to generate interrupt.   
 *
 *  @author  Tedd OKANO
 *
 *  Released under the MIT license License
 *
 *  About P3T1085:
 *    https://www.nxp.com/products/sensors/ic-digital-temperature-sensors/i3c-ic-bus-0-5-c-accurate-digital-temperature-sensor:P3T1085UK
 */

#include <P3T1085.h>

P3T1085 sensor(Wire1);

void setup() {
  Serial.begin(9600);
  while (!Serial)
    ;

  Wire.begin();

  Serial.begin(9600);
  while (!Serial)
    ;

  Wire.begin();

  Serial.println("\n***** Hello, P3T1085! *****");
}

void loop() {
  float t = sensor.temp();

  Serial.println(t, 4);
  delay(1000);
}
