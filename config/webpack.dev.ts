import { merge } from 'webpack-merge';
import common from './webpack.common';
import webpack from 'webpack';
import path from 'path';
import CopyWebpackPlugin from 'copy-webpack-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin';

export default merge(common,{
    mode: 'development',
    devtool: 'eval-source-map',
    devServer:{
        contentBase: path.resolve(__dirname,'../dist'),
        compress: true,
        host: "localhost",
        port: 9000,
        hot: true,
        //hotOnly:true,
        //overlay: true,
        useLocalIp: false
        // proxy: {
        //     '/socket/**': {
        //         target: 'wss://10.10.3.41:8443',
        //         ws: true,
        //         secure: false,
        //         logLevel: 'debug',
        //     },
        // }
    },
    // resolve:{
    //     alias:{
    //         "three":path.resolve(__dirname,"../src/three.module.js")
    //     }
    // },
    plugins:[
        new webpack.NamedModulesPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new CopyWebpackPlugin({
            patterns:[
                {
                    from:path.resolve(__dirname,"../node_modules/mapbox-gl/dist/mapbox-gl.css"),
                    to:path.resolve(__dirname,"../dist/mapbox-gl.css")
                },
                {
                    from:path.resolve(__dirname,"../node_modules/mapbox-gl/dist/mapbox-gl-dev.js"),
                    to:path.resolve(__dirname,"../dist/mapbox-gl-dev.js")
                }
            ]
        }),
        new HtmlWebpackPlugin({
            title: 'three3d scene',
            filename: "index.html",
            template: path.resolve(__dirname,'../examples/index.html')
        }),
        new HtmlWebpackPlugin({
            title: 'three3d scene',
            filename: "box.html",
            template: path.resolve(__dirname,'../examples/box.html')
        }),
        new HtmlWebpackPlugin({
            title: 'three3d scene',
            filename: "light.html",
            template: path.resolve(__dirname,'../examples/light.html')
        }),
        new HtmlWebpackPlugin({
            title: 'three3d scene',
            filename: "water.html",
            template: path.resolve(__dirname,'../examples/water.html')
        })
    ]
})