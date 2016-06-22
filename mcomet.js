/**
 * @name Comets for V3
 * @version 1.0.0 [June 22, 2016]
 * @author Daniel Marcus 
 * @copyright Copyright 2016 Daniel Marcus
 *  <p>
 *  Comets shows an animated svg graphic with a trail that moves from
 *  a startint marker towards an ending marker.
 *  <p>
 */

/*!
 *
 * Licensed under the GNU General Public License, Version 3.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
* Comet object
*/
var Comet = function(map){

    //google map object required
    this.map                 = map;

    //marker positions
    this.lat1                = 0;
    this.lng1                = 0;
    this.lat2                = 0;
    this.lng2                = 0;

    // animation
    this.aniRepeat           = true; // loop comet animation
    this.cometRemove         = true  // remove after animation

    //comet properties
    this.cometSymbol         = 'M12,0a12,12 0 1,0 -24,0 l12,80 l12,-80z'; //comet svg image
    this.cometScale          = 0.3; //comet size
    this.cometStrokeOpacity  = 1;
    this.cometStrokeColor    = 'dodgerblue';
    this.cometStrokeWeight   = 1;
    this.cometFillOpacity    = 0.9;
    this.cometFillColor      = 'deepskyblue';
    this.cometSpeed          = 10;

    //marker properties for starting and ending markers
    this.markerSymbol        = google.maps.SymbolPath.CIRCLE; //svg image
    this.markerScale         = 2;
    this.markerStrokeColor   = 'dodgerblue';
    this.markerOpacity       = 0.7;
    this.markerFillColor     = 'deepskyblue';
    
    //dashed comet trail properties
    this.dashlineOpacity     = 0.5;
    this.dashlineScale       = 2;
    
    //geodesic
    this.geodesic            = false;
};

/*
* remove everything from the map 
*/
Comet.prototype.removeFromMap = function(){
    this.marker1.setMap(null)
    this.marker2.setMap(null)
    this.geodesicPoly.setMap(null)
    this.distance = null;
}

/*
* resume comet animation
*/
Comet.prototype.resumeTimer = function(object){
    
    object.timer.pause();
    window.setTimeout(function() {
        object.marker2.set("labelVisible", false);
        var icons = object.geodesicPoly.get('icons');
        
        icons[1].icon = object.comet;
        icons[1].offset= '0';
        object.geodesicPoly.set('icons', icons);
        if (object.aniRepeat){
            icons.splice(2,icons.length);
            object.timer.resume();
        }else{
            icons[1].icon = null;
            object.timer.pause();
            if (object.cometRemove){
                object.removeFromMap();
            }
        }
    }, 2000);
};

/*
* start comet animation with setTimeout
*/
Comet.prototype.RecurringTimer = function(callback, delay) {
    var timerId, start, remaining = delay;

    var pause = function(){
        window.clearTimeout(timerId);
        remaining -= new Date() - start;
    };

    var resume = function() {
        start = new Date();
        timerId = window.setTimeout(function() {
            remaining = delay;
            resume();
            callback();
        }, remaining);
  };
  
  this.resume = resume;
  this.pause = pause;
  this.resume();
};


/*
* animate Comet 
*/
Comet.prototype.animateComet = function(object) {
    
    object.count = 0;
    object.timer = new object.RecurringTimer(function() {
        object.count = (object.count + 1) % 100;
        var icons = object.geodesicPoly.get('icons');
        if (object.count==99){
            object.marker2.set("labelVisible", true);
            icons[1].icon = null;
            object.geodesicPoly.set('icons', icons);
            object.resumeTimer(object);
        }
        for (i = 1; i < (object.count); i++) {
            if (i % 2 == 0){
                x = (i/2)+1;    
                icons[x] = {icon: object.dashline};
                icons[x].offset = i + '%';
            }
        }
        icons[1].offset = (object.count) + '%';
        object.geodesicPoly.set('icons', icons);
    }, object.cometSpeed);
};

/*
* initialize markers, polyline and attributes
*/
Comet.prototype.initializeMarkers = function(){
    this.comet = {    
        path            : this.cometSymbol,
        scale           : this.cometScale,
        strokeOpacity   : this.cometStrokeOpacity,
        strokeColor     : this.cometStrokeColor,
        fillOpacity     : this.cometFillOpacity,
        strokeWeight    : this.cometStrokeWeight,
        fillColor       : this.cometFillColor
    };

    this.dashline = {
        path            : 'M 0,-1 0,1',
        strokeOpacity   : this.dashlineOpacity,
        scale           : this.dashlineScale
    };

    this.marker1 = new google.maps.Marker({
      icon: {
        path        : this.markerSymbol,
        scale       : this.markerScale,
        strokeColor : this.markerStrokeColor,
      },
      map: this.map,
      //draggable: true,
      position: {lat: this.lat1, lng: this.lng1}
    });

    this.marker2 = new MarkerWithLabel({
      icon: {
        path        : this.markerSymbol,
        scale       : this.markerScale,
        strokeColor : this.markerStrokeColor,
      },
      map: this.map,
      //draggable: true,
      position: {lat: this.lat2, lng: this.lng2},
      labelClass: "pulsate",
      labelStyle: { 'box-shadow':'0px 0px 1px 2px '+ this.markerFillColor,
                    'height': '40px',    
                    'width': '40px'
                  },
      labelAnchor: new google.maps.Point(20, 20),
      labelVisible: false
    });

    
    this.geodesicPoly = new google.maps.Polyline({
      icons: [{
        icon: this.dashline,
        offset: '0',
        //repeat: '20px'
      },{
        icon: this.comet,
        offset: '100%',
      }],

      strokeColor: this.cometFillColor,
      strokeOpacity: 0,
      strokeWeight: 0,
      geodesic: this.geodesic,
      map: this.map
    });
    
    this.geodesicPoly.setPath([this.marker1.getPosition(), this.marker2.getPosition()]);
    
    var length = google.maps.geometry.spherical.computeDistanceBetween(this.marker1.getPosition(), this.marker2.getPosition());
    this.distance = length/1000;
};

/*
* initialize and animate
*/
Comet.prototype.start = function(){
      this.initializeMarkers();
      this.animateComet(this);  
};