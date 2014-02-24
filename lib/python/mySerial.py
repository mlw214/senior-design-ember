import serial, signal, sys, time
ser = serial.Serial(port='/dev/tty.usbmodem1421', baudrate=9600)
print ser.isOpen()

def signal_handler(signal, frame):
	ser.close()
	sys.exit()
signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

time.sleep(5)
print 'awake'

while True:
	command = raw_input()
	ser.write(command)
	print ser.readline()
	
