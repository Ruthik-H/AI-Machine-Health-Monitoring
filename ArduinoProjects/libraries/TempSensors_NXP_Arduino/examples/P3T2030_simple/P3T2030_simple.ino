/** P3T2030 temperature sensor operation sample
 *  
 *  This sample code is showing P3T2030 temperature sensor operation.
 *
 *  @author  Tedd OKANO
 *
 *  Released under the MIT license License
 *
 *  About P3T2030:
 *    https://www.nxp.com/products/sensors/i3c-ic-digital-temp-sensors/i3c-ic-bus-2-0-c-accuracy-digital-temperature-sensor:P3T2030xUK
 */

#include <P3T2030.h>

P3T2030 sensor( 0xE4 >> 1 );

void setup() {
  Serial.begin(9600);
  while (!Serial)
    ;

  Wire.begin();

  Serial.println("\n***** Hello, P3T2030! *****");
}

void loop() {
  float t = sensor.temp();

  Serial.println(t, 4);
  delay(1000);
}
