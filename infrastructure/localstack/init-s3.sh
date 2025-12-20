#!/bin/bash
echo "Initializing LocalStack S3..."
if ! awslocal s3api head-bucket --bucket documesh-local 2>/dev/null; then
  echo "Creating bucket documesh-local..."
  awslocal s3 mb s3://documesh-local
else
  echo "Bucket documesh-local already exists."
fi

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
