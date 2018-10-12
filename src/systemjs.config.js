(function (global) {
	System.config({
		paths: {
			'npm:': 'node_modules/',
            'underscore': 'node_modules/underscore/underscore-min.js'
		},
		map: {
			'app': 'app',
			'@angular/core': 'npm:@angular/core/bundles/core.umd.js',
			'@angular/common': 'npm:@angular/common/bundles/common.umd.js',
			'@angular/compiler': 'npm:@angular/compiler/bundles/compiler.umd.js',
			'@angular/platform-browser': 'npm:@angular/platform-browser/bundles/platform-browser.umd.js',
			'@angular/platform-browser-dynamic': 'npm:@angular/platform-browser-dynamic/bundles/platform-browser-dynamic.umd.js',
			'@angular/http': 'npm:@angular/http/bundles/http.umd.js',
			'@angular/router': 'npm:@angular/router/bundles/router.umd.js',
			'@angular/forms': 'npm:@angular/forms/bundles/forms.umd.js',
			'rxjs': 'npm:rxjs',
			'angular-in-memory-web-api': 'npm:angular-in-memory-web-api/bundles/in-memory-web-api.umd.js',
			'@ng-bootstrap/ng-bootstrap': 'npm:@ng-bootstrap/ng-bootstrap/bundles/ng-bootstrap.js',
			'ng2-cookies': 'npm:ng2-cookies/cookie.js',
			'file-saver': 'npm:file-saver',
			'moment': 'npm:moment',
			'd3': 'npm:d3/dist',
			'd3-array': 'npm:d3-array/dist',
			'd3-axis': 'npm:d3-axis/dist',
			'd3-brush': 'npm:d3-brush/dist',
			'd3-chord': 'npm:d3-chord/dist',
			'd3-collection': 'npm:d3-collection/dist',
			'd3-color': 'npm:d3-color/dist',
			'd3-contour': 'npm:d3-contour/dist',
			'd3-dispatch': 'npm:d3-dispatch/dist',
			'd3-drag': 'npm:d3-drag/dist',
			'd3-dsv': 'npm:d3-dsv/dist',
			'd3-ease': 'npm:d3-ease/dist',
			'd3-fetch': 'npm:d3-fetch/dist',
			'd3-force': 'npm:d3-force/dist',
			'd3-format': 'npm:d3-format/dist',
			'd3-geo': 'npm:d3-geo/dist',
			'd3-hierarchy': 'npm:d3-hierarchy/dist',
			'd3-interpolate': 'npm:d3-interpolate/dist',
			'd3-path': 'npm:d3-path/dist',
			'd3-polygon': 'npm:d3-polygon/dist',
			'd3-quadtree': 'npm:d3-quadtree/dist',
			'd3-random': 'npm:d3-random/dist',
			'd3-scale': 'npm:d3-scale/build',
			'd3-scale-chromatic': 'npm:d3-scale-chromatic/dist',
			'd3-selection': 'npm:d3-selection/dist',
			'd3-shape': 'npm:d3-shape/dist',
			'd3-time': 'npm:d3-time/dist',
			'd3-time-format': 'npm:d3-time-format/dist',
			'd3-timer': 'npm:d3-timer/dist',
			'd3-transition': 'npm:d3-transition/dist',
			'd3-voronoi': 'npm:d3-voronoi/dist',
			'd3-zoom': 'npm:d3-zoom/dist',
			'@swimlane/ngx-graph': 'npm:@swimlane/ngx-graph/release/index.js',
			'@swimlane/ngx-charts': 'npm:@swimlane/ngx-charts/release/index.js',
			'@angular/animations': 'npm:@angular/animations/bundles/animations.umd.js',
			'@angular/animations/browser': 'npm:@angular/animations/bundles/animations-browser.umd.js',
			'@angular/platform-browser/animations': 'npm:@angular/platform-browser/bundles/platform-browser-animations.umd.js',
			'lunr': 'npm:lunr/lunr.js'
		},
		packages: {
			app: {
				main: './main.js',
				defaultExtension: 'js',
				meta: {
					'./*.js': {
						loader: 'systemjs-angular-loader.js'
					}
				}
			},
			rxjs: {
				defaultExtension: 'js'
			},
			'file-saver': {
				format: 'global',
				main: 'FileSaver.js',
				defaultExtension: 'js'
			},
			'moment' : {
				format: 'global',
				main: 'moment.js',
				defaultExtension: 'js'
			},
			'd3': {
				main: 'd3.js',
				defaultExtension: 'js'
			},
      'd3-array': {
				main: 'd3-array.js',
        defaultExtension: 'js'
      },
			'd3-axis': {
				main: 'd3-axis.js',
        defaultExtension: 'js'
      },
			'd3-brush': {
				main: 'd3-brush.js',
        defaultExtension: 'js'
      },
			'd3-chord': {
				main: 'd3-chord.js',
        defaultExtension: 'js'
      },
			'd3-collection': {
				main: 'd3-collection.js',
        defaultExtension: 'js'
      },
			'd3-color': {
				main: 'd3-color.js',
        defaultExtension: 'js'
      },
			'd3-contour': {
				main: 'd3-contour.js',
        defaultExtension: 'js'
      },
			'd3-dispatch': {
				main: 'd3-dispatch.js',
        defaultExtension: 'js'
      },
			'd3-drag': {
				main: 'd3-drag.js',
        defaultExtension: 'js'
      },
			'd3-dsv': {
				main: 'd3-dsv.js',
        defaultExtension: 'js'
      },
			'd3-ease': {
				main: 'd3-ease.js',
        defaultExtension: 'js'
      },
			'd3-fetch': {
				main: 'd3-fetch.js',
        defaultExtension: 'js'
      },
			'd3-force': {
				main: 'd3-force.js',
        defaultExtension: 'js'
      },
			'd3-format': {
				main: 'd3-format.js',
        defaultExtension: 'js'
      },
			'd3-geo': {
				main: 'd3-geo.js',
        defaultExtension: 'js'
      },
			'd3-hierarchy': {
				main: 'd3-hierarchy.js',
        defaultExtension: 'js'
      },
			'd3-interpolate': {
				main: 'd3-interpolate.js',
        defaultExtension: 'js'
      },
			'd3-path': {
				main: 'd3-path.js',
        defaultExtension: 'js'
      },
			'd3-polygon': {
				main: 'd3-polygon.js',
        defaultExtension: 'js'
      },
			'd3-quadtree': {
				main: 'd3-quadtree.js',
        defaultExtension: 'js'
      },
			'd3-random': {
				main: 'd3-random.js',
        defaultExtension: 'js'
      },
			'd3-scale': {
				main: 'd3-scale.js',
        defaultExtension: 'js'
      },
			'd3-scale-chromatic': {
				main: 'd3-scale-chromatic.js',
        defaultExtension: 'js'
      },
			'd3-selection': {
				main: 'd3-selection.js',
        defaultExtension: 'js'
      },
			'd3-shape': {
				main: 'd3-shape.js',
        defaultExtension: 'js'
      },
			'd3-time': {
				main: 'd3-time.js',
        defaultExtension: 'js'
      },
			'd3-time-format': {
				main: 'd3-time-format.js',
        defaultExtension: 'js'
      },
			'd3-timer': {
				main: 'd3-timer.js',
        defaultExtension: 'js'
      },
			'd3-transition': {
				main: 'd3-transition.js',
        defaultExtension: 'js'
      },
			'd3-voronoi': {
				main: 'd3-voronoi.js',
        defaultExtension: 'js'
      },
			'd3-zoom': {
				main: 'd3-zoom.js',
        defaultExtension: 'js'
      }
		}
	});
})(this);
