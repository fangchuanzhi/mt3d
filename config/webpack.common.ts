import path from 'path';

import * as webpack from 'webpack';

export default {
    entry: {
        mt3d:path.resolve(__dirname,'../src/index.ts')
    },
    output:{
        filename:"[name].js",
        path:path.resolve(__dirname,'../dist'),
        publicPath: '/',
        umdNamedDefine:true,
        library: '[name]',
        libraryTarget: 'umd'
    },
    resolve:{
        extensions:['.js','.ts']
    },
    plugins:[
    ],
    module:{
        rules:[
            {
                test:/\.(png|svg|jpg|gif)$/,
                use: [
                    'file-loader'
                ]
            },
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    }
} as webpack.Configuration