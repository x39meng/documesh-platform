#!/bin/bash
echo "Initializing LocalStack S3..."
awslocal s3 mb s3://documesh-local

echo "Configuring CORS..."
awslocal s3api put-bucket-cors --bucket documesh-local --cors-configuration '{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedOrigins": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}'

echo "S3 bucket 'documesh-local' created and configured."
