const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: process.env.NODE_ENV || "development",
  entry: {
    popup: "./src/pages/popup/popup.js",
    options: "./src/pages/options/options.js",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      // Add more loaders as needed (e.g., for images, fonts)
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "src/manifest.json", to: "manifest.json" },
        { from: "src/assets/*.png", to: "[name][ext]" },
        // Add other static assets
      ],
    }),
    new HtmlWebpackPlugin({
      template: "src/pages/popup/popup.html",
      filename: "popup.html",
      chunks: ["popup"],
    }),
    new HtmlWebpackPlugin({
      template: "src/pages/options/options.html",
      filename: "options.html",
      chunks: ["options"],
    }),
  ],
  resolve: {
    extensions: [".js"],
  },
};
