# TempSensor_NXP_Arduino
Temperature sensor device operation sample code for [Arduino](https://www.arduino.cc) 

> **Note**
This library works with [`I2C_device`](https://github.com/teddokano/I2C_device_Arduino) library together. Please be sure the `I2C_device` library is imported in your environment before trying to build. 

![Boards](https://github.com/teddokano/additional_files/blob/main/TempSensor_NXP_Arduino/TempSensors.jpg)  
_P3T1085UK-ARD and PCT2075DP-ARD : Arduino® Shield Evaluation Board for temperature sensors_

# What is this?
An Arduino library for I²C temperature sensors with sample code.  
The I²C temperature sensors can measure temperature and output comparator or interrupt signals by threshold settings. 

With `TempSensor_NXP_Arduino` library, the temperature measurement and showing it in Celsius can be done very simple as follwoing.  
Include device name header file (`LM75B.h`, `PCT2075.h`, and/or `P3T1085.h`) to use those class libraries. 
```cpp
#include <PCT2075.h>

PCT2075 sensor;

void setup() {
  Serial.begin(9600);
  while (!Serial)
    ;

  Wire.begin();

  Serial.println("\r***** Hello, PCT2075! *****");
}

void loop() {
  float t = sensor.temp();

  Serial.println(t);
  delay(1000);
}
```

# Supported devices
Type#|Header file|Features|Accuracy|Resolution|Interface|Evaluation board
---|---|---|---|---|---|---
[LM75B](https://www.nxp.com/products/sensors/ic-digital-temperature-sensors/digital-temperature-sensor-and-thermal-watchdog:LM75B)											|`LM75B.h`		|An industrial standard Digital Temperature Sensor				|±2℃		|0.125℃ (11bit)	|I²C Fast-mode (400KHz)			|---
[P3T1035](https://www.nxp.com/products/sensors/i3c-ic-digital-temp-sensors/i3c-ic-bus-0-5-c-accuracy-digital-temperature-sensor:P3T1035xUK)									|`P3T1035.h`	|I3C/I2C-Bus ±0.5 °C Accurate Digital Temperature Sensor		|±0.5℃	|0.0625℃ (12bit)	|I3C / I²C Fast-mode (400KHz)	|[P3T1035xUK Arduino® Shield Evaluation Board](https://www.nxp.com/design/design-center/development-boards/analog-toolbox/arduino-shields-solutions/p3t1035xuk-arduino-shield-evaluation-board:P3T1035XUK-ARD)
[P3T1084](https://www.nxp.com/products/sensors/i3c-ic-digital-temp-sensors/i3c-ic-bus-0-4-c-accurate-digital-temperature-sensor:P3T1084UK)									|`P3T1085.h` **Use P3T1085 class library**	|I3C/I²C-Bus ±0.4 °C Accurate Digital Temperature Sensor		|±0.4℃	|0.0625℃ (12bit)	|I3C / I²C Fast-mode (400KHz)	|
[P3T1085](https://www.nxp.com/products/sensors/ic-digital-temperature-sensors/i3c-ic-bus-0-5-c-accurate-digital-temperature-sensor:P3T1085UK)								|`P3T1085.h`	|I3C/I²C-Bus ±0.5 °C Accurate Digital Temperature Sensor		|±0.5℃	|0.0625℃ (12bit)	|I3C / I²C Fast-mode (400KHz)	|[P3T1085UK Arduino® Shield Evaluation Board](https://www.nxp.com/design/development-boards/analog-toolbox/arduino-shields-solutions/p3t1085uk-arduino-shield-evaluation-board:P3T1085UK-ARD)
[P3T1755](https://www.nxp.com/products/sensors/i3c-ic-digital-temp-sensors/i3c-ic-bus-0-5-c-accurate-digital-temperature-sensor:P3T1755DP)									|`P3T1755.h`	|I3C/I2C-Bus ±0.5 °C Accurate Digital Temperature Sensor		|±0.5℃	|0.0625℃ (12bit)	|I3C / I²C Fast-mode (400KHz)	|[P3T1755DP Arduino® Shield Evaluation Board](https://www.nxp.com/design/development-boards/analog-toolbox/arduino-shields-solutions/p3t1755dp-arduino-shield-evaluation-board:P3T1755DP-ARD)
[P3T2030](https://www.nxp.com/products/sensors/i3c-ic-digital-temp-sensors/i3c-ic-bus-2-0-c-accuracy-digital-temperature-sensor:P3T2030xUK)									|`P3T2030.h`	|I3C/I2C-Bus ±2.0 °C Accurate Digital Temperature Sensor		|±2.0℃	|0.0625℃ (12bit)	|I3C / I²C Fast-mode (400KHz)	|[P3T2030xUK Arduino® Shield Evaluation Board](https://www.nxp.com/design/design-center/development-boards/analog-toolbox/arduino-shields-solutions/p3t2030xuk-arduino-shield-evaluation-board:P3T2030XUK-ARD)
[PCT2075](https://www.nxp.com/products/sensors/ic-digital-temperature-sensors/ic-bus-fm-plus-1-degree-c-accuracy-digital-temperature-sensor-and-thermal-watchdog:PCT2075)	|`PCT2075.h`	|I²C-Bus Fm+, 1 Degree C Accuracy, Digital Temperature Sensor	|±1℃		|0.125℃ (11bit)	|I²C Fast-mode Plus (1MHz)		|[PCT2075DP-ARD Arduino® Shield - Temperature Sensors](https://www.nxp.com/design/development-boards/analog-toolbox/arduino-shields-solutions/pct2075dp-ard-arduino-shield-temperature-sensors:PCT2075DP-ARD)

# Getting started
## Install and run
Use **Library manager** in Arduino IDE for easy install
- **Find** this library: **Open** the _**Library Manager**_ pane, **Search** this library and click **INSTALL** button.  
![Find the lib](https://github.com/teddokano/additional_files/blob/main/TempSensor_NXP_Arduino/LM_install0s.png)

- Click **"INSTALL ALL"**  
![Install all](https://github.com/teddokano/additional_files/blob/main/TempSensor_NXP_Arduino/LM_install1s.png)

- Install will be completed quickly  
![Install completed](https://github.com/teddokano/additional_files/blob/main/TempSensor_NXP_Arduino/LM_install2s.png)

- Choose a sample code and try!  
![Choosing a sample code](https://github.com/teddokano/additional_files/blob/main/TempSensor_NXP_Arduino/LM_install3s.png)

<!--
## 3 steps to start
- **STEP 1**: Get a **.zip file** by "Download ZIP" in this page  
![Download](https://github.com/teddokano/additional_files/blob/main/TempSensor_NXP_Arduino/download.png)  

- **STEP 2**: Adding the **library into your Arduino IDE**, follow instruction of **Importing a .zip Library** part of [Add libraries to Arduino IDE](https://support.arduino.cc/hc/en-us/articles/5145457742236-Add-libraries-to-Arduino-IDE)  
![AddingZip](https://github.com/teddokano/additional_files/blob/main/TempSensor_NXP_Arduino/add_zip.png)  

- **STEP 3**: Try **Using installed libraries** part of [same guide page above](https://support.arduino.cc/hc/en-us/articles/5145457742236-Add-libraries-to-Arduino-IDE)  
![Choosing an example](https://github.com/teddokano/additional_files/blob/main/TempSensor_NXP_Arduino/examples.png)  
-->
# What's inside?
## Temperature sensor library
`LM75B`, `PCT2075` and `P3T1085` class libraries are included. Those libraries can be used by just making an instance from those class.  

### Making a device instance
The temperature sensor device can be operated with this very simple code. 
In this code, celcius vale which is read from PCT2075 is stored in variable `t` 
```cpp
#include <PCT2075.h>

PCT2075 sensor;

void setup() {
  Wire.begin();
}

void loop() {
  float t = sensor.temp();
}
```

To make an instance of the device, it can be declared like..
```cpp
#include <PCT2075.h>
PCT2075 sensor;
```

Every temperature sensor device instances has 0x48 default I²C address. If you need to change the address, it should be done at declaration of the instance.  
```cpp
#include <PCT2075.h>
PCT2075 sensor( 0x49 );  // I²C target address is 0x49
```


On addition to that, if the device is connected on different I²C bus, it needs to use different TwoWire instance.  
It uses `Wire` instance in default condition. If it should be changed, it can be like..
```cpp
#include <PCT2075.h>
PCT2075 sensor( Wire1, 0x49 );  // Choosing Wire1 and I²C target address is 0x49

void setup() {
  Wire1.begin();  // Needs to call "begin()" in Wire1
  ..
```

### Methods

Those libraries have common methods to get/set device information.

Method|Role
---|---
temp()					|Get temperature in Celsius
read()					|Get temperature in Celsius (same as `temp()`)
thresholds( v0, v1 )	|Set high and low temperature threshold for OS output. `v0` and `v1` are needed to be given by Celsius value. Order of the arguments doesn't care
os_mode( mode )			|Set OS pin mode. It can be set comparator or interrupt mode. The argument needs to be given as a class constant like `PCT2075::COMPARATOR` or `PCT2075::INTERRUPT`. The class name can be `LM75B`, `PCT2075`, `P3T1085` or a generic name of `TempSensor`.

## Examples
Example code is provided as scketch files.  
For a quick access to those sketch, **refer to last step** of **"Getting started" section** of this document. 

Sketch|Feature
---|---
LM75B_simple							|Simple sample for just reading temperature fro LM75B in every second
P3T1035_simple							|Simple sample for just reading temperature fro P3T1035 in every second (Similar to `PCT2075_simple`)
P3T1085_simple							|Simple sample for just reading temperature fro P3T1085 in every second (Similar to `PCT2075_simple`)
P3T1085_interrupt						|Demo for interrupt behavior. On the **P3T1085UK-ARD evaluation board**, the D8 pin is used for interrupt output but it cannot be used on most of Arduino boards. The D2 pin is used for interrupt input on this sketch. So to perform the interrupt correctly, **short D8 and D2 pins**. 
P3T1085_simple_on_Arduino_Due			|Same as "P3T1085_simple" code but it can run on Arduino Due. This code is to show how the different TwoWire instance can be targeted
P3T1755_simple							|Simple sample for just reading temperature fro P3T1085 in every second (Similar to `PCT2075_simple`)
P3T1755_interrupt						|Demo for interrupt behavior. On the **P3T1755DP-ARD evaluation board**, the D9 pin is used for interrupt output but it cannot be used on most of Arduino boards. The D2 pin is used for interrupt input on this sketch. So to perform the interrupt correctly, **short D9 and D2 pins**. 
P3T2030_simple							|Simple sample for just reading temperature fro P3T2030 in every second (Similar to `PCT2075_simple`)
PCT2075_simple							|Simple sample for just reading temperature fro PCT2075 in every second
PCT2075DP-ARD_interrupt_by_Tos_Thyst	|Demo to use interrupt. The sketch sets thresholds +2℃ and +1℃ of temperature when starting. The sketch controls **on-board heater** to keep the temperature withon those thresholds.

# Document
For details of the library, please find descriptions in [this document](https://teddokano.github.io/TempSensor_NXP_Arduino/annotated.html).

# References
[I²C Digital Temperature Sensors](https://www.nxp.com/products/sensors/ic-digital-temperature-sensors:MC_31128)

## Related libraries
Library|Feature|Target devices|Required library
---|---|---|---
[GPIO_NXP_Arduino](https://github.com/teddokano/GPIO_NXP_Arduino)				|GPIO libraries						|PCAL6408A, PCAL6416A, PCAL6524, PCAL6534, PCA9555, PCA9554	|[I2C_device_Arduino](https://github.com/teddokano/I2C_device_Arduino)
[LCDDriver_NXP_Arduino](https://github.com/teddokano/LCDDriver_NXP_Arduino)		|LCD driver libraries				|PCA8561						|[I2C_device_Arduino](https://github.com/teddokano/I2C_device_Arduino)
[LEDDriver_NXP_Arduino](https://github.com/teddokano/LEDDriver_NXP_Arduino)		|LED driver libraries				|PCA9955B, PCA9956B, PCA9957	|[I2C_device_Arduino](https://github.com/teddokano/I2C_device_Arduino)
[MUX_SW_NXP_Arduino](https://github.com/teddokano/MUX_SW_NXP_Arduino)			|I²C mux/switch libraries			|PCA9846						|[I2C_device_Arduino](https://github.com/teddokano/I2C_device_Arduino)
[RTC_NXP_Arduino](https://github.com/teddokano/RTC_NXP_Arduino)					|RTC libraries						|PCF2131, PCF85063A				|[I2C_device_Arduino](https://github.com/teddokano/I2C_device_Arduino)
[TempSensor_NXP_Arduino](https://github.com/teddokano/TempSensor_NXP_Arduino)	|Temperature sensor libraries		|LM75B, PCT2075, P3T1085		|[I2C_device_Arduino](https://github.com/teddokano/I2C_device_Arduino)
[I2C_device_Arduino](https://github.com/teddokano/I2C_device_Arduino)			|Base library for I²C operations	|none (can be applied as base class for all I²C targets)|---
