'use strict';

const webpackMerge = require('webpack-merge');

const commonConfig = require('./webpack.config.common');
const helpers      = require('./helpers');

const { CleanCssWebpackPlugin } = require('@angular-devkit/build-angular/src/angular-cli-files/plugins/cleancss-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const { AngularCompilerPlugin } = require('@ngtools/webpack');
const { SuppressExtractedTextChunksWebpackPlugin } = require('@angular-devkit/build-angular/src/angular-cli-files/plugins/suppress-entry-chunks-webpack-plugin');
const { HashedModuleIdsPlugin } = require('webpack');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const ProgressPlugin = require('webpack/lib/ProgressPlugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const rxPaths = require('rxjs/_esm5/path-mapping');
const { resolve } = require('path');


module.exports = webpackMerge(commonConfig, {
    mode: 'production',

    devtool: 'cheap-module-eval-source-map',

    output: {
        path: helpers.root('dist'),
        publicPath: '/',
        filename: '[hash].js',
        chunkFilename: '[id].[hash].chunk.js'
    },

    optimization: {
        noEmitOnErrors: true,
        runtimeChunk: 'single',
        splitChunks: {
            cacheGroups: {
                default: {
                    chunks: 'async',
                    minChunks: 2,
                    priority: 10
                },
                common: {
                    name: 'common',
                    chunks: 'async',
                    minChunks: 2,
                    enforce: true,
                    priority: 5
                },
                vendors: false,
                vendor: false
            }
        },
        minimizer: [
            new HashedModuleIdsPlugin(),
            new UglifyJSPlugin({
                sourceMap: true,
                cache: true,
                parallel: true,
                uglifyOptions: {
                    safari10: true,
                    output: {
                        ascii_only: true,
                        comments: false,
                        webkit: true,
                    },
                    compress: {
                        pure_getters: true,
                        passes: 3,
                        inline: 3,
                    }
                }
            }),
            new CleanCssWebpackPlugin({
                sourceMap: true,
                test: (file) => /\.(?:css)$/.test(file),
            })
        ]
    },


    module: {
        rules: [
            {
                test: /\.ts$/,
                use: '@ngtools/webpack'
            },
            {
                test: /\.js$/,
                loader: '@angular-devkit/build-optimizer/webpack-loader',
                options: { sourceMap: true }
            },
            // {
            //     test: /\.js$/,
            //     exclude: /(ngfactory|ngstyle).js$/,
            //     enforce: 'pre',
            //     use: 'source-map-loader'
            // },
            // This hides some deprecation warnings that Webpack throws
            {
                test: /[\/\\]@angular[\/\\]core[\/\\].+\.js$/,
                parser: { system: true },
            }
        ]
    },



    plugins: [

        new AngularCompilerPlugin({
            mainPath: resolve('./src/main.ts'),
            sourceMap: true,
            nameLazyFiles: false,
            tsConfigPath: resolve('./tsconfig.json'),
            skipCodeGeneration: false,
            // hostReplacementPaths: {
            //     [resolve('src/environments/environment.ts')]: resolve('src/environments/environment.prod.ts')
            // }
        }),

        new MiniCssExtractPlugin({ filename: '[name].css' }),

        new SuppressExtractedTextChunksWebpackPlugin(),

        new ProgressPlugin(),

        new CircularDependencyPlugin({
            exclude: /[\\\/]node_modules[\\\/]/
        }),
    ]
});
