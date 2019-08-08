'use strict';

const CleanWebpackPlugin   = require('clean-webpack-plugin');
const HtmlWebpackPlugin    = require('html-webpack-plugin');
const CopyWebpackPlugin    = require('copy-webpack-plugin');
const { IndexHtmlWebpackPlugin } = require('@angular-devkit/build-angular/src/angular-cli-files/plugins/index-html-webpack-plugin');


const helpers              = require('./helpers');
const isDev                = process.env.NODE_ENV !== 'production';
var path = require('path');

module.exports = {
    entry: {
        polyfills: './src/polyfills.ts',
        main: isDev ? './src/main.ts' : './src/main.ts',
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
                    { loader: 'style-loader'},
                    { loader: 'css-loader'},
                    { loader: 'sass-loader'}
                ],
                include: helpers.root('src', 'assets')
            },
            {
                test: /\.css$/,
                use: ['to-string-loader', 'css-loader'],
                exclude: [path.resolve(__dirname, './src/styles.css')]
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
        new CopyWebpackPlugin([
            {from: './src/assets/webfonts/',to: 'assets/webfonts/'},
            {from: './src/assets/images/',to: 'assets/'},
            {from: './src/assets/pdf/',to: 'assets/'},
            {from: './src/assets/css/',to: 'assets/css'},
			{from: './src/assets/js/',to: 'assets/js'},
			{from: './src/lib/bpe/js',to: 'lib/bpe/js'},
			{from: './src/locale',to: 'locale'},
			{from: './src/main',to: 'main'},
            {from: './src/health.json',to: './'},
			{from: './src/messages.xlf',to: './'},
			{from: './src/favicon.ico',to: './'}
        ]),

        new CleanWebpackPlugin(
            helpers.root('dist'), { root: helpers.root(), verbose: true }),

        new HtmlWebpackPlugin({
            template: 'src/index.html'
        })
    ]
};
