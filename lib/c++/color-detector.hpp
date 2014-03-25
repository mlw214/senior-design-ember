#include <cstdlib>
#include <iostream>
#include <opencv2/core/core.hpp>
#include <opencv2/highgui/highgui.hpp>
#include <opencv2/imgproc/imgproc.hpp>
#include <pthread.h>
#include <sstream>
#include <string>
#include <utility>

using std::cout;
using std::cin;
using std::cerr;
using std::endl;
using std::string;
using std::stringstream;

using cv::cvtColor;
using cv::imshow;
using cv::inRange;
using cv::Mat;
using cv::Mat_;
using cv::namedWindow;
using cv::Point;
using cv::rectangle;
using cv::Scalar;
using cv::Vec3b;
using cv::VideoCapture;
using cv::waitKey;

class ColorDetector {
    VideoCapture *cap;
    pthread_mutex_t mux;
    // checkInBounds: If true, we check if an HSV value
    // is in between lower and upper. If false, we check if it is
    // outside those bounds.
    bool checkInBounds;
    Vec3b *lower, *upper;
    int width, height, rows, cols, area, averageH, averageS, averageV;
    double threshold;
    Point topLeft, topRight, bottomLeft, bottomRight;

    void analyzeFrame(Mat& frame) {
        Mat hsvIm;
        cvtColor(frame, hsvIm, CV_BGR2HSV);
        Mat_<Vec3b> _hsvIm = hsvIm;
        int h, s, v, totalH = 0, totalS = 0, totalV = 0, inRangeTotal = 0;
        pthread_mutex_lock(&(this->mux));

        for (int i = this->topLeft.y; i <= this->bottomLeft.y; ++i) {
            for (int j = this->bottomLeft.x; j <= this->bottomRight.x; ++j) {
                h = _hsvIm(i, j)[0];
                s = _hsvIm(i, j)[1];
                v = _hsvIm(i, j)[2];

                if (this->lower != NULL && this->upper != NULL) {
                    if (isInRange(h, s, v)) {
                        ++inRangeTotal;
                    }
                }
            }
        }
        if (this->lower != NULL && this->upper != NULL) {
            if (((double)inRangeTotal)/this->area >= this->threshold) {
                cout << "Exceeded" << endl;
            }
        }
        pthread_mutex_unlock(&(this->mux));
        
    }

    bool isInRange(int h, int s, int v) {
        Vec3b lower = *(this->lower);
        Vec3b upper = *(this->upper);
        if (this->checkInBounds) {
            bool hCheck = (h >= lower[0] && h <= upper[0]);
            bool sCheck = (s >= lower[1] && s <= upper[1]);
            bool vCheck = (v >= lower[2] && v <= upper[2]);
            return hCheck && sCheck && vCheck;
        } else {
            bool hCheck = (h <= lower[0] && h >= upper[0]);
            bool sCheck = (s <= lower[1] && s >= upper[1]);
            bool vCheck = (v <= lower[2] && v >= upper[2]);
            return hCheck && sCheck && vCheck;
        }
    }

public:

    ColorDetector(pthread_mutex_t& mux, int id=0) :
        width(100), height(100), threshold(0.05), lower(NULL),
        upper(NULL), checkInBounds(true) {

        this->mux = mux;
        this->cap = new VideoCapture(id);

        if (!(this->cap->isOpened())) {
            cerr << "Failed to open VideoCapture" << endl;
            exit(-1);
        }

        this->cols = this->cap->get(CV_CAP_PROP_FRAME_WIDTH);
        this->rows = this->cap->get(CV_CAP_PROP_FRAME_HEIGHT);
        this->area = this->width * this->height;

        int halfWidth = this->width/2,
            halfHeight = this->height/2,
            halfRows = this->rows/2,
            halfCols = this->cols/2;


        this->topLeft.y = halfRows - halfHeight;
        this->topLeft.x = halfCols - halfWidth;
        this->topRight.y = halfRows - halfHeight;
        this->topRight.x = halfCols + halfWidth;
        this->bottomLeft.y = halfRows + halfHeight;
        this->bottomLeft.x = halfCols - halfWidth;
        this->bottomRight.y = halfRows + halfHeight;
        this->bottomRight.x = halfCols + halfWidth;

    }

    ~ColorDetector() {
        delete this->cap;
        if (this->lower != NULL) {
            delete this->lower;
        }
        if (this->upper != NULL) {
            delete this->upper;
        }
        pthread_mutex_destroy(&(this->mux));
    }

    void startVideo() {
        Scalar color(255, 255, 255);
        namedWindow("main");
        while (true) {
            Mat frame;
            (*(this->cap)) >> frame;
            this->analyzeFrame(frame);
            rectangle(frame, this->topLeft, this->bottomRight, color);
            imshow("main", frame);
        }
    }

    void setBounds(int h1, int s1, int v1, int h2, int s2, int v2) {
        pthread_mutex_lock(&(this->mux));
        if (this->lower != NULL) {
            delete this->lower;
        }
        if (this->upper != NULL) {
            delete this->upper;
        }
        this->lower = new Vec3b(h1, s1, v1);
        this->upper = new Vec3b(h2, s2, v2);
        pthread_mutex_unlock(&(this->mux));
    }

    void clearBounds() {
        pthread_mutex_lock(&(this->mux));
        if (this->lower != NULL) {
            delete this->lower;
            this->lower = NULL;
        }
        if (this->upper != NULL) {
            delete this->upper;
            this->upper = NULL;
        }
        pthread_mutex_unlock(&(this->mux));
    }

    void setCheckInBounds(bool b) {
        pthread_mutex_lock(&(this->mux));
        this->checkInBounds = b;
        pthread_mutex_unlock(&(this->mux));
    }
};