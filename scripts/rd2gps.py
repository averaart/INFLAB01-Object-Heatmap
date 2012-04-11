__author__ = 'averaart'

# Deze functie is een port van de javascript functie op de volgende site
# http://www.gpscoordinaten.nl/beta/converteer-rd-coordinaten.php

import math

X0=155000.0
Y0=463000.0
lat0=52.15517440
lng0=5.38720621

latpqK=[]
for i in range(0,13): latpqK.append({})
latpqK[1]['p']=0
latpqK[1]['q']=1
latpqK[1]['K']=3235.65389
latpqK[2]['p']=2
latpqK[2]['q']=0
latpqK[2]['K']=-32.58297
latpqK[3]['p']=0
latpqK[3]['q']=2
latpqK[3]['K']=-0.24750
latpqK[4]['p']=2
latpqK[4]['q']=1
latpqK[4]['K']=-0.84978
latpqK[5]['p']=0
latpqK[5]['q']=3
latpqK[5]['K']=-0.06650
latpqK[6]['p']=2
latpqK[6]['q']=2
latpqK[6]['K']=-0.01709
latpqK[7]['p']=1
latpqK[7]['q']=0
latpqK[7]['K']=-0.00738
latpqK[8]['p']=4
latpqK[8]['q']=0
latpqK[8]['K']=0.00530
latpqK[9]['p']=2
latpqK[9]['q']=3
latpqK[9]['K']=-0.00039
latpqK[10]['p']=4
latpqK[10]['q']=1
latpqK[10]['K']=0.00033
latpqK[11]['p']=1
latpqK[11]['q']=1
latpqK[11]['K']=-0.00012

lngpqL=[]
for i in range(0,13): lngpqL.append({})
lngpqL[1]['p']=1
lngpqL[1]['q']=0
lngpqL[1]['K']=5260.52916
lngpqL[2]['p']=1
lngpqL[2]['q']=1
lngpqL[2]['K']=105.94684
lngpqL[3]['p']=1
lngpqL[3]['q']=2
lngpqL[3]['K']=2.45656
lngpqL[4]['p']=3
lngpqL[4]['q']=0
lngpqL[4]['K']=-0.81885
lngpqL[5]['p']=1
lngpqL[5]['q']=3
lngpqL[5]['K']=0.05594
lngpqL[6]['p']=3
lngpqL[6]['q']=1
lngpqL[6]['K']=-0.05607
lngpqL[7]['p']=0
lngpqL[7]['q']=1
lngpqL[7]['K']=0.01199
lngpqL[8]['p']=3
lngpqL[8]['q']=2
lngpqL[8]['K']=-0.00256
lngpqL[9]['p']=1
lngpqL[9]['q']=4
lngpqL[9]['K']=0.00128
lngpqL[10]['p']=0
lngpqL[10]['q']=2
lngpqL[10]['K']=0.00022
lngpqL[11]['p']=2
lngpqL[11]['q']=0
lngpqL[11]['K']=-0.00022
lngpqL[12]['p']=5
lngpqL[12]['q']=0
lngpqL[12]['K']=0.00026

XpqR=[]
for i in range(0,10): XpqR.append({})
XpqR[1]['p']=0
XpqR[1]['q']=1
XpqR[1]['R']=190094.945
XpqR[2]['p']=1
XpqR[2]['q']=1
XpqR[2]['R']=-11832.228
XpqR[3]['p']=2
XpqR[3]['q']=1
XpqR[3]['R']=-114.221
XpqR[4]['p']=0
XpqR[4]['q']=3
XpqR[4]['R']=-32.391
XpqR[5]['p']=1
XpqR[5]['q']=0
XpqR[5]['R']=-0.705
XpqR[6]['p']=3
XpqR[6]['q']=1
XpqR[6]['R']=-2.340
XpqR[7]['p']=1
XpqR[7]['q']=3
XpqR[7]['R']=-0.608
XpqR[8]['p']=0
XpqR[8]['q']=2
XpqR[8]['R']=-0.008
XpqR[9]['p']=2
XpqR[9]['q']=3
XpqR[9]['R']=0.148

YpqS=[]
for i in range(0,11): YpqS.append({})
YpqS[1]['p']=1
YpqS[1]['q']=0
YpqS[1]['S']=309056.544
YpqS[2]['p']=0
YpqS[2]['q']=2
YpqS[2]['S']=3638.893
YpqS[3]['p']=2
YpqS[3]['q']=0
YpqS[3]['S']=73.077
YpqS[4]['p']=1
YpqS[4]['q']=2
YpqS[4]['S']=-157.984
YpqS[5]['p']=3
YpqS[5]['q']=0
YpqS[5]['S']=59.788
YpqS[6]['p']=0
YpqS[6]['q']=1
YpqS[6]['S']=0.433
YpqS[7]['p']=2
YpqS[7]['q']=2
YpqS[7]['S']=-6.439
YpqS[8]['p']=1
YpqS[8]['q']=1
YpqS[8]['S']=-0.032
YpqS[9]['p']=0
YpqS[9]['q']=4
YpqS[9]['S']=0.092
YpqS[10]['p']=1
YpqS[10]['q']=4
YpqS[10]['S']=-0.054

def gps2X (lat,lng) :
    sum=0
    dlat=0.36*(lat-lat0)
    dlng=0.36*(lng-lng0)
    for i in range(1,10):
        sum=sum+XpqR[i]['R']*math.pow(dlat,XpqR[i]['p'])*math.pow(dlng,XpqR[i]['q'])
    return X0+sum

def gps2Y (lat,lng):
    sum=0
    dlat=0.36*(lat-lat0)
    dlng=0.36*(lng-lng0)
    for i in range(1,11):
        sum=sum+YpqS[i]['S']*math.pow(dlat,YpqS[i]['p'])*math.pow(dlng,YpqS[i]['q'])
    return Y0+sum


def RD2lat(X,Y):
    sum=0
    dX=0.00001*(X-X0)
    dY=0.00001*(Y-Y0)
    for i in range(1,12):
        sum=sum+latpqK[i]['K']*math.pow(dX,latpqK[i]['p'])*math.pow(dY,latpqK[i]['q'])
    return lat0+sum/3600.0


def RD2lng(X,Y):
    sum=0
    dX=0.00001*(X-X0)
    dY=0.00001*(Y-Y0)
    for i in range(1,13):
        sum=sum+lngpqL[i]['K']*math.pow(dX,lngpqL[i]['p'])*math.pow(dY,lngpqL[i]['q'])
    return lng0+sum/3600.0
