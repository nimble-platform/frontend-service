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
			'@swimlane/ngx-graph': 'npm:@swimlane/ngx-graph/release/index.js',
            '@swimlane/ngx-charts': 'npm:@swimlane/ngx-charts/release/index.js',
			'@angular/animations': 'npm:@angular/animations/bundles/animations.umd.js',
            '@angular/animations/browser': 'npm:@angular/animations/bundles/animations-browser.umd.js',
            '@angular/platform-browser/animations': 'npm:@angular/platform-browser/bundles/platform-browser-animations.umd.js',
			'd3-array': 'npm:d3-array/build',
			'd3-brush': 'npm:d3-brush/build',
            'd3-color': 'npm:d3-color/build',
            'd3-force': 'npm:d3-force/build',
			'd3-format': 'npm:d3-format/build',
            'd3-hierarchy': 'npm:d3-hierarchy/dist',
            'd3-interpolate': 'npm:d3-interpolate/build',
			'd3-scale': 'npm:d3-scale/dist',
			'd3-selection': 'npm:d3-selection/dist',
			'd3-shape': 'npm:d3-shape/build',
			'd3-time-format': 'npm:d3-time-format/build',
			'd3-dispatch': 'npm:d3-dispatch/build',
			'd3-drag': 'npm:d3-drag/build',
			'd3-transition': 'npm:d3-transition/build',
			'd3-quadtree': 'npm:d3-quadtree/build',
			'd3-collection': 'npm:d3-collection/build',
			'd3-timer': 'npm:d3-timer/build',
			'd3-time': 'npm:d3-time/build',
			'd3-path': 'npm:d3-path/build',
			'd3-ease': 'npm:d3-ease/build'
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
			'd3-brush': {
				main: 'd3-brush.js',
				defaultExtension: 'js'
			},
			'd3-color': {
				main: 'd3-color.js',
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
            'd3-hierarchy': {
				main: 'd3-hierarchy',
                defaultExtension: 'js'
            },
            'd3-interpolate': {
				main: 'd3-interpolate.js',
                defaultExtension: 'js'
            },
            'd3-scale': {
				main: 'd3-scale.js',
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
			'd3-time-format': {
				main: 'd3-time-format.js',
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
			'd3-transition': {
				main: 'd3-transition.js',
				defaultExtension: 'js'
			},
            'd3-quadtree': {
                main: 'd3-quadtree.js',
                defaultExtension: 'js'
            },
            'd3-collection': {
                main: 'd3-collection.js',
                defaultExtension: 'js'
            },
            'd3-timer': {
                main: 'd3-timer.js',
                defaultExtension: 'js'
            },
            'd3-time': {
                main: 'd3-time.js',
                defaultExtension: 'js'
            },
            'd3-path': {
                main: 'd3-path.js',
                defaultExtension: 'js'
            },
            'd3-ease': {
                main: 'd3-ease.js',
                defaultExtension: 'js'
            },
		}
	});
})(this);