__author__ = 'averaart'

from math import sqrt

def pearson(x,y):
    if len(x) != len (y):
        print "x en y zijn niet even lang"
        return 2
    if len(x) <= 1:
        print "lijst te kort"
        return 2


    xAvg = 0.0
    yAvg = 0.0
    length = len(x)
    for i in range(length):
        xAvg += x[i]
        yAvg += y[i]

    xAvg /= length
    yAvg /= length

    numerator = 0.0
    denomPartX = 0.0
    denomPartY = 0.0
    for i in range(length):
        numerator += (x[i]-xAvg) * (y[i]-yAvg)
        denomPartX += (x[i]-xAvg)**2.0
        denomPartY += (y[i]-yAvg)**2.0
    denominator = sqrt(denomPartX * denomPartY)


    if denominator == 0:
#        print "delen door nul mag niet"
        return 2

    return numerator/denominator

