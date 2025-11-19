#include "TempSensor.h"

/* TempSensor class ******************************************/

TempSensor::TempSensor( uint8_t i2c_address ) : I2C_device( i2c_address ){}
TempSensor::TempSensor( TwoWire& wire, uint8_t i2c_address ) : I2C_device( wire, i2c_address ){}
TempSensor::~TempSensor(){}

float TempSensor::read()
{
	return temp();
}

/* LM75B class ******************************************/

LM75B::LM75B( uint8_t i2c_address ) : TempSensor( i2c_address ){}
LM75B::LM75B( TwoWire& wire, uint8_t i2c_address ) : TempSensor( wire, i2c_address ){}
LM75B::~LM75B(){}

float LM75B::temp()
{
	return read_r16( Temp ) / 256.0;
}

void LM75B::thresholds( float v0, float v1 )
{
	float higher	= (v0 < v1) ? v1 : v0;
	float lower		= (v0 < v1) ? v0 : v1;
	
	write_r16( Tos,   ((uint16_t)(higher * 256.0)) & 0xFF80 );
	write_r16( Thyst, ((uint16_t)(lower  * 256.0)) & 0xFF80 );
}

void LM75B::os_mode( mode flag )
{
	bit_op8( Conf, ~0x02, flag << 1 );
}

/* PCT2075 class ******************************************/
PCT2075::PCT2075( uint8_t i2c_address ) : LM75B( i2c_address ){}
PCT2075::PCT2075( TwoWire& wire, uint8_t i2c_address ) : LM75B( wire, i2c_address ){}
PCT2075::~PCT2075(){}

/* P3T1755 class ******************************************/

P3T1755::P3T1755( uint8_t i2c_address ) : LM75B( i2c_address ){}
P3T1755::P3T1755( TwoWire& wire, uint8_t i2c_address ) : LM75B( wire, i2c_address ){}
P3T1755::~P3T1755(){}

void P3T1755::thresholds( float v0, float v1 )
{
	float higher	= (v0 < v1) ? v1 : v0;
	float lower		= (v0 < v1) ? v0 : v1;
	
	write_r16( T_HIGH, ((uint16_t)(higher * 256.0)) & 0xFFF0 );
	write_r16( T_LOW,  ((uint16_t)(lower  * 256.0)) & 0xFFF0 );
}

/* P3T1085 class ******************************************/

P3T1085::P3T1085( uint8_t i2c_address ) : P3T1755( i2c_address ){}
P3T1085::P3T1085( TwoWire& wire, uint8_t i2c_address ) : P3T1755( wire, i2c_address ){}
P3T1085::~P3T1085(){}
void P3T1085::os_mode( mode flag )
{
	bit_op16( Conf, ~0x0400, flag << 10 );
}

bool P3T1085::clear( void )
{
	return (read_r16( Conf ) & 0x1000) ? true : false;
}

/* P3T1035 class ******************************************/

P3T1035::P3T1035( uint8_t i2c_address ) : P3T1755( i2c_address ){}
P3T1035::P3T1035( TwoWire& wire, uint8_t i2c_address ) : P3T1755( wire, i2c_address ){}
P3T1035::~P3T1035(){}

#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wunused-parameter"
void P3T1035::os_mode( mode flag )
{
	//	Do nothing since this device doesn't have "Thermostat Mode"
}
#pragma GCC diagnostic pop

/* P3T2030 class ******************************************/

P3T2030::P3T2030( uint8_t i2c_address ) : P3T1035( i2c_address ){}
P3T2030::P3T2030( TwoWire& wire, uint8_t i2c_address ) : P3T1035( wire, i2c_address ){}
P3T2030::~P3T2030(){}
