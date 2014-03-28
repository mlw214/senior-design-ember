#! /bin/bash

./webcam.py 1> >(ffmpeg -f rawvideo -pix_fmt bgr24 -r 30 -s 640x480 -i - -an -f flv -metadata streamName=myStream tcp://0.0.0.0:6666 2>/dev/null)