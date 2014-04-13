#! /usr/bin/env python
# Miller Wilt
# 2013-04-12
# lib/python/arduino.py
import os.path, random, serial, sys, time

fpath = '/dev/ttyACM0'
solenoid = False
relay = False

if (os.path.exists(fpath)):
    ser = serial.Serial(fpath, 9600)
    time.sleep(5)
    if ser.isOpen():
        while True:
            command = raw_input()
            ser.write(command)
            sys.stdout.write(ser.readline() + '\n')
            sys.stdout.flush()

else:
    # Simulate Arduino (useful for testing).
    while True:
        command = raw_input()
        if command == 'd':
            a = random.randint(0, 50)
            l = random.randint(0, 50)
            sys.stdout.write('a:' + str(a) + ';l:' + str(l) + '\n')
            sys.stdout.flush()
        elif command == 's':
            if solenoid:
                sys.stdout.write('solenoidOff\n')
                solenoid = False
            else:
                sys.stdout.write('solenoidOn\n')
                solenoid = True
            sys.stdout.flush()
        elif command == 'r':
            if relay:
                sys.stdout.write('relayOff\n')
                relay = False
            else:
                sys.stdout.write('relayOn\n')
                relay = True
            sys.stdout.flush()
