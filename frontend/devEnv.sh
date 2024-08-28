#!/bin/bash

docker run -it --rm -v "$(pwd)":/app -p 6355:3000 node:14-alpine /bin/sh -c "echo http://localhost:6355 && cd /app && yarn dev"