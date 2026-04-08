module.exports = {
  apps: [
    {
      name: "ppob_webview",
      cwd: "/home/ubuntu/webview",
      script: ".next/standalone/server.js",
      env: {
        NODE_ENV: "production",
        PORT: 3002,
        NEXT_PUBLIC_API_URL: "https://gateway.ppob.id",
      },
    },
  ],
};
