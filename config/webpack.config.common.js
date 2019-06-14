'use strict';

const CleanWebpackPlugin   = require('clean-webpack-plugin');
const HtmlWebpackPlugin    = require('html-webpack-plugin');
const CopyWebpackPlugin    = require('copy-webpack-plugin');

const helpers              = require('./helpers');
const isDev                = process.env.NODE_ENV !== 'production';

module.exports = {
    entry: {
        vendor: './src/vendor.ts',
        polyfills: './src/polyfills.ts',
        main: isDev ? './src/main.ts' : './src/main.aot.ts'
    },

    resolve: {
        extensions: ['.ts', '.js', '.scss', '.css']
    },

    module: {
        rules: [
            {
                test: /\.html$/,
                loader: 'html-loader'
            },
            {
                test: /\.(scss|sass)$/,
                use: [
                    { loader: 'style-loader', options: { sourceMap: isDev } },
                    { loader: 'css-loader', options: { sourceMap: isDev } },
                    { loader: 'sass-loader', options: { sourceMap: isDev } }
                ],
                include: helpers.root('src', 'assets')
            },
            {
                test: /\.css$/,
                use: [
                    'to-string-loader',
                    "style-loader",
                    'css-loader'
                ]
            },
            {
                test: /\.(jpg|png|webp|gif|otf|eot|ttf|woff|woff2|ani|svg)$/,
                loader: 'file-loader',
                options: {
                    name: '[name].[ext]',
                    // include: './src/assets/images',
                    // outputPath: 'images',
                    // publicPath: 'images'
                }

            },
        ]
    },

    plugins: [
        new CopyWebpackPlugin([{
            from: './src/assets/',
            to: 'assets/'
        }]),

        new CleanWebpackPlugin(
            helpers.root('dist'), { root: helpers.root(), verbose: true }),

        new HtmlWebpackPlugin({
            template: 'src/index.html'
        })
    ]
};
