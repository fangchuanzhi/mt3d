
import {merge} from 'webpack-merge';
import UglifyJSPlugin from 'uglifyjs-webpack-plugin';
import common from './webpack.common';
import path from 'path';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';

export default merge(common,{
    mode: 'production',
    devtool: 'source-map',
    optimization:{
        minimize:false
    },
    resolve:{
        alias:{
            "three":path.resolve(__dirname,"../node_modules/three/build/three.min.js")
        }
    },
    plugins:[
        new CleanWebpackPlugin(),
        new UglifyJSPlugin({
            sourceMap: true
        })
    ]
}) 