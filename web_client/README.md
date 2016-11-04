# What is This?
These are prototype web clients that specialize in visualizing L2 data. They
allow users to access data of any available point immediately just through clicking.
It will also let you know the latitude/longitude of your click, making it easy
to know exactly where you found data. Another cool feature is the ability to
instantly change color schemes and range. Did you want a rainbow color scheme
that only displays values from range 0-10 as opposed to 0-100? It can be easily
done by adjusting the sliders and the color option box. There is also the ability
to collect aggregate data (currently over an area, time may be added eventually)
and retrieve minimums, maximums, and averages. A chart or a CSV can be generated
instantly and downloaded. The original data sets are also available for download.

#Instructions for Openlayers Client
This is the more developed client, though as it is a work in progress, there still
remain bugs. However, it does appear to work fine for the most part.

Under Data Set Picker, you can pick the data set you would like to look at, the
color option, and set the ranges on both the value and time. You can also choose
to filter out points outside of your range, or you can make them have min or max
values.

Under Coordinate Values, you can view the values of the point you clicked most
recently. It'll return to you the value of every data set at that point.

Under statistics, you can view the min, max, and average of any box you have drawn
using either the command key and dragging or the ctrl key and dragging, depending
on whether or not you are using a Mac or Windows machine. You can then choose
to display a graph or download a CSV if you would like to further analyze the
data.

Under Download, there is a dropdown where you can choose to download the data
sets that are available.

#Instructions for Cesium client
This client is very much a prototype, but it has very similar features to the
Openlayers client. Only one of the webification data sets (TSurfAir) is accessible
for ease of implementation. However, you can still change the color, filter by
value and time, as well as find the value of a point by hovering over it. It will
also draw a box by holding down the ctrl key (on both Windows and Mac), and draw
a blue point on the minimum and a red point on the maximum. The min, max, average,
and other stats are displayed above the Cesium widget.

This client bugs out semi-often due to how the scene is rendered. If a color
will not change, try again. Otherwise refresh and try again. This usually fixes
the problem. 
