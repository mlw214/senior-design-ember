#! /bin/bash

# Miller Wilt
# 2013-04-12
# wrapper.sh

# Code glue to get webcam.py to interface with FFmpeg
lib/python/webcam.py 1> >(ffmpeg -f rawvideo -pix_fmt bgr24 -r 1 -s 320x240 -i - -an -f flv -metadata streamName=myStream tcp://0.0.0.0:6666 2>/dev/null)
