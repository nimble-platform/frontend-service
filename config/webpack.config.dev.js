'use strict';

const webpackMerge = require('webpack-merge');

const commonConfig = require('./webpack.config.common');
const helpers      = require('./helpers');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const UglifyJsPlugin          = require('uglifyjs-webpack-plugin');
const cssnano                 = require('cssnano');

module.exports = webpackMerge(commonConfig, {
    mode: 'development',

    devtool: 'cheap-module-eval-source-map',

    output: {
        path: helpers.root('dist'),
        publicPath: '/',
        filename: '[name].bundle.js',
        chunkFilename: '[id].chunk.js'
    },

    // optimization: {
    //     noEmitOnErrors: true,
    //     splitChunks: {
    //         chunks: 'all'
    //     },
    //     runtimeChunk: 'single',
    //     minimizer: [
    //         new UglifyJsPlugin({
    //             cache: true,
    //             parallel: true
    //         }),
    //
    //         new OptimizeCSSAssetsPlugin({
    //             cssProcessor: cssnano,
    //             cssProcessorOptions: {
    //                 discardComments: {
    //                     removeAll: true
    //                 }
    //             },
    //             canPrint: false
    //         })
    //     ]
    // },

    module: {
        rules: [
            {
                test: /\.ts$/,
                loaders: [
                    {
                        loader: 'awesome-typescript-loader',
                        options: {
                            configFileName: helpers.root('tsconfig.json')
                        }
                    },
                    'angular2-template-loader',
                    'angular-router-loader'
                ],
                exclude: [/node_modules/]
            }
        ]
    },

    devServer: {
        historyApiFallback: true,
        stats: 'minimal'
    }
});
