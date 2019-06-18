'use strict';

const webpackMerge = require('webpack-merge');

const commonConfig = require('./webpack.config.common');
const helpers      = require('./helpers');
const { HashedModuleIdsPlugin } = require('webpack');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = webpackMerge(commonConfig, {
    mode: 'development',

    devtool: 'cheap-module-eval-source-map',

    output: {
        path: helpers.root('dist'),
        publicPath: '/',
        filename: '[name].bundle.js',
        chunkFilename: '[id].chunk.js'
    },

    // output: {
    //     path: helpers.root('dist'),
    //     publicPath: '/',
    //     filename: '[hash].js',
    //     chunkFilename: '[id].[hash].chunk.js'
    // },

    // optimization: {
    //     noEmitOnErrors: true,
    //     runtimeChunk: 'single',
    //     splitChunks: {
    //         cacheGroups: {
    //             default: {
    //                 chunks: 'async',
    //                 minChunks: 2,
    //                 priority: 10
    //             },
    //             common: {
    //                 name: 'common',
    //                 chunks: 'async',
    //                 minChunks: 2,
    //                 enforce: true,
    //                 priority: 5
    //             },
    //             vendors: false,
    //             vendor: false
    //         }
    //     },
    //     minimizer: [
    //         new HashedModuleIdsPlugin(),
    //         new UglifyJSPlugin({
    //             sourceMap: true,
    //             cache: true,
    //             parallel: true,
    //             uglifyOptions: {
    //                 safari10: true,
    //                 output: {
    //                     ascii_only: true,
    //                     comments: false,
    //                     webkit: true,
    //                 },
    //                 compress: {
    //                     pure_getters: true,
    //                     passes: 3,
    //                     inline: 3,
    //                 }
    //             }
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
