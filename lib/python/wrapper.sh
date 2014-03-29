#! /bin/bash

./webcam.py 1> >(ffmpeg -f rawvideo -pix_fmt bgr24 -r 10 -s 320x240 -i - -an -f flv -metadata streamName=myStream tcp://0.0.0.0:6666 2>/dev/null)