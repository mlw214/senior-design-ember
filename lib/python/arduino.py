#! /usr/bin/python
import sys
import random
solenoid = False
relay = False

while True:
    command = raw_input()
    if command == 'd':
        a = random.random()
        l = random.random()
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
