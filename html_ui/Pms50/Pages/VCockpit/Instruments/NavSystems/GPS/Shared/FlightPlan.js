class GPS_WaypointLine extends MFD_WaypointLine {
    getString() {
        this.emptyLine = '<td class="SelectableElement Select0">_____</td><td>___<div class="Align unit">&nbsp;o<br/>&nbsp;M</div></td><td>__._<div class="Align unit">&nbsp;n<br/>&nbsp;m</div></td><td>__._<div class="Align unit">&nbsp;n<br/>&nbsp;m</div></td>';
        if (this.waypoint) {
            let infos = this.waypoint.GetInfos();
            if(infos && infos.ident) {
                return '<td class="SelectableElement Select0">' + (infos.ident != "" ? infos.ident.slice(0, 8) : this.waypoint.ident.slice(0, 8)) + '</td><td>'
                + this.getDtk() + '<div class="Align unit">&nbsp;o<br/>&nbsp;M</div>' + '</td><td>'
                + this.getDistance() + '<div class="Align unit">&nbsp;n<br/>&nbsp;m</div></td><td>'
                + this.getCumDistance() + '<div class="Align unit">&nbsp;n<br/>&nbsp;m</div>' + '</td>';
            }
            else if (this.element.emptyLine != "")
                return this.element.emptyLine;
            else
                return this.emptyLine;
        }
        else if (this.element && this.element.emptyLine != "") {
            return this.element.emptyLine;
        }
        else {
            return this.emptyLine;
        }
    }
    onEvent(_subIndex, _event) {
        if (this.element.gps.popUpElement == null) {
            switch (_event) {
                case "MENU_Push":
                    this.element.selectedLine = this;
                    break;
                case "ActivateWaypoint":
                    SimVar.SetSimVarValue("C:fs9gps:FlightPlanActiveWaypoint", "number", this.index);
                    break;
                case "ENT_Push":
                    if(this.waypoint) {
                        switch (this.waypoint.icao[0]) {
                            case "A":
                                this.element.gps.lastRelevantICAO = this.waypoint.icao;
                                this.element.gps.lastRelevantICAOType = "A";
                                this.element.gps.SwitchToInteractionState(0);
                                this.element.gps.SwitchToPageName("WPT", "AirportLocation", true);
                                break;
                            case "V":
                                this.element.gps.lastRelevantICAO = this.waypoint.icao;
                                this.element.gps.lastRelevantICAOType = "V";
                                this.element.gps.SwitchToInteractionState(0);
                                this.element.gps.SwitchToPageName("WPT", "VOR", true);
                                break;
                            case "N":
                                this.element.gps.lastRelevantICAO = this.waypoint.icao;
                                this.element.gps.lastRelevantICAOType = "N";
                                this.element.gps.SwitchToInteractionState(0);
                                this.element.gps.SwitchToPageName("WPT", "NDB", true);
                                break;
                            case "W":
                                this.element.gps.lastRelevantICAO = this.waypoint.icao;
                                this.element.gps.lastRelevantICAOType = "W";
                                this.element.gps.SwitchToInteractionState(0);
                                this.element.gps.SwitchToPageName("WPT", "Intersection", true);
                                break;
                        }
                    }
                    break;
                case "NavigationSmallInc":
                case "NavigationSmallDec":
                    if(this.element.savedFpl.canAdd(this.index)) {
                        this.element.gps.switchToPopUpPage(this.element.waypointWindow, this.element.onWaypointSelectionEnd.bind(this.element));
                        this.element.selectedIndex = this.index;
                        break;
                    }
                    return true;
                case "CLR":
                case "CLR_Push":
// PM Modif: Prevent removing a waypoint after a clear on waypoint window
// And discard removing first waypoint
                    if(!this.waypoint)
                        break;
                    if(!this.element.waypointWindow.element || (this.element.waypointWindow.element.preventRemove == false)) {
                        if(this.index >= 0) {
                            var curIndex  = this.element.gps.currFlightPlanManager.getActiveWaypointIndex();
                            var gsr = fastToFixed(SimVar.GetSimVarValue("SURFACE RELATIVE GROUND SPEED", "knots"), 0);
                            // Do not remove current leg if aircraft is moving and in nav or approach mode
                            let navmode = 0;
                            if(SimVar.GetSimVarValue("AUTOPILOT NAV1 LOCK", "boolean"))
                                navmode = 1;
                            if(SimVar.GetSimVarValue("AUTOPILOT APPROACH HOLD", "boolean"))
                                navmode = 2;
                            if(gsr > 0 && navmode && (this.index == curIndex || ((this.index + 1) == curIndex))) {
                                // Cannot remove the current leg waypoints
                                // Set a message for 20 seconds
                                this.element.gps.attemptDeleteWpLeg++;
                                setTimeout(() => {
                                    this.element.gps.attemptDeleteWpLeg--;
                                    if(this.element.gps.attemptDeleteWpLeg < 0)
                                        this.element.gps.attemptDeleteWpLeg = 0;
                                }, 20000);
                                this.element.gps.SwitchToInteractionState(1);
                            }
                            else {
                                // Check if this is a enroute waypoint
                                let firstIndex = this.element.gps.currFlightPlanManager.getDepartureWaypointsCount()+1;
                                let lastIndex = firstIndex + this.element.gps.currFlightPlanManager.getEnRouteWaypoints().length;
                                if(this.element.gps.currFlightPlanManager.getArrivalProcIndex() >= 0)
                                    lastIndex--;
                                if((this.index == 0 && firstIndex > 1) || (this.index > 0 && (this.index < firstIndex || this.index > lastIndex)))
                                {
                                    // Cannot remove a procedure waypoint
                                    // Set a message for 20 seconds
                                    this.element.gps.attemptDeleteWpProc++;
                                    setTimeout(() => {
                                        this.element.gps.attemptDeleteWpProc--;
                                        if(this.element.gps.attemptDeleteWpProc < 0)
                                            this.element.gps.attemptDeleteWpProc = 0;
                                    }, 20000);
                                    this.element.gps.SwitchToInteractionState(1);
                                }
                                else if(this.index > 0 && (this.index < firstIndex || this.index > lastIndex))
                                {
                                    // Cannot remove a procedure waypoint
                                    // Set a message for 20 seconds
                                    this.element.gps.attemptDeleteWpProc++;
                                    setTimeout(() => {
                                        this.element.gps.attemptDeleteWpProc--;
                                        if(this.element.gps.attemptDeleteWpProc < 0)
                                            this.element.gps.attemptDeleteWpProc = 0;
                                    }, 20000);
                                    this.element.gps.SwitchToInteractionState(1);
                                }
                                else {
                                    this.element.gps.confirmWindow.element.setTexts("Remove Waypoint ?");
                                    this.element.gps.switchToPopUpPage(this.element.gps.confirmWindow, () => {
                                        if (this.element.gps.confirmWindow.element.Result == 1) {
                                            this.element.removeWaypoint(this.index);
                                            this.element.gps.SwitchToInteractionState(0);
                                        }
                                        this.element.gps.SwitchToInteractionState(0);
                                    });
                                }
                            }
                        }
                    }
                    else{
                        this.element.waypointWindow.element.preventRemove = false;
                    }
// PM Modif: Prevent removing a waypoint after a clear on waypoint window
                    break;
            }
        }
        return false;
    }

    getDtk() {
        var dtk = "___";
        if(!this.element.gps.currFlightPlanManager.isActiveApproach() && !this.element.gps.currFlightPlanManager.getIsDirectTo()) {
            var activeIndex = this.element.gps.currFlightPlanManager.getActiveWaypointIndex();
            if(this.index > activeIndex) {
                dtk = this.waypoint.bearingInFP;
            }
            if(this.index == activeIndex) {
                dtk = SimVar.GetSimVarValue("GPS WP DESIRED TRACK", "degree");
            }
        }
        return isNaN(dtk) ? "___" : fastToFixed(dtk, 0);
    }
    getDistance() {
        var distance = "__._";
        if(!this.element.gps.currFlightPlanManager.isActiveApproach() && !this.element.gps.currFlightPlanManager.getIsDirectTo()){
            var activeIndex = this.element.gps.currFlightPlanManager.getActiveWaypointIndex();
            if(activeIndex >= 0) {
                if(activeIndex == this.index) {
                    distance = this.element.gps.currFlightPlanManager.getDistanceToActiveWaypoint();
                }
                else if(this.index > activeIndex) {
                    var wayPointList = this.element.gps.currFlightPlanManager.getWaypoints();
                    if(this.index < wayPointList.length)
                        distance = Avionics.Utils.computeDistance(wayPointList[this.index].infos.coordinates, wayPointList[this.index-1].infos.coordinates);
                }
            }
            if(activeIndex == -1) {
                var wayPointList = this.element.gps.currFlightPlanManager.getWaypoints();
                if(this.index > 0 && this.index < wayPointList.length)
                    distance = Avionics.Utils.computeDistance(wayPointList[this.index].infos.coordinates, wayPointList[this.index-1].infos.coordinates);
            }
        }
        return isNaN(distance) ? "__._" : distance.toFixed(1);
    }
    getCumDistance() {
        var cumDistance = "__._";
        if(!this.element.gps.currFlightPlanManager.isActiveApproach() && !this.element.gps.currFlightPlanManager.getIsDirectTo()){
            var activeIndex = this.element.gps.currFlightPlanManager.getActiveWaypointIndex();
            if(activeIndex >= 0) {
                if(this.index >= activeIndex) {
                    cumDistance = this.element.gps.currFlightPlanManager.getDistanceToActiveWaypoint();
                    if(this.index > activeIndex) {
                        var wayPointList = this.element.gps.currFlightPlanManager.getWaypoints();
                        for(var i=this.index; i > activeIndex; i--) {
                            if(i < wayPointList.length && i > 0) {
                                var distance = Avionics.Utils.computeDistance(wayPointList[i].infos.coordinates, wayPointList[i-1].infos.coordinates);
                                cumDistance += distance;
                            }
                        }
                    }
                }
            }
            if(activeIndex == -1 && this.index > 0) {
                var wayPointList = this.element.gps.currFlightPlanManager.getWaypoints();
                cumDistance = 0;
                for(var i=this.index; i > 0; i--) {
                    if(i < wayPointList.length && i > 0) {
                        var distance = Avionics.Utils.computeDistance(wayPointList[i].infos.coordinates, wayPointList[i-1].infos.coordinates);
                        cumDistance += distance;
                    }
                }
            }
        }
        return isNaN(cumDistance) ? "__._" : cumDistance.toFixed(1);
    }
}
class GPS_ApproachWaypointLine extends MFD_ApproachWaypointLine {
    getString() {
        this.emptyLine = '<td class="SelectableElement Select0">_____</td><td>___<div class="Align unit">&nbsp;o<br/>&nbsp;M</div></td><td>__._<div class="Align unit">&nbsp;n<br/>&nbsp;m</div></td><td>__._<div class="Align unit">&nbsp;n<br/>&nbsp;m</div></td>';
        if (this.waypoint) {
            let infos = this.waypoint.GetInfos();
            if(infos && infos.ident) {
                return '<td class="SelectableElement Select0">' + (infos.ident != "" ? infos.ident.slice(0, 8) : this.waypoint.ident.slice(0, 8)) + '</td><td>'
                    + this.getDtk() + '<div class="Align unit">&nbsp;o<br/>&nbsp;M</div>' + '</td><td>'
                    + this.getDistance() + '<div class="Align unit">&nbsp;n<br/>&nbsp;m</div></td><td>'
                    + this.getCumDistance() + '<div class="Align unit">&nbsp;n<br/>&nbsp;m</div>' + '</td>';
            }
            else if (this.element.emptyLine != "")
                return this.element.emptyLine;
            else
                return this.emptyLine;
        }
        else if (this.element && this.element.emptyLine != "") {
            return this.element.emptyLine;
        }
        else {
            return this.emptyLine;
        }
    }
    onEvent(_subIndex, _event) {
        if (this.element.gps.popUpElement == null) {
            switch (_event) {
                case "ENT_Push":
                    if(this.waypoint) {
                        switch (this.waypoint.icao[0]) {
                            case "A":
                                this.element.gps.lastRelevantICAO =this.waypoint.icao;
                                this.element.gps.lastRelevantICAOType = "A";
                                this.element.gps.SwitchToInteractionState(0);
                                this.element.gps.SwitchToPageName("WPT", "AirportLocation", true);
                                break;
                            case "V":
                                this.element.gps.lastRelevantICAO = this.waypoint.icao;
                                this.element.gps.lastRelevantICAOType = "V";
                                this.element.gps.SwitchToInteractionState(0);
                                this.element.gps.SwitchToPageName("WPT", "VOR", true);
                                break;
                            case "N":
                                this.element.gps.lastRelevantICAO = this.waypoint.icao;
                                this.element.gps.lastRelevantICAOType = "N";
                                this.element.gps.SwitchToInteractionState(0);
                                this.element.gps.SwitchToPageName("WPT", "NDB", true);
                                break;
                            case "W":
                                this.element.gps.lastRelevantICAO = this.waypoint.icao;
                                this.element.gps.lastRelevantICAOType = "W";
                                this.element.gps.SwitchToInteractionState(0);
                                this.element.gps.SwitchToPageName("WPT", "Intersection", true);
                                break;
                        }
                    }
                    break;
                case "NavigationSmallInc":
                case "NavigationSmallDec":
// PM Modif: Prevent adding an approach waypoint for now
//                    this.element.gps.switchToPopUpPage(this.element.waypointWindow, this.element.onWaypointSelectionEnd.bind(this.element));
//                    this.element.selectedIndex = this.index;
//                  return true;
// PM Modif: End Prevent adding an approach waypoint for now
                    break;
                case "CLR":
                case "CLR_Push":
                    // Cannot remove a procedure waypoint
                    // Set a message for 20 seconds
                    this.element.gps.attemptDeleteWpProc++;
                    setTimeout(() => {
                        this.element.gps.attemptDeleteWpProc--;
                        if(this.element.gps.attemptDeleteWpProc < 0)
                            this.element.gps.attemptDeleteWpProc = 0;
                    }, 20000);
// PM Modif: Prevent removing an approach waypoint
//                    this.element.removeWaypoint(this.index);
// PM Modif: End Prevent removing an approach waypoint
                    break;
            }
        }
        return false;
    }
    getDtk() {
        var dtk = "___";
        if(!this.element.gps.currFlightPlanManager.getIsDirectTo()) {
            if(this.element.gps.currFlightPlanManager.isActiveApproach()) {
                var activeIndex = this.element.gps.currFlightPlanManager.getActiveWaypointIndex();
                if(this.index > activeIndex) {
                    dtk = this.waypoint.bearingInFP;
                }
                if(this.index == activeIndex) {
                    dtk = SimVar.GetSimVarValue("GPS WP DESIRED TRACK", "degree");
                }
            }
            else {
                if(this.index == 0) {
                    // In this case the DTK is the bearing to first approach WP
                    let lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
                    let long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
                    let ll = new LatLong(lat, long);
                    dtk = Avionics.Utils.computeGreatCircleHeading(ll, this.waypoint.infos.coordinates);
                }
                else {
                    dtk = this.waypoint.bearingInFP;
                }
            }
        }
        return isNaN(dtk) ? "___" : fastToFixed(dtk, 0);
    }
    getDistance() {
        var distance = "__._";
        if(!this.element.gps.currFlightPlanManager.getIsDirectTo()){
            if(this.element.gps.currFlightPlanManager.isActiveApproach()) {
                var activeIndex = this.element.gps.currFlightPlanManager.getActiveWaypointIndex();
                if(activeIndex >= 0) {
                    if(activeIndex == this.index) {
                        distance = this.element.gps.currFlightPlanManager.getDistanceToActiveWaypoint();
                    }
                    else if(this.index > activeIndex) {
                        var wayPointList = this.element.gps.currFlightPlanManager.getApproachWaypoints();
                        distance = 0;
                        if(this.index < wayPointList.length)
                            distance = Avionics.Utils.computeDistance(wayPointList[this.index].infos.coordinates, wayPointList[this.index-1].infos.coordinates);
                    }
                }
            }
            else {
                if(this.index == 0) {
                    var wayPointList = this.element.gps.currFlightPlanManager.getWaypoints();
                    var activeIndex = this.element.gps.currFlightPlanManager.getActiveWaypointIndex();
                    if(wayPointList.length >2 && (activeIndex != wayPointList.length-1)) {
                        // The distance of the first non activated app WP is the one from the last enroute WP
                        // except if the active index is the destination
                        distance = Avionics.Utils.computeDistance(wayPointList[wayPointList.length - 2].infos.coordinates, this.waypoint.infos.coordinates);
                    }
                    else{
                        let lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
                        let long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
                        let ll = new LatLong(lat, long);
                        distance = Avionics.Utils.computeDistance(ll, this.waypoint.infos.coordinates);
                    }
                }
                else {
                    var wayPointList = this.element.gps.currFlightPlanManager.getApproachWaypoints();
                    distance = 0;
                    if(this.index < wayPointList.length)
                        distance = Avionics.Utils.computeDistance(wayPointList[this.index].infos.coordinates, wayPointList[this.index-1].infos.coordinates);
                }
            }
        }
        return isNaN(distance) ? "__._" : distance.toFixed(1);
    }
    getCumDistance() {
        var cumDistance = "__._";
        if(!this.element.gps.currFlightPlanManager.getIsDirectTo()) {
            if(this.element.gps.currFlightPlanManager.isActiveApproach()) {
                var activeIndex = this.element.gps.currFlightPlanManager.getActiveWaypointIndex();
                if(activeIndex >= 0) {
                    if(this.index >= activeIndex) {
                        cumDistance = this.element.gps.currFlightPlanManager.getDistanceToActiveWaypoint();
                        if(this.index > activeIndex) {
                            var wayPointList = this.element.gps.currFlightPlanManager.getApproachWaypoints();
                            for(var i=this.index; i > activeIndex; i--) {
                                distance = 0;
                                if(i < wayPointList.length)
                                    var distance = Avionics.Utils.computeDistance(wayPointList[i].infos.coordinates, wayPointList[i-1].infos.coordinates);
                                cumDistance += distance;
                            }
                        }
                    }
                }
            }
            else {
                // If no approach active, the cumulative distance must be taken form the one of the last enroute WP
                let lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
                let long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
                let ll = new LatLong(lat, long);
                wayPointList = this.element.gps.currFlightPlanManager.getApproachWaypoints();
                // default base cum distance is form airplane position but should occur only if enroute is max 2 WP
                // or if active index is the destination
                if(wayPointList.length)
                    cumDistance = Avionics.Utils.computeDistance(ll, wayPointList[0].infos.coordinates);
                var activeIndex = this.element.gps.currFlightPlanManager.getActiveWaypointIndex();
                if(activeIndex >= 0 && wayPointList.length) {
                    var wayPointListEnroute = this.element.gps.currFlightPlanManager.getWaypoints();
                    if(wayPointListEnroute.length > 2 && (activeIndex != wayPointListEnroute.length-1)) {
                        // Calculate last enroute WP cum distance
                        // Start from active WP
                        cumDistance = this.element.gps.currFlightPlanManager.getDistanceToActiveWaypoint();
                        // Add distance fromlast enroute to first approach WP
                        cumDistance += Avionics.Utils.computeDistance(wayPointListEnroute[wayPointListEnroute.length - 2].infos.coordinates, wayPointList[0].infos.coordinates);
                        for(var i=wayPointListEnroute.length-2; i > activeIndex; i--) {
                            var distance = Avionics.Utils.computeDistance(wayPointListEnroute[i].infos.coordinates, wayPointListEnroute[i-1].infos.coordinates);
                            cumDistance += distance;
                        }
                    }
                }
                if(this.index > 0) {
                    for(var i=this.index; i > 0; i--) {
                        distance = 0;
                        if(i < wayPointList.length)
                            var distance = Avionics.Utils.computeDistance(wayPointList[i].infos.coordinates, wayPointList[i-1].infos.coordinates);
                        cumDistance += distance;
                    }
                }
            }
        }
        return isNaN(cumDistance) ? "__._" : cumDistance.toFixed(1);
    }
}
class GPS_ActiveFPL extends MFD_ActiveFlightPlan_Element {
    constructor(_type = "530") {
        if(_type == "530")
            super(GPS_WaypointLine, GPS_ApproachWaypointLine, 7, 4);
        else
            super(GPS_WaypointLine, GPS_ApproachWaypointLine, 5, 4);
        this.emptyLine = '<td class="SelectableElement Select0">_____</td><td>___<div class="Align unit">&nbsp;o<br/>&nbsp;M</div></td><td>___<div class="Align unit">&nbsp;n<br/>&nbsp;m</div></td><td>__._<div class="Align unit">&nbsp;n<br/>&nbsp;m</div></td>';
    }
    init(_root) {
        super.init(_root);
        this.container.defaultMenu = new ContextualMenu("PAGE MENU", [
            new ContextualMenuElement("Activate&nbsp;Leg?", this.activateLegFromMenu.bind(this), this.isCurrentlySelectedNotALeg.bind(this)),
            new ContextualMenuElement("Crossfill?", this.FPLCrossfill_CB.bind(this), true),
            new ContextualMenuElement("Copy&nbsp;Flight&nbsp;Plan?", this.FPLCopyFlightPlan_CB.bind(this), true),
            new ContextualMenuElement("Invert&nbsp;Flight&nbsp;Plan?", this.FPLInvertFlightPlan_CB.bind(this), this.invertFlightPlanCB.bind(this)),
            new ContextualMenuElement("Delete&nbsp;Flight&nbsp;Plan?", this.FPLDeleteFlightPlan_CB.bind(this)),
            new ContextualMenuElement("Select&nbsp;Approach?", this.FPLSelectApproach_CB.bind(this)),
            new ContextualMenuElement("Select&nbsp;Arrival?", this.FPLSelectArrival_CB.bind(this)),
            new ContextualMenuElement("Select&nbsp;Departure?", this.FPLSelectDeparture_CB.bind(this)),
            new ContextualMenuElement("Remove&nbsp;Approach?", this.FPLRemoveApproach_CB.bind(this), this.removeApproachStateCB.bind(this)),
            new ContextualMenuElement("Remove&nbsp;Arrival?", this.FPLRemoveArrival_CB.bind(this), this.removeArrivalStateCB.bind(this)),
            new ContextualMenuElement("Remove&nbsp;Departure?", this.FPLRemoveDeparture_CB.bind(this), this.removeDepartureStateCB.bind(this)),
            new ContextualMenuElement("Closest&nbsp;Point&nbsp;of&nbsp;FPL?", this.FPLClosestPoint_CB.bind(this), true),
            new ContextualMenuElement("Change&nbsp;Fields?", this.FPLChangeFields_CB.bind(this), true),
            new ContextualMenuElement("Restore&nbsp;Defaults?", this.FPLRestoreDefaults_CB.bind(this), true),
        ]);
        this.newWaypointPage = new NavSystemPage("WaypointSelection", "WaypointSelection", new GPS_FPLWaypointSelection());
        this.newWaypointPage.pageGroup = (this.container).pageGroup;
        this.newWaypointPage.gps = this.gps;
        this.waypointWindow = this.newWaypointPage;
        this.savedFpl = new GPS_FlightPlanForSave(this.gps);
        this._t = 0;
    }
    onEnter() {
        this.gps.closeConfirmWindow();
        this.gps.closeAlertWindow();
    }
    onExit() {
        this.gps.closeConfirmWindow();
        this.gps.closeAlertWindow();
        if (this.gps.currentInteractionState == 1 && this.lines[this.fplSelectable.getIndex()].waypoint) {
            let infos = this.lines[this.fplSelectable.getIndex()].waypoint.GetInfos();                
            this.gps.lastRelevantICAO = infos.icao;
        }
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        this._t++;
        if(this._t > 30) {
            this._t = 0;
            this.savedFpl.save();
        }
        if (this.gps.currentInteractionState != 2) {
            this.selectedLine = null;
        }
        this.fplNumber = this.gps.getChildById("FlightPlanNumber");
        this.fplNumber.textContent = this.gps.fplNumber < 10 ? "0" + this.gps.fplNumber : this.gps.fplNumber;
    }

    onEvent(_event) {
        if (_event == "CLR_Push") {
            // Undisplay the menu
            if(this.gps.currentContextualMenu){
                this.gps.SwitchToInteractionState(0);
                this.gps.currentContextualMenu = null;
            }
        }
    }

    activateStateCB() {
        return this.selectedLine == null;
    }
    activateLegFromMenu() {
        let infos = this.lines[this.fplSelectable.getIndex()].waypoint.GetInfos();
        this.activateLeg(this.lines[this.fplSelectable.getIndex()].getIndex(), infos.icao);
        this.gps.SwitchToInteractionState(0);
    }
    activateLeg(_index, _icao) {
        // Check if the requested index is an approach index
        let is_approach_index = false;
        if (this.gps.currFlightPlanManager.isLoadedApproach() && _index < this.gps.currFlightPlanManager.getApproachWaypoints().length){
            let icao = this.gps.currFlightPlanManager.getApproachWaypoints()[_index].icao;
            if(icao == _icao){
                is_approach_index = true;                
            }
        }
        if(is_approach_index){
            if(!this.gps.currFlightPlanManager.isActiveApproach()){
                this.gps.alertWindow.element.setTexts("Activate approach first", "Ok");
                this.gps.switchToPopUpPage(this.gps.alertWindow, () => {
                    this.gps.SwitchToInteractionState(1);
                });
                return;
            }
        }
        this.gps.confirmWindow.element.setTexts("Confirm activate leg ?");
        this.gps.switchToPopUpPage(this.gps.confirmWindow, () => {
            if (this.gps.confirmWindow.element.Result == 1) {
                if(!is_approach_index){
                    // Activating a leg outside the approach deactive it
                    if(this.gps.currFlightPlanManager.isActiveApproach()){
                        Coherent.call("DEACTIVATE_APPROACH").then(() => {
                            // Do nothing
                        });
                    }
                }
                // Remove any direct to before activating leg
                if(this.gps.currFlightPlanManager.getIsDirectTo()){
                    this.gps.currFlightPlanManager.cancelDirectTo();
                }
                this.gps.currFlightPlanManager.setActiveWaypointIndex(_index);
                }
        });

    }
    isCurrentlySelectedNotALeg() {
        return this.lines[this.fplSelectable.getIndex()].getType() == MFD_WaypointType.empty;
    }

    removeApproachStateCB() {
        return this.gps.currFlightPlanManager.getApproachIndex() == -1;
    }
    removeArrivalStateCB() {
        return this.gps.currFlightPlanManager.getArrivalProcIndex() == -1;
    }
    removeDepartureStateCB() {
        return this.gps.currFlightPlanManager.getDepartureProcIndex() == -1;
    }
    FPLActivateLeg_CB() {
        if (this.selectedLine) {
            this.selectedLine.onEvent(0, "ActivateWaypoint");
        }
        this.gps.SwitchToInteractionState(0);
    }
    FPLCrossfill_CB() {
        this.gps.SwitchToInteractionState(0);
    }
    FPLCopyFlightPlan_CB() {
        this.gps.SwitchToInteractionState(0);
    }
    invertFlightPlanCB() {
        return this.gps.currFlightPlanManager.getActiveWaypointIndex() < 0;
    }
    FPLInvertFlightPlan_CB() {
        // Do that only if there is a valid active index (CTD otherwise ex with POI)
        if(this.gps.currFlightPlanManager.getActiveWaypointIndex() >= 0)
        {
            this.gps.currFlightPlanManager.invertActiveFlightPlan(() => {
                this.gps.currFlightPlanManager.updateFlightPlan(this.updateWaypoints.bind(this));
            });
        }
        this.gps.SwitchToInteractionState(0);
    }
    FPLDeleteFlightPlan_CB() {
        this.gps.confirmWindow.element.setTexts("Delete flight plan ?");
        this.gps.switchToPopUpPage(this.gps.confirmWindow, () => {
            if ((this.gps.confirmWindow.element.Result == 1) && (this.gps.currFlightPlanManager.getApproach() != null)) {
                this.gps.currFlightPlanManager.clearFlightPlan();
                this.gps.SwitchToInteractionState(0);
                if(this.fplSliderGroup)
                    this.fplSliderGroup.updateDisplay();
                this.gps.fplNumber = 0;
            }
        });
    }
    FPLSelectApproach_CB(_param) {
        this.gps.switchToPopUpPage(this.gps.selectApproachPage);
    }
    FPLSelectArrival_CB() {
        this.gps.switchToPopUpPage(this.gps.selectArrivalPage);
    }
    FPLSelectDeparture_CB() {
        this.gps.switchToPopUpPage(this.gps.selectDeparturePage);
    }
    FPLRemoveApproach_CB() {
        this.gps.confirmWindow.element.setTexts("Remove Approach ?");
        this.gps.switchToPopUpPage(this.gps.confirmWindow, () => {
            if ((this.gps.confirmWindow.element.Result == 1) && (this.gps.currFlightPlanManager.getApproach() != null)) {
                this.gps.currFlightPlanManager.setApproachIndex(-1, () => {
                    // This is to remove some kind of undefined display
                    this.fplSelectable.onSelection("NavigationLargeDec");
                });
            }
            this.gps.SwitchToInteractionState(0);
        });
    }
    FPLRemoveArrival_CB() {
        this.gps.confirmWindow.element.setTexts("Remove Arrival ?");
        this.gps.switchToPopUpPage(this.gps.confirmWindow, () => {
            if ((this.gps.confirmWindow.element.Result == 1) && (this.gps.currFlightPlanManager.getArrival() != null)) {
                this.gps.currFlightPlanManager.removeArrival(() => {
                    // This is to remove some kind of undefined display
                    this.fplSelectable.onSelection("NavigationLargeDec");
                });
            }
            this.gps.SwitchToInteractionState(0);
        });
    }
    FPLRemoveDeparture_CB() {
        this.gps.confirmWindow.element.setTexts("Remove Departure ?");
        this.gps.switchToPopUpPage(this.gps.confirmWindow, () => {
            if ((this.gps.confirmWindow.element.Result == 1) && (this.gps.currFlightPlanManager.getDeparture() != null)) {
                this.gps.currFlightPlanManager.removeDeparture(() => {
                    // This is to remove some kind of undefined display
                    this.fplSelectable.onSelection("NavigationLargeDec");
                });
            }
            this.gps.SwitchToInteractionState(0);
        });
    }
    removeWaypoint(_index) {
        let savedIndex = this.fplSelectable.index;
        let savedOffset = this.fplSelectable.offset;
        this.gps.currFlightPlanManager.removeWaypoint(_index, true, () => {
            this.updateWaypoints.bind(this);
            // This is to remove some kind of undefined display
            this.fplSelectable.onSelection("NavigationLargeDec");
            setTimeout(() => {
                this.fplSelectable.index = savedIndex;
                this.fplSelectable.offset = savedOffset;
            }, 2000);
        });
    }
    FPLClosestPoint_CB() {
        this.gps.SwitchToInteractionState(0);
    }
    FPLChangeFields_CB() {
        this.gps.SwitchToInteractionState(0);
    }
    FPLRestoreDefaults_CB() {
        this.gps.SwitchToInteractionState(0);
    }
    onWaypointSelectionEnd() {
        if (this.gps.lastRelevantICAO) {
            // Workaraound to the insert waypoint broken in sim
            this.savedFpl.save();
            if(this.savedFpl.canAdd(this.selectedIndex, true)) {
                this.gps.confirmWindow.element.setTexts("Add waypoint ?");
                this.gps.switchToPopUpPage(this.gps.confirmWindow, () => {
                    if (this.gps.confirmWindow.element.Result == 1) {
                        let savedIndex = this.fplSelectable.index;
                        let savedOffset = this.fplSelectable.offset;
                        if(this.savedFpl.AddWaypoint(this.gps.lastRelevantICAO, this.selectedIndex)) {
                            let navmode = 0;
                            if(SimVar.GetSimVarValue("AUTOPILOT NAV1 LOCK", "boolean"))
                                navmode = 1;
                            if(SimVar.GetSimVarValue("AUTOPILOT APPROACH HOLD", "boolean"))
                                navmode = 2;
                            this.savedFpl.load(navmode);
                            // Try restoring cursor
                            // Must press manually the navigation button to get it back
                            this.gps.SwitchToInteractionState(0);
                            setTimeout(() => {
                                this.fplSelectable.index = savedIndex;
                                this.fplSelectable.offset = savedOffset;
                                this.fplSelectable.onEvent("NavigationLargeInc");
                            }, 2000);
                        }
                    }
                });
            }
            // this.gps.confirmWindow.element.setTexts("Add waypoint ?");
            // this.gps.switchToPopUpPage(this.gps.confirmWindow, () => {
            //     if (this.gps.confirmWindow.element.Result == 1) {
            //         this.gps.currFlightPlanManager.addWaypoint(this.gps.lastRelevantICAO, this.selectedIndex, () => {
            //             if (!this.gps.popUpElement) {
            //                 this.updateWaypoints();
            //                 this.gps.ActiveSelection(this.defaultSelectables);
            //                 this.fplSelectable.incrementIndex();
            //             }
            //         });
            //     }
            // });
        }
        if (!this.gps.popUpElement) {
            this.gps.ActiveSelection(this.defaultSelectables);
        }
    }
    FPLConfirmDeleteYes_CB() {
        SimVar.SetSimVarValue("C:fs9gps:FlightPlanDeleteWaypoint", "number", this.fplSliderGroup.getIndex());
        this.gps.currFlightPlan.FillWithCurrentFP();
        this.gps.SwitchToInteractionState(0);
    }
    FPLConfirmDeleteNo_CB() {
        this.gps.SwitchToInteractionState(0);
    }
}

class GPS_FPLWaypointSelection extends NavSystemElement {
    constructor() {
        super();
        this.name = "WaypointSelection";
        this.preventRemove = false;
    }
    init(_root) {
        this.root = _root;
        this.icao = this.gps.getChildById("WPSIcao");
        this.airportPrivateLogo = this.gps.getChildById("WPSAirportPrivateLogo");
        this.region = this.gps.getChildById("WPSRegion");
        this.facilityName = this.gps.getChildById("WPSFacilityName");
        this.city = this.gps.getChildById("WPSCity");
        this.posNS = this.gps.getChildById("WPSPosNS");
        this.posEW = this.gps.getChildById("WPSPosEW");
        this.accept = this.gps.getChildById("WPSAccept");
        this.icaoSearchField = new SearchFieldWaypointICAO(this.gps, [this.icao], this.gps, "AWNV");
        // No search by facility for now because not working well
        // this.nameSearchField = new SearchFieldWaypointName(this.gps, [this.facilityName], this.gps, "AWNV", this.icaoSearchField);
        this.icaoSearchField.init();
        this.defaultSelectables = [
            new SelectableElement(this.gps, this.icao, this.searchField_SelectionCallback.bind(this)),
            // No search by facility for now because not working well
            // new SelectableElement(this.gps, this.facilityName, this.facilityName_SelectionCallback.bind(this)),
        ];
        this.duplicateWaypoints = new NavSystemElementContainer("Duplicate Waypoints", "DuplicateWaypointWindow", new MFD_DuplicateWaypoint());
        this.duplicateWaypoints.setGPS(this.gps);
        this.duplicateWaypoints.element.icaoSearchField = this.icaoSearchField;
        this.preventRemove = false;
        this.initialUpdate = true;
    }
    onEnter() {
        if (this.gps.lastRelevantICAO) {
            this.icaoSearchField.SetWaypoint(this.gps.lastRelevantICAOType, this.gps.lastRelevantICAO);
        }
        else if (this.gps.icaoFromMap) {
            this.icaoSearchField.SetWaypoint(this.gps.icaoFromMap[0], this.gps.icaoFromMap);
        }
        this.gps.closeConfirmWindow();
        this.gps.closeAlertWindow();
        this.preventRemove = false;
        this.root.setAttribute("state", "Active");
    }
    onUpdate(_deltaTime) {
        if(this.initialUpdate){
            this.gps.ActiveSelection(this.defaultSelectables);
            this.gps.cursorIndex = 0;
            this.initialUpdate = false;
        }
        var infos = this.icaoSearchField.getWaypoint() ? this.icaoSearchField.getWaypoint().infos : new WayPointInfo(this.gps);
        if (infos && infos.icao != '') {
            this.icao.textContent = infos.icao;
            var logo = infos.imageFileName();
            if (logo != "") {
                this.airportPrivateLogo.innerHTML = '<img src="/Pages/VCockpit/Instruments/Shared/Map/Images/' + logo + '" class="imgSizeM"/>';
            }
            else{
                this.airportPrivateLogo.innerHTML = '';
            }
            this.region.textContent = infos.region;
            this.facilityName.textContent = infos.name;
            this.city.textContent = infos.city;
            this.posNS.textContent = this.gps.latitudeFormat(infos.coordinates.lat);
            this.posEW.textContent = this.gps.longitudeFormat(infos.coordinates.long);
        }
        else {
            this.icao.textContent = "_____";
            this.region.textContent = "__________";
            this.facilityName.textContent = "______________________";
            this.city.textContent = "______________________";
            this.posNS.textContent = "_ __°__.__'";
            this.posEW.textContent = "____°__.__'";
        }
        this.icaoSearchField.Update();
        // No search by facility for now because not working well
        // this.nameSearchField.Update();
    }
    onExit() {
        this.gps.closeConfirmWindow();
        this.gps.closeAlertWindow();
        this.initialUpdate = true;
        this.root.setAttribute("state", "Inactive");
    }
    onEvent(_event) {
        if (_event == "CLR_Push" || _event == "CLR") {
            this.preventRemove = true;
        }
        if (_event == "DRCT_Push"
            || _event == "FPL_Push"
            || _event == "PROC_Push"
            || _event == "DirectTo_Push"
            || _event == "MSG_Push"
            || _event == "VNAV_Push"
            || _event == "CLR_Push_Long") {
            this.gps.lastRelevantICAO = null;
            this.gps.lastRelevantICAOType = null;
            this.gps.closePopUpElement();
        }
        if (_event == "CLR_Push") {
            if(this.icaoSearchField.isActive){
                this.icaoSearchField.isActive = false;
                this.gps.SwitchToInteractionState(1);
            }
            else {
                this.gps.lastRelevantICAO = null;
                this.gps.lastRelevantICAOType = null;
                this.gps.closePopUpElement();
            }
        }
        if (_event == "NavigationPush" || _event == "MENU_Push") {
            // Stay in selection state
            this.gps.requestCall(() => {
                this.gps.ActiveSelection(this.defaultSelectables);
                this.gps.SwitchToInteractionState(1);
                this.gps.cursorIndex = 0;
            });
        }
    }
    searchField_SelectionCallback(_event) {
        if (_event == "ENT_Push") {
            var infos = this.icaoSearchField.getUpdatedInfos();
            this.gps.lastRelevantICAO = infos.icao;
            this.gps.lastRelevantICAOType = infos.getWaypointType();
            this.gps.closePopUpElement();
        }
        if (_event == "RightSmallKnob_Right" || _event == "RightSmallKnob_Left") {
            this.gps.currentSearchFieldWaypoint = this.icaoSearchField;
            let infos = this.icaoSearchField.getWaypoint() ? this.icaoSearchField.getWaypoint().infos : new WayPointInfo(this.gps);
            if (infos && infos.icao != '') {
                this.gps.lastRelevantICAO = infos.icao;
            }
            var entryType = -1;
            if(_event == "RightSmallKnob_Left")
                entryType = 1;
            this.icaoSearchField.StartSearch(this.onSearchEnd.bind(this), entryType);
            this.gps.SwitchToInteractionState(3);
        }
    }
    facilityName_SelectionCallback(_event) {
        if (_event == "RightSmallKnob_Right" || _event == "RightSmallKnob_Left") {
            this.gps.currentSearchFieldWaypoint = this.nameSearchField;
            this.nameSearchField.StartSearch(this.onSearchEnd.bind(this));
            this.gps.SwitchToInteractionState(3);
        }
    }
    onSearchEnd() {
        if (this.icaoSearchField.duplicates && this.icaoSearchField.duplicates.length > 0) {
            this.gps.lastRelevantICAO = null;
            this.gps.lastRelevantICAOType = null;
            this.gps.switchToPopUpPage(this.duplicateWaypoints, this.gps.popUpCloseCallback);
        }
        else {
            var infos = this.icaoSearchField.getUpdatedInfos();
            this.gps.lastRelevantICAO = infos.icao;
            this.gps.lastRelevantICAOType = infos.getWaypointType();
            this.gps.closePopUpElement();
        }
    }
    acceptButton_SelectionCallback(_event) {
        if (_event == "ENT_Push") {
            var infos = this.icaoSearchField.getUpdatedInfos();
            this.gps.lastRelevantICAO = infos.icao;
            this.gps.lastRelevantICAOType = infos.getWaypointType();
            this.gps.closePopUpElement();
        }
    }
}


class GPS_FPLCatalog extends NavSystemElement {
    constructor(_type = "530") {
        super();
        this.name = "FPLCatalog";
        this.nbElemsMax = 7;
        if(_type == "430")
            this.nbElemsMax = 5;
        this.fplList = new FPLCatalog();
    }
    init() {
        this.sliderElement = this.gps.getChildById("SliderFPLCatalog");
        this.sliderCursorElement = this.gps.getChildById("SliderFPLCatalogCursor");
        this.used = this.gps.getChildById("FPLCatalogUsed");
        this.empty = this.gps.getChildById("FPLCatalogEmpty");

        this.fplsSliderGroup = new SelectableElementSliderGroup(this.gps, [], this.sliderElement, this.sliderCursorElement);
        for (let i = 0; i < this.nbElemsMax; i++) {
            this.fplsSliderGroup.addElement(new SelectableElement(this.gps, this.gps.getChildById("FPL_Catalog_" + i), this.fpl_SelectionCallback.bind(this)));
        }
        this.defaultSelectables = [this.fplsSliderGroup];
        this.realindex = -1;
    }
    onEnter() {
        this.gps.closeConfirmWindow();
        this.gps.closeAlertWindow();
        this.fplList.load();
    }
    onUpdate(_deltaTime) {
        var lines = [];
        var numItems = 0;
        var i = 0;
        for (i = 0; i < 19; i++) {
            let item = this.fplList.fpls[i];
            let itemIndex = item.index < 10 ? "0" + item.index : item.index;
            if(item.xmlFpl != null && item.departure != "" && item.destination != ""){
                var line = '<td class="SelectableElement">' + itemIndex + "</td><td>" + item.departure + " / " + item.destination + "</td>";
                numItems++;
                lines.push(line);
            }
        }
        // Write the blank lines
        for (i = numItems; i < 19; i++) {
            var line = '<td class="SelectableElement">__</td><td>_____ / _____</td>';
            lines.push(line);
        }
        this.fplsSliderGroup.setStringElements(lines);
        this.used.textContent = numItems;
        this.empty.textContent = 19-numItems;

    }
    onExit() {
        this.gps.closeConfirmWindow();
        this.gps.closeAlertWindow();
    }
    onEvent(_event) {
    }
    fpl_SelectionCallback(_event, _index) {
        let fpl = this.fplList.fpls[this.realindex];
        switch (_event) {
            case "ENT_Push":
                this.realindex = this.fplList.getIndexFromDisplay(_index);
                if(this.realindex != -1)
                {
                    this.gps.confirmWindow.element.setTexts("Load flight plan ?");
                    this.gps.switchToPopUpPage(this.gps.confirmWindow, () => {
                        if (this.gps.confirmWindow.element.Result == 1) {
                            this.gps.fplNumber = 0;
                            this.clearFlightPlan(this.onClearFlightPlan.bind(this));
                        }
                    });
                }
                else {
                    this.gps.SwitchToInteractionState(1);
                }
                return true;
        }
    }
    clearFlightPlan(callback = EmptyCallback.Void) {
        if(this.gps.currFlightPlanManager.getDestination())
            this.gps.currFlightPlanManager.setApproachIndex(-1);
        Coherent.call("CLEAR_CURRENT_FLIGHT_PLAN").then(() => {
            this.gps.currFlightPlanManager.updateFlightPlan(() => {
                this.gps.currFlightPlanManager.updateCurrentApproach(() => {
                    this.gps.currFlightPlanManager.instrument.requestCall(callback);
                });
            });
        });
    }
    onClearFlightPlan() {
        let fpl = this.fplList.fpls[this.realindex];
        this.addWaypoints(this.onAfterAddWaypoints.bind(this));
    }
    addWaypoints(callback = EmptyCallback.Void) {
        let fpl = this.fplList.fpls[this.realindex];
        for(var i=0; i<fpl.icaoWaypoints.length; i++){
            Coherent.call("ADD_WAYPOINT", fpl.icaoWaypoints[i], i, true).then(() => {
            });
        }
        this.gps.currFlightPlanManager.instrument.requestCall(callback);
    }
    onAddWaypoint() {
    }
    onAfterAddWaypoints() {
        this.gps.currFlightPlanManager.updateFlightPlan(this.onFinalProcess.bind(this));
    }
    onFinalProcess() {
        this.setDeparture();
        this.setArrival();
        this.setApproach();
        this.gps.fplNumber = this.realindex + 1;
        // We must go back to the FPL page
        var pageGroup = null;
        for (let i = 0; i < this.gps.eventLinkedPageGroups.length; i++) {
            var pageGroup = this.gps.eventLinkedPageGroups[i].pageGroup;
            if(this.gps.eventLinkedPageGroups[i].pageGroup.name == "FPL") {
                pageGroup = this.gps.eventLinkedPageGroups[i].pageGroup;
                break;
            }
        }
        if(pageGroup != null) {
            for (let i = 0; i < pageGroup.pages.length; i++) {
                if (pageGroup.pages[i].name == "ActiveFPL") {
                    pageGroup.pageIndex = i;
                    break;
               }
            }
            this.gps.currentEventLinkedPageGroup = null;
            this.gps.SwitchToInteractionState(0);
            this.gps.computeEvent("FPL_Push");
        }
    }

    setDeparture() {
        var origin = this.gps.currFlightPlanManager.getOrigin();
        let infos = origin.GetInfos();
        if(infos instanceof AirportInfo)
        {
            let fpl = this.fplList.fpls[this.realindex];
            let indexdeparture = -1;
            for (let i = 0; i < infos.departures.length; i++) {
                if(infos.departures[i].name == fpl.sid) {
                    indexdeparture = i;
                    break;
                }
            }
            if(indexdeparture >= 0) {
                this.gps.currFlightPlanManager.setDepartureProcIndex(indexdeparture);
                this.gps.currFlightPlanManager.setDepartureRunwayIndex(0);
                this.gps.currFlightPlanManager.setDepartureEnRouteTransitionIndex(0, () => {
                    let elem = this.gps.getElementOfType(MFD_ActiveFlightPlan_Element);
                    if (elem) {
                        elem.updateWaypoints();
                    }
                });
            }
        }
    }
    setArrival() {
        var destination = this.gps.currFlightPlanManager.getDestination();
        let infos = destination.GetInfos();
        if(infos instanceof AirportInfo)
        {
            let fpl = this.fplList.fpls[this.realindex];
            let indexarrival = -1;
            for (let i = 0; i < infos.arrivals.length; i++) {
                if(infos.arrivals[i].name == fpl.star) {
                    indexarrival = i;
                    break;
                }
            }
            if(indexarrival >= 0) {
                this.gps.currFlightPlanManager.setArrivalProcIndex(indexarrival);
                this.gps.currFlightPlanManager.setArrivalRunwayIndex(0);
                this.gps.currFlightPlanManager.setArrivalEnRouteTransitionIndex(0, () => {
                    let elem = this.gps.getElementOfType(MFD_ActiveFlightPlan_Element);
                    if (elem) {
                        elem.updateWaypoints();
                    }
                });
            }
        }
    }

    setApproach() {
        var destination = this.gps.currFlightPlanManager.getDestination();
        let infos = destination.GetInfos();
        if(infos instanceof AirportInfo)
        {
            let fpl = this.fplList.fpls[this.realindex];
            let rw = fpl.approachrw;
            if(fpl.approachrwdes.toUpperCase() != "")
                rw += fpl.approachrwdes.toUpperCase()[0];
            else
                rw += " ";
            let searchapproach = fpl.approach + " " + rw;
            if(fpl.approachsuffix.length)
                searchapproach += " " + fpl.approachsuffix;
            let indexapproach = -1;
            for (let i = 0; i < infos.approaches.length; i++) {
                if(infos.approaches[i].name == searchapproach) {
                    indexapproach = i;
                    break;
                }
            }
            if(indexapproach >= 0) {
                let approach = infos.approaches[indexapproach];
                let indextransition = -1;
                for (let i = 0; i < approach.transitions.length; i++) {
                    if(approach.transitions[i].name == fpl.approachtr) {
                        indextransition = i;
                        break;
                    }
                }
                if(indextransition >= 0) {
                    this.gps.currFlightPlanManager.setApproachIndex(indexapproach, () => {
                        let elem = this.gps.getElementOfType(MFD_ActiveFlightPlan_Element);
                        if (elem) {
                            elem.updateWaypoints();
                        }
                    }, indextransition);
                }
            }
        }
    }
}


class FPLCatalog {
    constructor() {
        this.fpls = null;
    }
    load(){
        this.fpls = [];
        for(var i=1; i<20; i++){
            var item = new FPLCatalogItem(i);
            item.load();
            this.fpls.push(item);
        }
    }
    getIndexFromDisplay(displayIndex){
        let index = 0;
        var i;
        for(var i=0; i<19; i++){
            var item = this.fpls[i];
            if(item.xmlFpl != null && item.departure != "" && item.destination != ""){
                if(index == displayIndex)
                    break;
                index++;
            }
        }
        if(i == 19)
            return -1;
        return i;
    }
}


class FPLCatalogItem {
    constructor(_index) {
        this.index = _index;
        this.xmlFpl = null;
        this.departure = "";
        this.destination = "";
        this.sid = "";
        this.sidrw = "";
        this.star = "";
        this.approach = "";
        this.approachsuffix = "";
        this.approachrw = "";
        this.approachrwdes = "";
        this.approachtr = "";
        this.icaoWaypoints = [];
        this.previousIcao = "";
    }
    load(){
        this.xmlFpl = null;
        this.icaoWaypoints = [];
        this.departure = "";
        this.destination = "";
        this.sid = "";
        this.sidrw = "";
        this.star = "";
        this.approach = "";
        this.approachsuffix = "";
        this.approachrw = "";
        this.approachrwdes = "";
        this.approachtr = "";
        this.icaoWaypoints = [];
        this.ident = "";
        this.loadXml("fpl" + this.index + ".pln").then((xmlFpl) => {
            this.xmlFpl = xmlFpl;
            let fpl = xmlFpl.getElementsByTagName("FlightPlan.FlightPlan");
            if(fpl.length > 0){
                this.departure = fpl[0].getElementsByTagName("DepartureID")[0] ? fpl[0].getElementsByTagName("DepartureID")[0].textContent : "";
                this.destination = fpl[0].getElementsByTagName("DestinationID")[0] ? fpl[0].getElementsByTagName("DestinationID")[0].textContent : "";
                let waypoints = fpl[0].getElementsByTagName("ATCWaypoint");
                for (let i = 0; i < waypoints.length; i++) {
                    let waypointroot = waypoints[i];
                    let type = waypointroot.getElementsByTagName("ATCWaypointType")[0] ? waypointroot.getElementsByTagName("ATCWaypointType")[0].textContent : "";
                    let sid = waypointroot.getElementsByTagName("DepartureFP")[0] ? waypointroot.getElementsByTagName("DepartureFP")[0].textContent : "";
                    if(this.sid == "" && sid != "") {
                        this.sid = sid;
                        let sidrw = waypointroot.getElementsByTagName("RunwayNumberFP")[0] ? waypointroot.getElementsByTagName("RunwayNumberFP")[0].textContent : "";
                        if(sid != "")
                            this.sidrw = sidrw;
                    }
                    let star = waypointroot.getElementsByTagName("ArrivalFP")[0] ? waypointroot.getElementsByTagName("ArrivalFP")[0].textContent : "";
                    if(this.star == "" && star != "") {
                        this.star = star;
                    }
                    if(i==waypoints.length-1) {
                        // Check for approach
                        let approach = waypointroot.getElementsByTagName("ApproachTypeFP")[0] ? waypointroot.getElementsByTagName("ApproachTypeFP")[0].textContent : "";
                        if(approach != "")
                            this.approach = approach;
                            let approachrw = waypointroot.getElementsByTagName("RunwayNumberFP")[0] ? waypointroot.getElementsByTagName("RunwayNumberFP")[0].textContent : "";
                            if(approachrw != "")
                                this.approachrw = approachrw;
                            let approachrwdes = waypointroot.getElementsByTagName("RunwayDesignatorFP")[0] ? waypointroot.getElementsByTagName("RunwayDesignatorFP")[0].textContent : "";
                            if(approachrwdes != "")
                                this.approachrwdes = approachrwdes;
                            let approachsuffix = waypointroot.getElementsByTagName("SuffixFP")[0] ? waypointroot.getElementsByTagName("SuffixFP")[0].textContent : "";
                            if(approachsuffix != "")
                                this.approachsuffix = approachsuffix;
                            // Transition is the last enroute ident
                            this.approachtr = this.ident;
                            while(this.approachtr.length < 5)
                                this.approachtr += " ";
                    }
                    let icao = waypointroot.getElementsByTagName("ICAO")[0];
                    if(icao){
                        let ident = icao.getElementsByTagName("ICAOIdent")[0] ? icao.getElementsByTagName("ICAOIdent")[0].textContent : "";
                        this.ident = ident;
                        // Prepare icao format TRRRRRRIIIII each part with right leading 0s (T=Type, R=Region, I=Ident)
                        while(ident.length < 5)
                            ident += " ";
                        let region = icao.getElementsByTagName("ICAORegion")[0] ? icao.getElementsByTagName("ICAORegion")[0].textContent : "";
                        while(region.length < 6)
                            region += " ";
                        let typeletter = "W";
                        type = type.toUpperCase();
                        if(type == "AIRPORT")
                            typeletter = "A";
                        else if(type == "VOR")
                            typeletter = "V";
                        else if(type == "NDB")
                            typeletter = "N";
                        let icaoString = typeletter + region + ident;
                        if((sid == "") && (star == "")) {
                            // Do not add waypoints that are part of sid or star
                            this.icaoWaypoints.push(icaoString);
                        }
                    }
                    if(icao)
                        this.previousIcao = icao;
                }
            }
        });
    }
    loadXml(filename) {
        return new Promise((resolve) => {
            var milliseconds = new Date().getTime().toString();
            this.loadFile("/VFS/fpl530/" + filename + "?id=" + milliseconds, (text) => {
                let parser = new DOMParser();
                let out = parser.parseFromString(text, "text/xml");
                resolve(out);
            });
        });
    }
    loadFile(file, callbackSuccess) {
        let httpRequest = new XMLHttpRequest();
        httpRequest.onreadystatechange = function (data) {
            if (this.readyState === XMLHttpRequest.DONE) {
                let loaded = this.status === 200 || this.status === 0;
                if (loaded) {
                    callbackSuccess(this.responseText);
                }
            }
        };
        httpRequest.open("GET", file);
        httpRequest.send();
    }
}

// Used to save and restore flight plan in memory
class GPS_FlightPlanForSave {
    constructor(_gps) {
        this.gps = _gps;
        this.origin;
        this.destination;
        this.enrouteWaypoints;
        this.departureIndex;
        this.departureTransitionIndex;
        this.departureRunwayIndex;
        this.arrivalIndex;
        this.arrivalTransitionIndex;
        this.arrivalRunwayIndex;
        this.approachIndex;
        this.approachTransitionIndex;
        this.activateNav = 0;   // 1 is NAV and 2 is APPROACH
        this.indexInEnroute = -1;
        this.changeOrigin = false;
        this.changeDestination = false;
        this.message = "";
    }
    save() {
        this.origin = this.gps.currFlightPlanManager.getOrigin();
        this.destination = this.gps.currFlightPlanManager.getDestination();
        this.enrouteWaypoints = this.gps.currFlightPlanManager.getEnRouteWaypoints();
        this.departureIndex = this.gps.currFlightPlanManager.getDepartureProcIndex();
        this.departureTransitionIndex = this.gps.currFlightPlanManager.getDepartureEnRouteTransitionIndex();
        this.departureRunwayIndex = this.gps.currFlightPlanManager.getDepartureRunwayIndex();
        this.arrivalIndex = this.gps.currFlightPlanManager.getArrivalProcIndex();
        this.arrivalTransitionIndex = this.gps.currFlightPlanManager.getArrivalTransitionIndex();
        this.arrivalRunwayIndex = 0;
        this.approachIndex = this.gps.currFlightPlanManager.getApproachIndex();
        this.approachTransitionIndex = this.gps.currFlightPlanManager.getApproachTransitionIndex();
    }
    load(activateNav = 0) {
        this.activateNav = activateNav;
        this.clearFlightPlan(this.onClearFlightPlan.bind(this));
    }

    clearFlightPlan(callback = EmptyCallback.Void) {
        if(this.gps.currFlightPlanManager.getDestination())
            this.gps.currFlightPlanManager.setApproachIndex(-1);
        Coherent.call("CLEAR_CURRENT_FLIGHT_PLAN").then(() => {
            this.gps.currFlightPlanManager.updateFlightPlan(() => {
                this.gps.currFlightPlanManager.updateCurrentApproach(() => {
                    this.gps.currFlightPlanManager.instrument.requestCall(callback);
                });
            });
        });
    }
    onClearFlightPlan() {
        this.addWaypoints(this.onAfterAddWaypoints.bind(this));
    }
    addWaypoints(callback = EmptyCallback.Void) {
        var indexfpl= 0;
        if(this.origin) {
            Coherent.call("ADD_WAYPOINT", this.origin.icao, 0, true).then(() => {
            });
            indexfpl++;
        }
        for(var i= 0; i<this.enrouteWaypoints.length; i++, indexfpl++) {
            Coherent.call("ADD_WAYPOINT", this.enrouteWaypoints[i].icao, indexfpl, true).then(() => {
            });
        }
        if(this.destination) {
            Coherent.call("ADD_WAYPOINT", this.destination.icao, indexfpl, true).then(() => {
            });
        }
        this.gps.currFlightPlanManager.instrument.requestCall(callback);
    }

    // To be called before load
    AddWaypoint(icao, index) {
        if(!this.canAdd(index))
            return false;
        if(this.changeOrigin) {
            // If changing origin, the old origin becomes the first enroute wp 
            let newicao = "";
            if (this.origin)
                newicao = this.origin.icao;
            else
                this.origin = new WayPoint(this.gps);
            this.origin.icao = icao;
            this.origin.UpdateInfos();
            icao = newicao;
            if(!icao.length)
                return true;
            this.indexInEnroute = 0;
        }
        if(this.changeDestination) {
            // If changing destination, the old destination becomes the last enroute wp 
            let newicao = "";
            if (this.destination)
                newicao = this.destination.icao;
            this.destination.icao = icao;
            this.destination.UpdateInfos();
            icao = newicao;
            if(!icao.length)
                return true;
            this.indexInEnroute = this.enrouteWaypoints.length;
        }
        if(this.indexInEnroute >= 0 && icao.length) {
            var waypoint = new WayPoint(this.gps);
            waypoint.icao = icao;
            waypoint.UpdateInfos();
            if(this.indexInEnroute >= this.enrouteWaypoints.length) {
                // Add at the end of enroute
                this.enrouteWaypoints.push(waypoint);
                return true;
            }
            else {
                // Insert at given index
                this.enrouteWaypoints.splice(this.indexInEnroute, 0, waypoint);
                return true;
            }
        }
        return false;
    }

    canAdd(index, withMessage = false) {
        this.indexInEnroute = -1;
        this.changeOrigin = false;
        this.changeDestination = false;
        this.message = "";
//        console.log("index:" + index);
        // If no origin , the flight plan is empty
        // We can add at index 0
        if(!this.origin)
        {
//            console.log("no origin");
            if(index == 0) {
//                console.log("no origin, adding origin");
                this.changeOrigin = true;
                return true;
            }
            this.message = "Add waypoint: bad index";
//            console.log("no origin, can only add at index 0");
            if(withMessage)
                this.setMessage();
            return false;
        }
        // If no destination , the flight plan has just one item
        // We can add at index 0 and 1
        if(!this.destination)
        {
//            console.log("no destination");
            if(index > 1) {
                this.message = "Add waypoint: bad index";
//                console.log("no destination, can only add at index 0 and 1");
                if(withMessage)
                    this.setMessage();
                return false;
            }
            if(index == 0) {
                this.changeOrigin = true;
//                console.log("no destination, changing origin and destination");
            }
            if(index == 1) {
//                console.log("no destination, adding destination");
                this.indexInEnroute = 0;
            }
            return true;
        }
        // Now we have origin and destination

        // Case insert before origin (new origin)
        if(index == 0) {
            if(this.departureIndex >= 0) {
                this.message = "Add waypoint: remove departure first";
//                console.log("cannot change origin if departure");
                if(withMessage)
                    this.setMessage();
                return false;
            }
//            console.log("new origin");
            this.changeOrigin = true;
            return true;
        }
//        console.log("depwpcount:" + this.gps.currFlightPlanManager.getDepartureWaypointsCount());
//        console.log("enroutewpcount:" + this.gps.currFlightPlanManager.getEnRouteWaypoints().length);
        let firstIndex = this.gps.currFlightPlanManager.getDepartureWaypointsCount()+1;
        let lastIndex = firstIndex + this.gps.currFlightPlanManager.getEnRouteWaypoints().length+1;
//        console.log("firstIndex:" + firstIndex);
//        console.log("lastIndex:" + lastIndex);
        // Case insert after destination
        if(index >= lastIndex){
            if(this.arrivalIndex >= 0 || this.approachIndex >= 0) {
                this.message = "Add waypoint: remove dep/arr first";
//                console.log("cannot add after destination if arrival or approach");
                if(withMessage)
                    this.setMessage();
                return false;
            }
            if(index > lastIndex + 1) {
                this.message = "Add waypoint: bad index";
//                console.log("index greater than last index");
                if(withMessage)
                    this.setMessage();
                return false;
            }
        }
//        console.log("depwpcount:" + this.gps.currFlightPlanManager.getDepartureWaypointsCount());
//        console.log("enroutewpcount:" + this.gps.currFlightPlanManager.getEnRouteWaypoints().length);
        // We can add to enroute only, not in procedure
        if(index < firstIndex || index > lastIndex) {
            this.message = "Add waypoint: bad index";
//            console.log("can add only into enroute");
            if(withMessage)
                this.setMessage();
            return false;
        }
        this.indexInEnroute = index-firstIndex;
        if(this.indexInEnroute > this.gps.currFlightPlanManager.getEnRouteWaypoints().length) {
//            console.log("Changing destination");
            this.changeDestination = true;
            this.indexInEnroute = -1;
        }
//        console.log("numenroutewp:" + this.gps.currFlightPlanManager.getEnRouteWaypoints().length);
//        console.log("indexInEnroute:" + this.indexInEnroute);
        return true;
    }
    setMessage() {
        this.gps.attemptAddWp++;
        setTimeout(() => {
            this.gps.attemptAddWp--;
            if(this.gps.attemptAddWp < 0)
                this.gps.attemptAddWp = 0;
        }, 20000);
    }

    onAfterAddWaypoints() {
        this.gps.currFlightPlanManager.updateFlightPlan(this.onFinalProcess.bind(this));
    }
    onFinalProcess() {
        this.setDeparture();
        this.setArrival();
        this.setApproach(this.setNav.bind(this));
    }

    setNav() {
        if(this.activateNav) {
            if (SimVar.GetSimVarValue("AUTOPILOT APPROACH HOLD", "boolean"))
                return;
            SimVar.SetSimVarValue("L:AP_LNAV_ACTIVE", "number", 1);
            if(this.activateNav == 1)
                SimVar.SetSimVarValue("K:AP_NAV1_HOLD_ON", "number", 1);
            if(this.activateNav == 2)
                SimVar.SetSimVarValue("K:AP_APR_HOLD_ON", "number", 1);
        }
    }

    setDeparture() {
        if(!this.origin)
            return;
        let infos = this.origin.GetInfos();
        if(infos instanceof AirportInfo && this.departureIndex >= 0)
        {
            this.gps.currFlightPlanManager.setDepartureProcIndex(this.departureIndex);
            this.gps.currFlightPlanManager.setDepartureRunwayIndex(this.departureRunwayIndex);
            this.gps.currFlightPlanManager.setDepartureEnRouteTransitionIndex(this.departureTransitionIndex, () => {
                let elem = this.gps.getElementOfType(MFD_ActiveFlightPlan_Element);
                if (elem) {
                    elem.updateWaypoints();
                }
            });
        }
    }
    setArrival() {
        if(!this.destination)
            return;
        let infos = this.destination.GetInfos();
        if(infos instanceof AirportInfo && this.arrivalIndex >= 0)
        {
            this.gps.currFlightPlanManager.setArrivalProcIndex(this.arrivalIndex);
            this.gps.currFlightPlanManager.setArrivalRunwayIndex(this.arrivalRunwayIndex);
            this.gps.currFlightPlanManager.setArrivalEnRouteTransitionIndex(this.arrivalTransitionIndex, () => {
                let elem = this.gps.getElementOfType(MFD_ActiveFlightPlan_Element);
                if (elem) {
                    elem.updateWaypoints();
                }
            });
        }
    }

    setApproach(callback = EmptyCallback.Void) {
        if(!this.destination) {
            if(callback)
                callback();
            return;
        }
        let infos = this.destination.GetInfos();
        if(infos instanceof AirportInfo && this.approachIndex >= 0 && this.approachTransitionIndex >= 0)
        {
            this.gps.currFlightPlanManager.setApproachIndex(this.approachIndex, () => {
                let elem = this.gps.getElementOfType(MFD_ActiveFlightPlan_Element);
                if (elem) {
                    elem.updateWaypoints();
                }
                if(callback)
                    callback();
            }, this.approachTransitionIndex);
        }
        else {
            if(callback)
                callback();
        }
    }
}

