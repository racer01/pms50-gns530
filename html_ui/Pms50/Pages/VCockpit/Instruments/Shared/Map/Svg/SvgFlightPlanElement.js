class SvgFlightPlanElement extends SvgMapElement {
    constructor() {
        super(...arguments);
        this.flightPlanIndex = NaN;
        this.highlightActiveLeg = true;
        this.points = [];
        this.latLong = new LatLong();
        this._debugTransitionIndex = 0;
        this._lastP0X = NaN;
        this._lastP0Y = NaN;
        this.hideReachedWaypoints = true;
        this._highlightedLegIndex = -1;
        this._isDashed = false;
    }
    id(map) {
        return "flight-plan-" + this.flightPlanIndex + "-map-" + map.index;
        ;
    }
    createDraw(map) {
        let container = document.createElementNS(Avionics.SVG.NS, "svg");
        container.id = this.id(map);
        container.setAttribute("overflow", "visible");
        if (map.config.flightPlanNonActiveLegStrokeWidth > 0) {
            this._outlinePath = document.createElementNS(Avionics.SVG.NS, "path");
            this._outlinePath.setAttribute("stroke", map.config.flightPlanNonActiveLegStrokeColor);
            this._outlinePath.setAttribute("fill", "none");
            let outlinePathWidth = fastToFixed((map.config.flightPlanNonActiveLegStrokeWidth / map.overdrawFactor + map.config.flightPlanNonActiveLegWidth / map.overdrawFactor), 0);
            this._outlinePath.setAttribute("stroke-width", outlinePathWidth);
            this._outlinePath.setAttribute("stroke-linecap", "square");
            container.appendChild(this._outlinePath);
            this._outlineActive = document.createElementNS(Avionics.SVG.NS, "path");
            this._outlineActive.setAttribute("stroke", map.config.flightPlanActiveLegStrokeColor);
            this._outlineActive.setAttribute("fill", "none");
            let outlineActiveWidth = fastToFixed((map.config.flightPlanActiveLegStrokeWidth / map.overdrawFactor + map.config.flightPlanActiveLegWidth / map.overdrawFactor), 0);
            this._outlineActive.setAttribute("stroke-width", outlineActiveWidth);
            this._outlineActive.setAttribute("stroke-linecap", "square");
            container.appendChild(this._outlineActive);
            this._transitionOutlinePath = document.createElementNS(Avionics.SVG.NS, "path");
            this._transitionOutlinePath.setAttribute("stroke", map.config.flightPlanNonActiveLegStrokeColor);
            this._transitionOutlinePath.setAttribute("fill", "none");
            this._transitionOutlinePath.setAttribute("stroke-width", outlinePathWidth);
            this._transitionOutlinePath.setAttribute("stroke-linecap", "square");
            container.appendChild(this._transitionOutlinePath);
        }
        this._colorPath = document.createElementNS(Avionics.SVG.NS, "path");
        this._colorPath.setAttribute("stroke", map.config.flightPlanNonActiveLegColor);
        this._colorPath.setAttribute("fill", "none");
        if (this.flightPlanIndex === 1) {
            this._colorPath.setAttribute("stroke", "yellow");
        }
        let colorPathWidth = fastToFixed(map.config.flightPlanNonActiveLegWidth / map.overdrawFactor, 0);
        this._colorPath.setAttribute("stroke-width", colorPathWidth);
        this._colorPath.setAttribute("stroke-linecap", "square");
        container.appendChild(this._colorPath);
        this._colorActive = document.createElementNS(Avionics.SVG.NS, "path");
        this._colorActive.setAttribute("stroke", map.config.flightPlanActiveLegColor);
        this._colorActive.setAttribute("fill", "none");
        if (this.flightPlanIndex === 1) {
            this._colorActive.setAttribute("stroke", "yellow");
        }
        let colorActiveWidth = fastToFixed(map.config.flightPlanActiveLegWidth / map.overdrawFactor, 0);
        this._colorActive.setAttribute("stroke-width", colorActiveWidth);
        this._colorActive.setAttribute("stroke-linecap", "square");
        container.appendChild(this._colorActive);
        this._transitionPath = document.createElementNS(Avionics.SVG.NS, "path");
        this._transitionPath.setAttribute("stroke", map.config.flightPlanNonActiveLegColor);
        this._transitionPath.setAttribute("fill", "none");
        if (this.flightPlanIndex === 1) {
            this._transitionPath.setAttribute("stroke", "yellow");
        }
        this._transitionPath.setAttribute("stroke-width", colorPathWidth);
        this._transitionPath.setAttribute("stroke-linecap", "square");
        container.appendChild(this._transitionPath);
        this.setAsDashed(this._isDashed, true);
        return container;
    }
    updateDraw(map) {
        this._highlightedLegIndex = SimVar.GetSimVarValue("L:MAP_FLIGHTPLAN_HIGHLIT_WAYPOINT", "number");
        this.points = [];
        let transitionPoints = [];
        let lastLat = NaN;
        let lastLong = NaN;
        let departureRunwayCase;
        let activeWaypointIndex = -1;
        if (this.source) {
            if (SimVar.GetSimVarValue("GPS OBS ACTIVE", "boolean")) {
                activeWaypointIndex = this.source.getActiveWaypointIndex(false, true);
                let waypoint = this.source.getActiveWaypoint();
                let magvar = SimVar.GetSimVarValue("MAGVAR", "degrees");
                let dir = SimVar.GetSimVarValue("GPS OBS VALUE", "degree") + magvar;
// PM Modif: take care of map orientation
                if(map.rotationMode == EMapRotationMode.HDGUp)
                    dir -= SimVar.GetSimVarValue("GPS GROUND TRUE HEADING", "degree");
                if(map.rotationMode == EMapRotationMode.TrackUp)
                    dir -= SimVar.GetSimVarValue("GPS GROUND TRUE TRACK", "degree");
// PM Modif: End take care of map orientation
                let wpLLA = waypoint.infos.coordinates.toLatLong();
                let offsetLat = map.NMToPixels(360) * Math.cos(dir * Math.PI / 180);
                let offsetLong = map.NMToPixels(360) * Math.sin(dir * Math.PI / 180);
                let prev = map.coordinatesToXY(wpLLA);
                prev.x -= offsetLong;
                prev.y += offsetLat;
                prev.refWPIndex = -1;
                this.points.push(prev);
                let p = map.coordinatesToXY(wpLLA);
                p.refWPIndex = 0;
                this.points.push(p);
                let next = map.coordinatesToXY(wpLLA);
                next.x += offsetLong;
                next.y -= offsetLat;
                next.refWPIndex = 1;
                this.points.push(next);
            }
            else {
                let l = this.source.getWaypointsCount();
                activeWaypointIndex = this.source.getActiveWaypointIndex(false, true);
                let doLastLeg = true;
                if (this.source.getApproach() && this.source.getApproach().transitions.length > 0) {
                    doLastLeg = false;
                }
                if (!this.source.getIsDirectTo() && this.source.getWaypoint(0, this.flightPlanIndex)) {
                    let departureWaypoint = this.source.getWaypoint(0, this.flightPlanIndex);
                    if (departureWaypoint.infos instanceof AirportInfo) {
                        departureRunwayCase = this.source.getDepartureRunway();
                    }
                }
                let pIndex = 0;
                let first = 0;
                let firstApproach = 0;
                if (this.source.getIsDirectTo()) {
                    let directToTarget = this.source.getDirectToTarget();
                    if (directToTarget) {
                        first = this.source.getWaypoints().findIndex(wp => { return wp.icao === directToTarget.icao; });
                        if (first === -1) {
                            firstApproach = this.source.getApproachWaypoints().findIndex(wp => { return wp.icao === directToTarget.icao; });
                            if (firstApproach != -1) {
                                first = Infinity;
                            }
                        }
                    }
                }
                else if (this.hideReachedWaypoints) {
                    first = Math.max(0, activeWaypointIndex - 1);
                }
                let approach = this.source.getApproach();
                let last = -1;
    // PM Modif: Display FPL legs when approach loaded but not activated and no enroute waypoint
                if(this.source.isActiveApproach() && approach) {
                    last = 0;
                }
                else {
                    last = this.source.getLastIndexBeforeApproach();
                    if(approach && l == 2 && last == 0)
                        last = -1;
                }
    //            let last = (this.source.isActiveApproach() && approach) ? 0 : this.source.getLastIndexBeforeApproach();
    // PM Modif: End Display FPL legs when approach loaded but not activated and no enroute waypoint
                for (let i = first; i < (last != -1 ? last : l - (doLastLeg ? 0 : 1)); i++) {
                    let waypoint = this.source.getWaypoint(i, this.flightPlanIndex);
                    if (waypoint) {
                        let wpPoints = [];
                        if (waypoint.transitionLLas) {
                            for (let j = 0; j < waypoint.transitionLLas.length; j++) {
                                wpPoints.push(waypoint.transitionLLas[i].toLatLong());
                            }
                        }
                        wpPoints.push(waypoint.infos.coordinates.toLatLong());
                        for (let j = 0; j < wpPoints.length; j++) {
                            this.latLong = wpPoints[j];
                            if (departureRunwayCase && i === 0) {
                                this.latLong.lat = departureRunwayCase.beginningCoordinates.lat;
                                this.latLong.long = departureRunwayCase.beginningCoordinates.long;
                            }
                            if (this.latLong.lat !== lastLat && this.latLong.long !== lastLong) {
                                let deltaLong = Math.abs(lastLong - this.latLong.long);
                                if (deltaLong > 2) {
                                    let lastX = Math.cos(lastLat / 180 * Math.PI) * Math.cos(lastLong / 180 * Math.PI);
                                    let lastY = Math.cos(lastLat / 180 * Math.PI) * Math.sin(lastLong / 180 * Math.PI);
                                    let lastZ = Math.sin(lastLat / 180 * Math.PI);
                                    let X = Math.cos(this.latLong.lat / 180 * Math.PI) * Math.cos(this.latLong.long / 180 * Math.PI);
                                    let Y = Math.cos(this.latLong.lat / 180 * Math.PI) * Math.sin(this.latLong.long / 180 * Math.PI);
                                    let Z = Math.sin(this.latLong.lat / 180 * Math.PI);
                                    let stepCount = Math.floor(deltaLong / 2);
                                    for (let k = 0; k < stepCount; k++) {
                                        let d = (k + 1) / (stepCount + 1);
                                        let x = lastX * (1 - d) + X * d;
                                        let y = lastY * (1 - d) + Y * d;
                                        let z = lastZ * (1 - d) + Z * d;
                                        let long = Math.atan2(y, x) / Math.PI * 180;
                                        let hyp = Math.sqrt(x * x + y * y);
                                        let lat = Math.atan2(z, hyp) / Math.PI * 180;
                                        if (this.points[pIndex]) {
                                            map.coordinatesToXYToRef(new LatLong(lat, long), this.points[pIndex]);
                                        }
                                        else {
                                            let p = map.coordinatesToXY(new LatLong(lat, long));
                                            p.refWP = waypoint;
                                            p.refWPIndex = i;
                                            this.points.push(p);
                                        }
                                        pIndex++;
                                    }
                                }
                                lastLat = this.latLong.lat;
                                lastLong = this.latLong.long;
                                if (this.points[pIndex]) {
                                    map.coordinatesToXYToRef(this.latLong, this.points[pIndex]);
                                    if (i === 0) {
                                        if (this.points[0].x === this._lastP0X && this.points[0].y === this._lastP0Y) {
                                            this._forceFullRedraw++;
                                            if (this._forceFullRedraw < 60) {
                                                return;
                                            }
                                            this._forceFullRedraw = 0;
                                        }
                                        this._lastP0X = this.points[0].x;
                                        this._lastP0Y = this.points[0].y;
                                    }
                                }
                                else {
                                    let p = map.coordinatesToXY(this.latLong);
                                    p.refWP = waypoint;
                                    p.refWPIndex = i;
                                    this.points.push(p);
                                }
                                pIndex++;
                            }
                        }
                        if (i === 0) {
                            if (departureRunwayCase) {
                                this.latLong.lat = departureRunwayCase.endCoordinates.lat;
                                this.latLong.long = departureRunwayCase.endCoordinates.long;
                                if (this.points[pIndex]) {
                                    map.coordinatesToXYToRef(this.latLong, this.points[pIndex]);
                                }
                                else {
                                    let p = map.coordinatesToXY(this.latLong);
                                    p.refWP = waypoint;
                                    p.refWPIndex = 0;
                                    this.points.push(p);
                                }
                                pIndex++;
                            }
                        }
                    }
                }
                if (approach) {
                    let waypoints = this.source.getApproachWaypoints();
                    for (let i = firstApproach; i < waypoints.length; i++) {
                        let waypoint = waypoints[i];
                        if (waypoint) {
                            let wpPoints = [];
                            if (i > firstApproach || !this.source.getIsDirectTo()) {
                                if (waypoints[i].transitionLLas) {
                                    for (let j = 0; j < waypoints[i].transitionLLas.length; j++) {
                                        wpPoints.push(waypoints[i].transitionLLas[j]);
                                    }
                                }
                            }
                            wpPoints.push(new LatLongAlt(waypoints[i].latitudeFP, waypoints[i].longitudeFP, waypoints[i].altitudeinFP));
                            for (let j = 0; j < wpPoints.length; j++) {
                                if (this.points[pIndex]) {
                                    map.coordinatesToXYToRef(wpPoints[j], this.points[pIndex]);
                                    this.points[pIndex].refWP = waypoints[i];
                                    this.points[pIndex].refWPIndex = last + i;
                                }
                                else {
                                    let p = map.coordinatesToXY(wpPoints[j]);
                                    p.refWP = waypoints[i];
                                    p.refWPIndex = last + i;
                                    this.points.push(p);
                                }
                                pIndex++;
                            }
                        }
                    }
                }
            }
        }
        let logWPIndex = false;
        if (logWPIndex) {
            let indexes = "";
            this.points.forEach(p => {
                indexes += p.refWPIndex + " ";
            });
            console.log(indexes);
        }
        for (let bevels = 0; bevels < 2; bevels++) {
            let bevelAmount = map.NMToPixels(3) / (bevels + 1);
            if (this.points.length > 2) {
                let beveledPoints = [this.points[0]];
                for (let i = 1; i < this.points.length - 1; i++) {
                    let pPrev = this.points[i - 1];
                    let p = this.points[i];
                    let pNext = this.points[i + 1];
                    if ((pPrev.x == p.x && pPrev.y == p.y) || (pNext.x == p.x && pNext.y == p.y)) {
                        beveledPoints.push(p);
                        continue;
                    }
                    let xPrev = pPrev.x - p.x;
                    let yPrev = pPrev.y - p.y;
                    let dPrev = Math.sqrt(xPrev * xPrev + yPrev * yPrev);
                    xPrev /= dPrev;
                    yPrev /= dPrev;
                    let xNext = pNext.x - p.x;
                    let yNext = pNext.y - p.y;
                    let dNext = Math.sqrt(xNext * xNext + yNext * yNext);
                    xNext /= dNext;
                    yNext /= dNext;
                    let b = Math.min(dPrev / 3, dNext / 3, bevelAmount);
                    let refWPIndex = p.refWPIndex + (((bevels === 1) && (i % 2 === 0)) ? 1 : 0);
                    let refWP = (((bevels === 1) && (i % 2 === 0)) ? pNext.refWP : p.refWP);
                    beveledPoints.push({
                        x: p.x + xPrev * b,
                        y: p.y + yPrev * b,
                        refWP: refWP,
                        refWPIndex: refWPIndex
                    }, {
                        x: p.x + xNext * b,
                        y: p.y + yNext * b,
                        refWP: refWP,
                        refWPIndex: refWPIndex
                    });
                }
                beveledPoints.push(this.points[this.points.length - 1]);
                this.points = beveledPoints;
                if (logWPIndex) {
                    let indexes = "";
                    this.points.forEach(p => {
                        indexes += p.refWPIndex + " ";
                    });
                    console.log(indexes);
                }
            }
        }
        if (this.points.length > 0) {
            let prevRefWPIndex = this.points[this.points.length - 1].refWPIndex;
            let prevRefWP = this.points[this.points.length - 1].refWP;
            for (let p = this.points.length - 2; p > 0; p--) {
                let point = this.points[p];
                if (point.refWPIndex > prevRefWPIndex) {
                    point.refWPIndex = prevRefWPIndex;
                    point.refWP = prevRefWP;
                }
                prevRefWPIndex = point.refWPIndex;
                prevRefWP = point.refWP;
            }
        }
        let activePath = "";
        let standardPath = "";
        let transitionPath = "";
        let showActiveLeg = false;
        let prevIsHighlit = false;
        let prevWasClipped = false;
        let first = true;
        let s1 = new Vec2();
        let s2 = new Vec2();
        let p1 = null;
        let p2 = null;
        for (let i = 0; i < this.points.length; i++) {
            let p = this.points[i];
            if (!p || isNaN(p.x) || isNaN(p.y)) {
                continue;
            }
            if (!p1) {
                p1 = p;
                continue;
            }
            p2 = p;
            if (p1.x != p2.x || p1.y != p2.y) {
                let isHighlit = false;
                if (SimVar.GetSimVarValue("GPS OBS ACTIVE", "boolean")) {
                    if (p2.refWPIndex == 0) {
                        isHighlit = true;
                    }
                }
                else if (!this._isDashed && this.highlightActiveLeg) {
                    if (this.source.getActiveWaypoint(false, true)) {
                        if (p2.refWP === this.source.getActiveWaypoint(false, true)) {
                            isHighlit = true;
                        }
                    }
                    else if (activeWaypointIndex <= 1 && p2.refWPIndex <= activeWaypointIndex) {
                        isHighlit = true;
                    }
                }
                if (map.segmentVsFrame(p1, p2, s1, s2)) {
                    let x1 = fastToFixed(s1.x, 0);
                    let y1 = fastToFixed(s1.y, 0);
                    let x2 = fastToFixed(s2.x, 0);
                    let y2 = fastToFixed(s2.y, 0);
                    if (isHighlit) {
                        showActiveLeg = true;
                        if (first || prevIsHighlit != isHighlit || prevWasClipped) {
                            activePath += "M" + x1 + " " + y1 + " L" + x2 + " " + y2 + " ";
                        }
                        else {
                            activePath += "L" + x2 + " " + y2 + " ";
                        }
                    }
                    else {
                        if (first || prevIsHighlit != isHighlit || prevWasClipped) {
                            standardPath += "M" + x1 + " " + y1 + " L" + x2 + " " + y2 + " ";
                        }
                        else {
                            standardPath += "L" + x2 + " " + y2 + " ";
                        }
                    }
                    first = false;
                    prevWasClipped = (s2.Equals(p2)) ? false : true;
                }
                else {
                    prevWasClipped = true;
                }
                prevIsHighlit = isHighlit;
            }
            p1 = p2;
        }
        p1 = null;
        p2 = null;
        for (let i = 0; i < transitionPoints.length; i++) {
            let p = transitionPoints[i];
            if (!p || isNaN(p.x) || isNaN(p.y)) {
                continue;
            }
            if (!p1) {
                p1 = p;
                continue;
            }
            p2 = p;
            if (p1.x != p2.x || p1.y != p2.y) {
                if (map.segmentVsFrame(p1, p2, s1, s2)) {
                    let x1 = fastToFixed(s1.x, 0);
                    let y1 = fastToFixed(s1.y, 0);
                    let x2 = fastToFixed(s2.x, 0);
                    let y2 = fastToFixed(s2.y, 0);
                    transitionPath += "M" + x1 + " " + y1 + " L" + x2 + " " + y2 + " ";
                }
            }
            p1 = p2;
        }
        if (showActiveLeg) {
            if (this._colorActive) {
                this._colorActive.setAttribute("display", "visible");
            }
            if (this._outlineActive) {
                this._outlineActive.setAttribute("display", "visible");
            }
            if (this._outlineActive) {
                this._outlineActive.setAttribute("d", activePath);
            }
            if (this._colorActive) {
                this._colorActive.setAttribute("d", activePath);
            }
        }
        else {
            if (this._colorActive) {
                this._colorActive.setAttribute("display", "none");
            }
            if (this._outlineActive) {
                this._outlineActive.setAttribute("display", "none");
            }
        }
        if (this._colorPath) {
            this._colorPath.setAttribute("d", standardPath);
        }
        if (this._outlinePath) {
            this._outlinePath.setAttribute("d", standardPath);
        }
        if (this._transitionPath) {
            this._transitionPath.setAttribute("d", transitionPath);
        }
        if (this._transitionOutlinePath) {
            this._transitionOutlinePath.setAttribute("d", transitionPath);
        }
    }
    setAsDashed(_val, _force = false) {
        if (_force || (_val != this._isDashed)) {
            this._isDashed = _val;
            if (this._colorActive && this._colorPath) {
                if (this._isDashed) {
                    let length = 14;
                    let spacing = 8;
                    this._colorPath.removeAttribute("stroke-linecap");
                    this._colorPath.setAttribute("stroke-dasharray", length + " " + spacing);
                    this._colorActive.removeAttribute("stroke-linecap");
                    this._colorActive.setAttribute("stroke-dasharray", length + " " + spacing);
                }
                else {
                    this._colorPath.removeAttribute("stroke-dasharray");
                    this._colorPath.setAttribute("stroke-linecap", "square");
                    this._colorActive.removeAttribute("stroke-dasharray");
                    this._colorActive.setAttribute("stroke-linecap", "square");
                }
            }
        }
    }
}
class SvgBackOnTrackElement extends SvgMapElement {
    constructor(overrideColor = "") {
        super();
        this.overrideColor = overrideColor;
        this._id = "back-on-track-" + SvgBackOnTrackElement.ID;
        SvgBackOnTrackElement.ID++;
    }
    id(map) {
        return this._id + "-map-" + map.index;
        ;
    }
    createDraw(map) {
        let container = document.createElementNS(Avionics.SVG.NS, "svg");
        container.id = this.id(map);
        container.setAttribute("overflow", "visible");
        if (map.config.flightPlanDirectLegStrokeWidth > 0) {
            this._outlineLine = document.createElementNS(Avionics.SVG.NS, "line");
            this._outlineLine.setAttribute("stroke", this.overrideColor != "" ? this.overrideColor : map.config.flightPlanDirectLegStrokeColor);
            let outlineDirectLegWidth = fastToFixed((map.config.flightPlanDirectLegStrokeWidth / map.overdrawFactor + map.config.flightPlanDirectLegWidth), 0);
            this._outlineLine.setAttribute("stroke-width", outlineDirectLegWidth);
            this._outlineLine.setAttribute("stroke-linecap", "square");
            container.appendChild(this._outlineLine);
        }
        this._colorLine = document.createElementNS(Avionics.SVG.NS, "line");
        this._colorLine.setAttribute("stroke", this.overrideColor != "" ? this.overrideColor : map.config.flightPlanDirectLegColor);
        let colorDirectLegWidth = fastToFixed(map.config.flightPlanDirectLegWidth / map.overdrawFactor, 0);
        this._colorLine.setAttribute("stroke-width", colorDirectLegWidth);
        this._colorLine.setAttribute("stroke-linecap", "square");
        container.appendChild(this._colorLine);
        return container;
    }
    updateDraw(map) {
        let p1 = map.coordinatesToXY(this.llaRequested);
        let p2;
        if (this.targetWaypoint) {
            p2 = map.coordinatesToXY(this.targetWaypoint.infos.coordinates);
        }
        else if (this.targetLla) {
            p2 = map.coordinatesToXY(this.targetLla);
        }
        let dx = p2.x - p1.x;
        let dy = p2.y - p1.y;
        let d = Math.sqrt(dx * dx + dy * dy);
        dx /= d;
        dy /= d;
        p1.x += dx * 5;
        p1.y += dy * 5;
        p2.x -= dx * 5;
        p2.y -= dy * 5;
        this._colorLine.setAttribute("x1", fastToFixed(p1.x, 0));
        this._colorLine.setAttribute("y1", fastToFixed(p1.y, 0));
        this._colorLine.setAttribute("x2", fastToFixed(p2.x, 0));
        this._colorLine.setAttribute("y2", fastToFixed(p2.y, 0));
        if (this._outlineLine) {
            this._outlineLine.setAttribute("x1", fastToFixed(p1.x, 0));
            this._outlineLine.setAttribute("y1", fastToFixed(p1.y, 0));
            this._outlineLine.setAttribute("x2", fastToFixed(p2.x, 0));
            this._outlineLine.setAttribute("y2", fastToFixed(p2.y, 0));
        }
    }
}
SvgBackOnTrackElement.ID = 0;
class SvgDirectToElement extends SvgMapElement {
    constructor(overrideColor = "") {
        super();
        this.overrideColor = overrideColor;
        this._id = "direct-to-" + SvgDirectToElement.ID;
        SvgDirectToElement.ID++;
    }
    id(map) {
        return this._id + "-map-" + map.index;
        ;
    }
    createDraw(map) {
        let container = document.createElementNS(Avionics.SVG.NS, "svg");
        container.id = this.id(map);
        container.setAttribute("overflow", "visible");
        if (map.config.flightPlanDirectLegStrokeWidth > 0) {
            this._outlineLine = document.createElementNS(Avionics.SVG.NS, "line");
            this._outlineLine.setAttribute("stroke", this.overrideColor != "" ? this.overrideColor : map.config.flightPlanDirectLegStrokeColor);
            let outlineDirectLegWidth = fastToFixed((map.config.flightPlanDirectLegStrokeWidth / map.overdrawFactor + map.config.flightPlanDirectLegWidth), 0);
            this._outlineLine.setAttribute("stroke-width", outlineDirectLegWidth);
            this._outlineLine.setAttribute("stroke-linecap", "square");
            container.appendChild(this._outlineLine);
        }
        this._colorLine = document.createElementNS(Avionics.SVG.NS, "line");
        this._colorLine.setAttribute("stroke", this.overrideColor != "" ? this.overrideColor : map.config.flightPlanDirectLegColor);
        let colorDirectLegWidth = fastToFixed(map.config.flightPlanDirectLegWidth / map.overdrawFactor, 0);
        this._colorLine.setAttribute("stroke-width", colorDirectLegWidth);
        this._colorLine.setAttribute("stroke-linecap", "square");
        container.appendChild(this._colorLine);
        return container;
    }
    updateDraw(map) {
        let p1 = map.coordinatesToXY(this.llaRequested);
        let p2;
        if (this.targetWaypoint) {
            p2 = map.coordinatesToXY(this.targetWaypoint.infos.coordinates);
        }
        else if (this.targetLla) {
            p2 = map.coordinatesToXY(this.targetLla);
        }
        if (SimVar.GetSimVarValue("GPS OBS ACTIVE", "boolean")) {
            let magvar = SimVar.GetSimVarValue("MAGVAR", "degrees");
            let dir = SimVar.GetSimVarValue("GPS OBS VALUE", "degree") + magvar;
// PM Modif: take care of map orientation
            if(map.rotationMode == EMapRotationMode.HDGUp)
                dir -= SimVar.GetSimVarValue("GPS GROUND TRUE HEADING", "degree");
            if(map.rotationMode == EMapRotationMode.TrackUp)
                dir -= SimVar.GetSimVarValue("GPS GROUND TRUE TRACK", "degree");
// PM Modif: End take care of map orientation
            let offsetLat = map.NMToPixels(360) * Math.cos(dir * Math.PI / 180);
            let offsetLong = map.NMToPixels(360) * Math.sin(dir * Math.PI / 180);
            p1.x -= offsetLong;
            p1.y += offsetLat;
            p2.x -= p1.x - p2.x;
            p2.y -= p1.y - p2.y;
        }
        let dx = p2.x - p1.x;
        let dy = p2.y - p1.y;
        let d = Math.sqrt(dx * dx + dy * dy);
        dx /= d;
        dy /= d;
        p1.x += dx * 5;
        p1.y += dy * 5;
        p2.x -= dx * 5;
        p2.y -= dy * 5;
        this._colorLine.setAttribute("x1", fastToFixed(p1.x, 0));
        this._colorLine.setAttribute("y1", fastToFixed(p1.y, 0));
        this._colorLine.setAttribute("x2", fastToFixed(p2.x, 0));
        this._colorLine.setAttribute("y2", fastToFixed(p2.y, 0));
        if (this._outlineLine) {
            this._outlineLine.setAttribute("x1", fastToFixed(p1.x, 0));
            this._outlineLine.setAttribute("y1", fastToFixed(p1.y, 0));
            this._outlineLine.setAttribute("x2", fastToFixed(p2.x, 0));
            this._outlineLine.setAttribute("y2", fastToFixed(p2.y, 0));
        }
    }
}
SvgDirectToElement.ID = 0;
class SvgApproachFlightPlanDebugElement extends SvgMapElement {
    constructor() {
        super(...arguments);
        this.flightPlanIndex = NaN;
    }
    id(map) {
        return "flight-plan-" + this.flightPlanIndex + "-map-" + map.index;
        ;
    }
    createDraw(map) {
        let container = document.createElementNS(Avionics.SVG.NS, "svg");
        container.id = this.id(map);
        container.setAttribute("overflow", "visible");
        this._path = document.createElementNS(Avionics.SVG.NS, "path");
        this._path.setAttribute("stroke", "red");
        this._path.setAttribute("stroke-width", "4");
        this._path.setAttribute("fill", "none");
        container.appendChild(this._path);
        return container;
    }
    updateDraw(map) {
        if (this.source && this.source.waypoints) {
            let d = "";
            let waypoints = this.source.waypoints;
            for (let i = 0; i < waypoints.length; i++) {
                let wpPoints = [];
                if (waypoints[i].transitionLLas) {
                    for (let j = 0; j < waypoints[i].transitionLLas.length; j++) {
                        wpPoints.push(waypoints[i].transitionLLas[j]);
                    }
                }
                wpPoints.push(waypoints[i].lla);
                for (let j = 0; j < wpPoints.length; j++) {
                    let lla = wpPoints[j];
                    let xy = map.coordinatesToXY(lla);
                    if (i === 0 && j === 0) {
                        d += "M" + xy.x.toFixed(0) + " " + xy.y.toFixed(0) + " ";
                    }
                    else {
                        d += "L" + xy.x.toFixed(0) + " " + xy.y.toFixed(0) + " ";
                    }
                }
            }
            this._path.setAttribute("d", d);
        }
    }
}
//# sourceMappingURL=SvgFlightPlanElement.js.map