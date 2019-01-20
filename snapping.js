<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no">
<title>Snapping Example - 4.9</title>
  <link rel="stylesheet" href="https://js.arcgis.com/4.9/esri/css/main.css">
  <script src="https://code.jquery.com/jquery-2.2.4.min.js"></script>
  <script src="https://js.arcgis.com/4.9/"></script>
  <style>
    html,
    body,
    #viewDiv {
      padding: 0;
      margin: 0;
      height: 100%;
      width: 100%;
    }
  </style>
  <script>
    require([
      "esri/Map",
      "esri/views/MapView",
      "esri/layers/GraphicsLayer",
      "esri/layers/VectorTileLayer",
      "esri/tasks/support/Query",
      "esri/tasks/QueryTask",
      "esri/views/2d/draw/Draw",
      "esri/symbols/SimpleFillSymbol",
      "esri/geometry/Polygon",
      "esri/Graphic",
      "esri/symbols/SimpleMarkerSymbol",
      "esri/geometry/Point",
      "esri/geometry/SpatialReference"
    ], function(
      Map,MapView,GraphicsLayer,VectorTileLayer,Query,QueryTask,Draw,SimpleFillSymbol,Polygon,
       Graphic,SimpleMarkerSymbol,Point,SpatialReference
    ) {
         const map = new Map({
         basemap: "streets-vector"
      });

      const view = new MapView({
        container: "viewDiv",
        map: map,
        zoom: 19,
        center: [34.78439, 32.08305]
      });
      
      var urlBuildings= "https://gisn.tel-aviv.gov.il/arcgis/rest/services/WM/IView2WM/MapServer/513";
      var graphicsLayerPolygon = new GraphicsLayer();
      var graphicsLayerSnap = new GraphicsLayer();
      var snappingPoints = [];
      var snapVertice = null;
           
      var polygonSymbol = {
          type: "simple-fill",  
          color: [255,0,0,0.1],
          outline: {  
            color: [255, 0, 0],
            width: "1.0px"
          }
       }
       var snapSymbol = {
           type: "simple-marker",  // autocasts as new SimpleMarkerSymbol()
           style: "square",
           color: "transparent",
           size: "8px",  // pixels
           outline: {  // autocasts as new SimpleLineSymbol()
               color: [ 255, 0, 0 ],
               width: 1  // points
           }
       }

       function fillMap()
       {
           var urlVector = "https://tiles.arcgis.com/tiles/PcGFyTym9yKZBRgz/arcgis/rest/services/TelAvivMapEngWm/VectorTileServer";
           var vectorLayer = new VectorTileLayer({
                url: urlVector
            });
            map.add(vectorLayer);     
            map.add(graphicsLayerPolygon);     
            map.add(graphicsLayerSnap);     
            $("#btnStart").mousedown(pressStart);
            view.on("pointer-move", viewMouseMove);
      }
            
      function pressStart()
      {
          graphicsLayerPolygon.removeAll();
          graphicsLayerSnap.removeAll();
          snappingPoints = [];            
        
          var query = new Query();
          query.returnGeometry = true;
          query.geometry = view.extent.expand(1.1);
          var queryTask = new QueryTask(urlBuildings);
          queryTask.execute(query).then(function(results){
              $.each(results.features, function (index, feature) {
                   $.each(feature.geometry.rings, function (index2, pointArray) {
                        $.each(pointArray, function (index3, pnt) {
                           snappingPoints.push(pnt);
                        });
                   });
              });  
              $("#btnStart").html("START (" + snappingPoints.length + ")");
              $("#btnStart").css("border", "2px solid red");
          });
          
          var draw = new Draw({
            view: view
          })
          
          var action = draw.create("polygon");
          action.on("vertex-add", redrawPolygon);
          action.on("cursor-update", redrawPolygon);
          action.on("draw-complete", function(){
             $("#btnStart").html("START");
             $("#btnStart").css("border", "1px solid gray");
             snappingPoints = [];  
             graphicsLayerSnap.removeAll();
          });
      }
      
      function redrawPolygon(evt) {
            var vertices = evt.vertices;
            if (snapVertice) {
                vertices[vertices.length - 1] = snapVertice;
                snapVertice = null;
            }
            var polygon = new Polygon({
                rings: vertices,
                spatialReference: 102100
            });
            
            var graphic = new Graphic({
                geometry: polygon,
                symbol: polygonSymbol
            });

            graphicsLayerPolygon.removeAll();
            graphicsLayerPolygon.add(graphic);
      }
      
      function viewMouseMove(evt)
      {
          if (snappingPoints.length === 0)
            return;
        
          graphicsLayerSnap.removeAll();
          snapVertice = null;
        
          var point = view.toMap({ x: evt.x, y: evt.y });
          var x = point.x;
          var y = point.y;
                         
          var minDist = 999999;
          var tempX = 0;
          var tempY = 0;

          $.each(snappingPoints, function (index, pnt) {
              var dxSnap = x - pnt[0];
              var dySnap = y - pnt[1];
              var d = Math.sqrt(dxSnap * dxSnap + dySnap * dySnap);
              if (d < minDist) {
                  minDist = d;
                  tempX = pnt[0];
                  tempY = pnt[1];
              }
          });
          
          var minDistInScale = view.scale / 400;
          if (minDist < minDistInScale) {
              var pnt = new Point(tempX, tempY, new SpatialReference(102100));
              var g = new Graphic();
              g.geometry = pnt;
              g.symbol = snapSymbol;
              graphicsLayerSnap.add(g);
              snapVertice = [tempX, tempY];
          }
      }

      view.when(fillMap);
    });
  </script>
</head>

<body>
  <div id="viewDiv"></div>
  <button id="btnStart" style="width:110px;height:30px;z-index:100;position:absolute;top:15px;left:60px">START</button>
</body>

</html>