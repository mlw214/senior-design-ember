#include "color-detector.hpp"
#include <vector>

using std::getline;
using std::vector;

void* command_loop(void*);
vector<string>* parse_string(string&);

static pthread_mutex_t mux = PTHREAD_MUTEX_INITIALIZER;

int main() {
    ColorDetector blah(mux);
    pthread_t thread;
    int code = pthread_create(&thread, NULL, &command_loop, (void*)&blah);
    if (code) {
        cerr << "Couldn't create pthread: " << code << endl;
        return -1;
    }
    blah.setBounds(165, 160, 60, 179, 255, 255);
    blah.startVideo();
}

void* command_loop(void* ptr) {
    ColorDetector *det = ((ColorDetector*)ptr);
    string input;
    while (true) {
        getline(cin, input);
        vector<string> *args = parse_string(input);
        if (args->size() > 0) {
            string first = (*args)[0];
            if (first.compare("set") == 0) {
                if (args->size() != 7) {
                    cerr << "Bad input" << endl;
                } else {
                    int h1 = atoi((*args)[1].c_str());
                    int s1 = atoi((*args)[2].c_str());
                    int v1 = atoi((*args)[3].c_str());
                    int h2 = atoi((*args)[4].c_str());
                    int s2 = atoi((*args)[5].c_str());
                    int v2 = atoi((*args)[6].c_str());
                    det->setBounds(h1, s1, v1, h2, s2, v2);
                }
            } else if (first.compare("clear") == 0) {
                det->clearBounds();
            } else if (first.compare("average") == 0) {
                string avg = det->getAverageHSV();
                pthread_mutex_lock(&mux);
                cout << avg << endl;
                pthread_mutex_unlock(&mux);
            }
        }
        delete args;
    }
}

vector<string>* parse_string(string& in) {
    vector<string> *parts = new vector<string>();
    size_t i = 0, len = in.length();
    while (i < len) {
        string part = "";
        char c = in[i];
        while (c != ' ' && i < len) {
            part += c;
            c = in[++i];
        }
        if (i < len) {
            c = in[++i];
        }
        parts->push_back(part);
    }
    return parts;
}