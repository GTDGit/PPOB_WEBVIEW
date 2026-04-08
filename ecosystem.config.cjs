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
        NEXT_PUBLIC_S3_PUBLIC_URL: "https://s3.ap-southeast-3.amazonaws.com/ppob-app",
        S3_PUBLIC_BUCKET: "ppob-app",
        S3_REGION: "ap-southeast-3",
      },
    },
  ],
};
