(function () {
    'use strict';

    function convexHull(points) {
        points.sort(function (a, b) {
            return a.x != b.x ? a.x - b.x : a.y - b.y;
        });

        var n = points.length;
        var hull = [];

        for (var i = 0; i < 2 * n; i++) {
            var j = i < n ? i : 2 * n - 1 - i;
            while (hull.length >= 2 && removeMiddle(hull[hull.length - 2], hull[hull.length - 1], points[j]))
                hull.pop();
            hull.push(points[j]);
        }

        hull.pop();
        return hull;
    }

    function removeMiddle(a, b, c) {
        var cross = (a.x - b.x) * (c.y - b.y) - (a.y - b.y) * (c.x - b.x);
        var dot = (a.x - b.x) * (c.x - b.x) + (a.y - b.y) * (c.y - b.y);
        return cross < 0 || cross == 0 && dot <= 0;
    }

    // export as AMD module / Node module / browser or worker variable
    if (typeof define === 'function' && define.amd) define(function () { return convexHull; });
    else if (typeof module !== 'undefined') module.exports = convexHull;
    else if (typeof self !== 'undefined') self.convexHull = convexHull;
    else window.convexHull = convexHull;
})();
