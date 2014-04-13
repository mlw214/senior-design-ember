#! /usr/bin/env python
# Miller Wilt
# 2013-04-13
# lib/python/webcam.py
import cv2, numpy, string, sys, threading, time

boxWidth = 25
boxHeight = 25
area = float(boxWidth * boxHeight)
topLeft = None
topRight = None
bottomLeft = None
bottomRight = None
color = 255, 255, 255
lowerBound = None
upperBound = None
boundType = 'in'
threshold = 0.05
mutex = threading.Lock()

# Tries to mimic Javascript's setInterval function.
# Takes function execution time into account.
def setInterval(interval):

    def outerWrap(function):

        def wrap(*args, **kwargs):
            stop = threading.Event()

            def innerWrap():
                # Run function right away
                function(*args, **kwargs)
                # Then loop until isSet is True, or program exits
                waitTime = interval
                while not stop.isSet():
                    # Consistent enough for my application, where the fastest interval will be 500 ms
                    if waitTime > 0:
                        stop.wait(waitTime)
                    nextRunTime = time.time() + interval
                    function(*args, **kwargs)
                    afterTime = time.time()
                    waitTime = nextRunTime - afterTime


            t = threading.Timer(0, innerWrap)
            t.daemon = True
            t.start()
            return stop

        return wrap

    return outerWrap

def setPoints(videoCapture):
    global topLeft, topRight, bottomLeft, bottomRight
    shape = (int(videoCapture.get(4)), int(videoCapture.get(3)))
    hBH = boxHeight/2
    hBW = boxWidth/2
    topLeft = shape[1]/2 - hBW, shape[0]/2 - hBH
    topRight = shape[1]/2 + hBW, topLeft[1]
    bottomLeft = topLeft[0], shape[0]/2 + hBH
    bottomRight = topRight[0], bottomLeft[1]

def analyzeFrame(bgrFrame):
    mutex.acquire()
    if lowerBound and upperBound:

        hsvFrame = cv2.cvtColor(bgrFrame, cv2.COLOR_BGR2HSV)
        centeredBox = hsvFrame[topLeft[1]:bottomLeft[1], topLeft[0]:topRight[0], :]
        boxFlat = centeredBox.reshape([-1, 3])
        numBroken = 0
        # Doing it this ways removes worry of checkInBounds changing while analyzing an individual frame
        # i.e., it won't take effect until the next frame.
        if boundType == 'in':
            for i in xrange(0, (boxFlat.shape)[0]):
                isGreaterLower = numpy.all(numpy.greater(boxFlat[i], lowerBound))
                isLessUpper = numpy.all(numpy.less(boxFlat[i], upperBound))
                if isGreaterLower and isLessUpper:
                    numBroken = numBroken + 1
        else:
            for i in xrange(0, (boxFlat.shape)[0]):
                isLessLower = numpy.all(numpy.less(boxFlat[i], lowerBound))
                isGreaterUpper = numpy.all(numpy.greater(boxFlat[i], upperBound))
                if isLessLower and isGreaterUpper:
                    numBroken = numBroken + 1

        if (numBroken/area) >= threshold:
            sys.stderr.write('Exceeded\n')
            sys.stderr.flush()


    mutex.release()

@setInterval(1)
def videoLoop(videoCapture):
    _, bgrFrame = videoCapture.read()
    analyzeFrame(bgrFrame)
    cv2.rectangle(bgrFrame, topLeft, bottomRight, color)
    sys.stdout.write(bgrFrame)
    sys.stdout.flush()

def parseAndHandle(text):
    global lowerBound, upperBound, boundType
    args = string.split(text)
    length = len(args)
    if 0 == length:
        return
    if 'set' == args[0]:
        if 7 != length:
            sys.stderr.write('set: improper number of arguments\n')
            sys.stderr.flush()
            return
        mutex.acquire()
        lowerBound = int(float(args[1])), int(float(args[2])), int(float(args[3]))
        upperBound = int(float(args[4])), int(float(args[5])), int(float(args[6]))
        mutex.release()
    elif 'clear' == args[0]:
        if 1 != length:
            sys.stderr.write('clear: improper number of arguments\n')
            sys.stderr.flush()
            return
        mutex.acquire()
        lowerBound = None
        upperBound = None
        mutex.release()
    elif 'bound-type' == args[0]:
        if 2 != length:
            sys.stderr.write('bound-type: improper number of arguments\n')
            sys.stderr.flush()
            return
        elif args[1] != 'in' and args[1] != 'out':
            sys.stderr.write('bound-type: unknown command ' + args[1] + '\n')
            sys.stderr.flush()
            return
        mutex.acquire()
        boundType = args[1]
        mutex.release()


def main():
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        sys.stderr.write('Error: could not open video0')
        sys.stderr.flush()
        sys.exit(1)

    cap.set(4, 240)
    cap.set(3, 320)
    cap.set(5, 7.5)
    setPoints(cap)
    loopStop = videoLoop(cap)

    # Go into stdin listening mode
    while True:
        text = raw_input()
        parseAndHandle(text)


if __name__ == '__main__':
    main()
