const fs = require('fs');
const path = require("path");

const { Command } = require("commander");
const chalk = require("chalk");
const shell = require("shelljs");
const inquirer = require("inquirer");

const packageJson = require("../package.json");

const program = new Command();

program
  .description(packageJson.name)
  .version(packageJson.version)
  .arguments("[folderName]")
  .usage(`${chalk.green("[folderName]")} [options]`)
  .action((folderName = ".") => {
    const projectName = folderName;
    const projectPath = path.join(process.cwd(), projectName);

    if(projectName !== ".") {
      if(!fs.existsSync(projectPath)) {
        fs.mkdirSync(projectPath);
      } else {
        console.log(
          `The folder ${chalk.red(
            folderName
          )} already exist in the current directory, please give it another name.`
        );
        process.exit(1);
      }
    }
    
    process.chdir(projectPath);

    inquirer
      .prompt([
        {
          type: "list",
          name: "react-environment",
          message: "Select the react environment:",
          choices: ["React + Javascript", "React + Typescript"],
        },
      ])
      .then((answers) => {
        const {
          reactEnvironment
        } = answers;

        const installPackages = ["react", "react-dom", "react-scripts", "babel-loader", "clean-webpack-plugin",
          "css-loader", "file-loader",
          "html-webpack-plugin", "mini-css-extract-plugin", "react-error-overlay", "style-loader",
          "webpack", "webpack-cli", "webpack-dev-server"];
        const devPackages = [
          "@babel/core", "@babel/preset-env", "@babel/preset-react"
        ];

        if (reactEnvironment === "React + TypeScript") {
          installPackages.push("typescript", "ts-loader", "fork-ts-checker-webpack-plugin");
          devPackages.push("@types/react", "@types/react-dom", "@babel/preset-typescript");
        }

        shell.exec(`npm init -y`);
        console.log(chalk.green("Downloading files and packages..."));
        shell.exec(`npm install ${installPackages.join(" ")}`);
        shell.exec(`npm install ${devPackages.join(" ")} --save-dev`);

        if(reactEnvironment === 'React + Typescript') {
          const tsconfig = {
            "compilerOptions": {
            "target": "es6",
            "module": "esnext",
            "moduleResolution": "node",
            "noResolve": false,
            "noImplicitAny": false,
            "removeComments": false,
            "sourceMap": true,
            "allowJs": true,
            "jsx": "react",
            "allowSyntheticDefaultImports": true,
            "resolveJsonModule": true,
          },
            "typeRoots": ["node_modules/@types", "src/@type"],
            "exclude": [
              "node_modules",
              "build",
              "scripts",
              "acceptance-tests",
              "webpack",
              "jest",
              "src/setupTests.ts",
              "./node_modules/**/*"
            ],
            "include": ["./src/**/*", "@type"]
          }
          fs.writeFileSync("tsconfig.json", JSON.stringify(tsconfig, null, 2));
        }

        const webpackConfig = reactEnvironment === 'React + Typescript' ?
          `
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/index.tsx',
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  output: {
    path: path.resolve(__dirname, './dist'), // 결과물 경로
    filename: 'bundle.js', // 결과물 파일명
  },
  devtool: 'eval-cheap-source-map',
  devServer: {
    hot: true,
    devMiddleware: {
      writeToDisk: true,
    },
    client: {
      overlay: true,
    },
    port: 5500,
    host: "localhost",
    historyApiFallback: true
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: '/node_modules/',
        use: [
          'babel-loader',
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
            },
          },
        ],
      },
      {
        test: /\.css$/,
        // use: ['style-loader', 'css-loader'],
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.(jpeg|jpg)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]',
        },
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
    new MiniCssExtractPlugin({ filename: 'app.css' }),
    new ForkTsCheckerWebpackPlugin(),
  ],
};
        ` : `
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  mode: 'development',
  entry: './src/index.jsx',
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  devtool: 'eval-cheap-source-map',
  devServer: {
    hot: true,
    devMiddleware: {
      writeToDisk: true,
    },
    client: {
      overlay: true,
    },
    port: 5500,
    host: "localhost",
    historyApiFallback: true
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: '/node_modules/',
        loader: 'babel-loader',
      },
      {
        test: /\.css$/,
        // use: ['style-loader', 'css-loader'],
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.(jpeg|jpg)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]',
        },
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
    new MiniCssExtractPlugin({ filename: 'app.css' }),
  ],
};
`
;

        const babelConfig = reactEnvironment === 'React + Typescript' ? `
module.exports = {
presets: ['@babel/preset-react', '@babel/preset-env', '@babel/typescript'],
};` : 
`
module.exports = {
presets: ['@babel/preset-react', '@babel/preset-env'],
}; 
`;

        const gitIgnore = `
dist
node_modules
.env
.env.local
.env.development.local
.env.test.local
.env.production.
src/data/
        `;

        fs.writeFileSync("webpack.config.js", webpackConfig);
        fs.writeFileSync(".gitignore", gitIgnore);
        fs.writeFileSync("babel.config.js", babelConfig);

        const packageJsonPath = "package.json";
        const packageJsonContent = fs.readFileSync(packageJsonPath, "utf8");
        const packageJson = JSON.parse(packageJsonContent);

        packageJson.name = projectName;
        packageJson.scripts = {
          "dev": "webpack-dev-server --progress",
          "build": "webpack --pregress",
          "test": "echo \"Error: no test specified\" && exit 1",
          "preinstall": "npx npm-force-resolutions"
        };
        packageJson.main = "index.tsx";

        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

        fs.mkdirSync("src");
        fs.mkdirSync("public");

        const appContent = `
import React from 'react';
import './App.css';

const App = () => {
  return (
    <div className="container">
      <h1>Hello, World!</h1>
    </div>
  );
};

export default App;
        `;

        const indexContent = `
import React from 'react';
import * as ReactDOM from "react-dom/client";
import App from './App';

const rootNode = document.getElementById('root');

ReactDOM.createRoot(rootNode).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
        `;
        
        const appCssContent = `
.container {
  margin: 0 auto;
  background-size: cover;
}
        `;

        if(reactEnvironment === "React + Typescript") {
          fs.writeFileSync("src/index.tsx", indexContent);
          fs.writeFileSync("src/App.tsx", appContent);
        } else {
          fs.writeFileSync("src/index.jsx", indexContent);
          fs.writeFileSync("src/App.jsx", appContent);
        }

        fs.writeFileSync("src/App.css", appCssContent);

        const indexHtmlContent = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>custom cra</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
        `;

        fs.writeFileSync("public/index.html", indexHtmlContent);

        console.log(chalk.green("Your App is ready!"));
      });
  });

program.parse(process.argv);