# geo-lemgth
tool for computimg lemgth metrics to settle argumemts about which state is the lemgthiest

geo-lemgth computes the aspect ratio of a GeoJSON polygon feature using either a grid-aligned bounding box (faster but less accurate) or a convex hull (slower but more accurate). The goal is to create a metric whereby geographic regions can be sorted by "lemgth" (length independent of scale) in such a way that humans would be likely to create the same ordering.

## Metrics

Two metrics are available, convex hull and bounding box.

### Convex Hull

The convex hull metric computes the convex hull of the input polygon. It then computes all pairwise great circle distances of nonadjacent vertices of the hull the longest of these is taken to be the longest line inside the polygon. Remaining lines that intersect this line are then selected, and their lengths averaged for a width metric. This length and width are now used to compute an aspect ratio irrespective of geographic orientation of the polygon.

### Bounding Box

The bounding box defined by minimum and maximum latitude and longitude is taken as the hull. Because the great circle distance between the northern corners and southern corners of this region is different, the mean width is used along with the height to compute an aspect ratio. This is fast to compute, but has an arbitrary bias towards north-south oriented regions.

## Future Directions

* Weighting the average width by nearness to perpendicularity with the longest line may give a more affine width metric.

* Repeatedly subdividing the bounding box as a quad-tree may allow a box-based metric to more closely-approximate the true aspect ratio.

* Searching for interior lines in the actual polygon, rather than a proxy convex hull, could provide a highly-accurate estimate of aspect ratio at the cost of computation time.

* Computing a center of mass or other useful centroid of the polygon, and requiring length and width vectors to pass through or near it may correct for some outliers such as the Aleutian Islands changing the computed aspect ratio of Alaska.

* Computing a smallest possible rectangular bounding box, rather than a box aligned to the coordinate grid. This may be as much computation as searching all interior lines on the polygon, though.

* A visualisation layer, or at least GeoJSON export of computed hulls and lines

## Known Issues

* MultiPolygon features are not correctly handled. This results incorrect output, such as an aspect ratio of 39.62 for Alaska using the bounding box metric.

## Sources

* [GeoJSON and KML Data for the United States](http://eric.clst.org/tech/usgeojson/)
* [Bounding box of states in USA from OSM's Nominatim](https://gist.github.com/mishari/5ecfccd219925c04ac32)

## References

The following were helpful in the development of these metrics:

* [r-sig-geo/Diameter of a polygon](http://r-sig-geo.2731867.n2.nabble.com/Diameter-of-a-polygon-td6268629.html)
* [Geonet/Longest Line Within a Polygon](https://community.esri.com/thread/91846)

## Why The Weird Spellimgs?

This tool was created to settle an argument in a humorous discussion group, in which use of the letter following "M" in the English alphabet is strongly forbidden. It is referred to simply as "The Glyph". Just remove references to the "silly" module if you use this for serious purposes.